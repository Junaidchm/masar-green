import { after, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// Keep the developer's data untouched: store initialization uses this temp cwd.
const originalCwd = process.cwd();
const temp = mkdtempSync(path.join(tmpdir(),"masar-referrals-"));
process.chdir(temp);
const { sql,run,one,insertTrip } = await import("../src/masar/store");
const { plan } = await import("../src/masar/planner");
const { attachReferral,referralSummary,rewardFirstVerifiedReferral } = await import("../src/masar/referrals");
after(()=>{sql.close();process.chdir(originalCwd);rmSync(temp,{recursive:true,force:true});});
const user = ()=>Number(run("INSERT INTO users (name) VALUES ('Referral unit test')").lastInsertRowid);
const journey = (id:number,status="verified")=>insertTrip(id,plan(1,2)[0]!,new Date().toISOString(),status,95);
const bonus = (id:number)=>one("SELECT COALESCE(SUM(credits),0) n FROM green_ledger WHERE user_id=? AND type='bonus'",id)!.n;

test("stable personal codes and owner-only anonymous summary",()=>{
  const a=user(),b=user(),code=referralSummary(a).code;
  assert.match(code!,/^[A-F0-9]{12}$/);
  assert.equal(referralSummary(a).code,code);
  assert.notEqual(referralSummary(b).code,code);
  attachReferral(b,code!);
  assert.equal(referralSummary(a).pendingCount,1);
  assert.equal(referralSummary(b).joinedCount,0);
  assert.equal(referralSummary(b).invitedByReferral,true);
  assert.deepEqual(Object.keys(referralSummary(a).referrals[0]!).sort(),["id","joinedAt","rewardCredits","rewardedAt","status"]);
});
test("pending trips do not qualify; first verified trip credits inviter exactly once",()=>{
  const inviter=user(),friend=user(),code=referralSummary(inviter).code!;
  attachReferral(friend,code);
  const pending=journey(friend,"pending review");
  assert.equal(rewardFirstVerifiedReferral(friend,pending),false);
  assert.equal(bonus(inviter),0);
  const verified=journey(friend);
  assert.equal(rewardFirstVerifiedReferral(friend,verified),true);
  assert.equal(bonus(inviter),100);
  assert.equal(rewardFirstVerifiedReferral(friend,verified),false);
  assert.equal(rewardFirstVerifiedReferral(friend,journey(friend)),false);
  assert.equal(bonus(inviter),100);
  const summary=referralSummary(inviter);
  assert.equal(summary.rewardedCount,1);
  assert.equal(summary.creditsEarned,100);
  assert.equal(summary.pendingCount,0);
  assert.equal(bonus(friend),0);
  const ledger=one("SELECT * FROM green_ledger WHERE user_id=? AND type='bonus'",inviter)!;
  assert.equal(ledger.remaining,100);
  assert.ok(new Date(ledger.expires_at).getTime()>Date.now()+364*86400000);
});
test("reject self referrals, bad codes, existing onboarded accounts and reassignment",()=>{
  const a=user(),b=user(),c=user(),code=referralSummary(a).code!;
  assert.throws(()=>attachReferral(a,code));
  assert.throws(()=>attachReferral(b,"BADBADBADBAD"));
  run("UPDATE users SET onboarded=1 WHERE id=?",b);
  assert.throws(()=>attachReferral(b,code));
  attachReferral(c,code);
  assert.throws(()=>attachReferral(c,referralSummary(b).code!));
  assert.equal(referralSummary(a).joinedCount,1);
});
test("qualification and wallet bonus roll back together if trip completion fails",()=>{
  const inviter=user(),friend=user();
  attachReferral(friend,referralSummary(inviter).code!);
  const trip=journey(friend);
  assert.throws(()=>sql.transaction(()=>{rewardFirstVerifiedReferral(friend,trip);throw new Error("simulate failed completion");})());
  assert.equal(bonus(inviter),0);
  assert.equal(referralSummary(inviter).pendingCount,1);
  assert.equal(rewardFirstVerifiedReferral(friend,trip),true);
  assert.equal(bonus(inviter),100);
});
test("deleting trip history cannot reset a rewarded referral",()=>{
  const inviter=user(),friend=user();
  attachReferral(friend,referralSummary(inviter).code!);
  const first=journey(friend);
  assert.equal(rewardFirstVerifiedReferral(friend,first),true);
  run("DELETE FROM trip_legs WHERE trip_id=?",first);
  run("DELETE FROM trips WHERE id=?",first);
  assert.equal(rewardFirstVerifiedReferral(friend,journey(friend)),false);
  assert.equal(bonus(inviter),100);
});
