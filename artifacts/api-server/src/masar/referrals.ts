import { randomBytes } from "node:crypto";
import { all, one, run, sql } from "./store";

export const REFERRAL_REWARD = 100;
sql.exec(`
CREATE TABLE IF NOT EXISTS referral_codes (
 user_id INTEGER PRIMARY KEY REFERENCES users(id),
 code TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS referrals (
 id INTEGER PRIMARY KEY,
 inviter_id INTEGER NOT NULL REFERENCES users(id),
 invitee_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
 joined_at TEXT NOT NULL,
 rewarded_at TEXT,
 reward_credits INTEGER NOT NULL DEFAULT 0,
 qualified_trip_id INTEGER,
 reward_ledger_id INTEGER UNIQUE REFERENCES green_ledger(id),
 CHECK(inviter_id <> invitee_id)
);
CREATE INDEX IF NOT EXISTS referrals_inviter ON referrals(inviter_id);
`);

const invalid = () => Object.assign(new Error("rf.invalid"), { status: 400 });
export function referralOwner(code: string) {
  const owner = one("SELECT c.user_id FROM referral_codes c JOIN users u ON u.id=c.user_id WHERE c.code=? AND u.role='commuter'", code);
  if (!owner) throw invalid();
  return Number(owner.user_id);
}

// Called only within the transaction that creates a genuinely new demo card.
export function attachReferral(inviteeId: number, code: string) {
  const inviterId = referralOwner(code);
  if (inviterId === inviteeId) throw invalid();
  const invitee = one("SELECT role,onboarded FROM users WHERE id=?", inviteeId);
  if (!invitee || invitee.role !== "commuter" || invitee.onboarded || one("SELECT id FROM trips WHERE user_id=?", inviteeId))
    throw Object.assign(new Error("rf.existing"), { status: 409 });
  run("INSERT INTO referrals (inviter_id,invitee_id,joined_at) VALUES (?,?,?)", inviterId, inviteeId, new Date().toISOString());
}

export function referralSummary(userId: number) {
  let code = one("SELECT code FROM referral_codes WHERE user_id=?", userId)?.code as string | undefined;
  if (!code) {
    code = randomBytes(6).toString("hex").toUpperCase();
    run("INSERT INTO referral_codes (user_id,code) VALUES (?,?) ON CONFLICT(user_id) DO NOTHING", userId, code);
    code = one("SELECT code FROM referral_codes WHERE user_id=?", userId)!.code;
  }
  const referrals = all("SELECT * FROM referrals WHERE inviter_id=? ORDER BY id DESC", userId).map(r => ({
    id:r.id, status:r.rewarded_at ? "rewarded" : "pending", joinedAt:r.joined_at,
    rewardedAt:r.rewarded_at, rewardCredits:r.reward_credits,
  }));
  const rewarded = referrals.filter(r => r.status === "rewarded");
  return {
    code, rewardCredits:REFERRAL_REWARD, joinedCount:referrals.length,
    pendingCount:referrals.length-rewarded.length, rewardedCount:rewarded.length,
    creditsEarned:rewarded.reduce((n,r) => n+r.rewardCredits,0), referrals,
    invitedByReferral:!!one("SELECT id FROM referrals WHERE invitee_id=?",userId),
  };
}

// Nested in trip completion: qualification, bonus and audit record commit together.
// No FK on qualified_trip_id: deleting journey history must not reset eligibility.
export const rewardFirstVerifiedReferral = sql.transaction((inviteeId:number, tripId:number) => {
  const referral = one("SELECT * FROM referrals WHERE invitee_id=? AND rewarded_at IS NULL", inviteeId);
  if (!referral) return false;
  const trip = one("SELECT id FROM trips WHERE id=? AND user_id=? AND status='verified'",tripId,inviteeId);
  if (!trip || one("SELECT COUNT(*) n FROM trips WHERE user_id=? AND status='verified'",inviteeId)!.n !== 1) return false;
  const at = new Date().toISOString(), expiry = new Date(at);
  expiry.setUTCFullYear(expiry.getUTCFullYear()+1);
  const ledger = run(`INSERT INTO green_ledger
    (user_id,trip_id,type,credits,description,created_at,expires_at,remaining)
    VALUES (?,NULL,'bonus',?,'Referral reward · first verified trip (simulated)',?,?,?)`,
    referral.inviter_id,REFERRAL_REWARD,at,expiry.toISOString(),REFERRAL_REWARD);
  run("UPDATE referrals SET rewarded_at=?,reward_credits=?,qualified_trip_id=?,reward_ledger_id=? WHERE id=? AND rewarded_at IS NULL",
    at,REFERRAL_REWARD,tripId,Number(ledger.lastInsertRowid),referral.id);
  return true;
});
