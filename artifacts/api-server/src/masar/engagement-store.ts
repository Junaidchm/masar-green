import { sql, one, run, all, type Row } from "./store";
import { createHash } from "node:crypto";

sql.exec(`
CREATE TABLE IF NOT EXISTS campaigns (
 id INTEGER PRIMARY KEY, owner_id INTEGER NOT NULL REFERENCES users(id), data TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending', simulated INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS placement_events (
 campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
 session_hash TEXT NOT NULL, kind TEXT NOT NULL, created_at TEXT NOT NULL,
 PRIMARY KEY(campaign_id,session_hash,kind)
);
CREATE TABLE IF NOT EXISTS sponsorship_enquiries (
 id INTEGER PRIMARY KEY, owner_id INTEGER NOT NULL REFERENCES users(id), data TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS service_alerts (
 id INTEGER PRIMARY KEY, data TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1,
 simulated INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS alert_reads (
 alert_id INTEGER NOT NULL REFERENCES service_alerts(id) ON DELETE CASCADE,
 user_id INTEGER NOT NULL REFERENCES users(id), revision INTEGER NOT NULL,
 PRIMARY KEY(alert_id,user_id)
);
CREATE TABLE IF NOT EXISTS feedback_tickets (
 id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), reference TEXT NOT NULL UNIQUE,
 data TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'submitted', created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS feedback_replies (
 id INTEGER PRIMARY KEY, ticket_id INTEGER NOT NULL REFERENCES feedback_tickets(id) ON DELETE CASCADE,
 body TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS campaigns_owner ON campaigns(owner_id);
CREATE INDEX IF NOT EXISTS feedback_owner ON feedback_tickets(user_id);
CREATE TABLE IF NOT EXISTS feedback_workspaces (
 token_hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL
);
`);
// Existing unscoped records are quarantined, not exposed to a public demo login.
if (!(sql.pragma("table_info(feedback_tickets)") as Row[]).some(r => r.name === "workspace_hash")) {
  sql.exec("ALTER TABLE feedback_tickets ADD COLUMN workspace_hash TEXT");
}
sql.exec("CREATE INDEX IF NOT EXISTS feedback_workspace ON feedback_tickets(workspace_hash,user_id)");
if (!(sql.pragma("table_info(sponsorship_enquiries)") as Row[]).some(r => r.name === "workspace_hash")) {
  sql.exec("ALTER TABLE sponsorship_enquiries ADD COLUMN workspace_hash TEXT");
}

export const nowIso = () => new Date().toISOString();
export function active(data: Row) {
  const now = Date.now();
  return Date.parse(data.publishedAt ?? data.startsAt) <= now && Date.parse(data.expiresAt ?? data.endsAt) > now;
}
export function validDates(start: string, end: string) {
  return Number.isFinite(Date.parse(start)) && Number.isFinite(Date.parse(end)) && Date.parse(start) < Date.parse(end)
    && /T/.test(start) && /T/.test(end);
}
export function safeUrl(value: string, optional = false) {
  if (optional && !value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !!url.hostname
      && !/^(localhost|127\.|0\.|169\.254\.|10\.|192\.168\.|\[)/i.test(url.hostname);
  } catch { return false; }
}
export const sessionHash = (value: string) => createHash("sha256").update(value).digest("hex");
export function campaign(row: Row) {
  const stats = one("SELECT SUM(kind='impression') impressions,SUM(kind='click') clicks FROM placement_events WHERE campaign_id=?", row.id)!;
  return { ...JSON.parse(row.data), id: row.id, status: row.status, simulated: !!row.simulated, impressions: stats.impressions ?? 0, clicks: stats.clicks ?? 0 };
}
export function alert(row: Row, userId: number) {
  const read = one("SELECT revision FROM alert_reads WHERE alert_id=? AND user_id=?", row.id, userId);
  return { ...JSON.parse(row.data), id: row.id, simulated: !!row.simulated, read: read?.revision === row.revision };
}
export function ticket(row: Row) {
  return { ...JSON.parse(row.data), id: row.id, reference: row.reference, status: row.status, createdAt: row.created_at,
    replies: all("SELECT id,body,created_at createdAt FROM feedback_replies WHERE ticket_id=? ORDER BY id", row.id) };
}

// Idempotent examples: explicit simulation labels, never reinsert after editing.
if (!one("SELECT key FROM app_meta WHERE key='engagement_examples'")) {
  sql.transaction(() => {
    const start = new Date(Date.now() - 3600000).toISOString();
    const end = new Date(Date.now() + 30 * 86400000).toISOString();
    const employer = one("SELECT id FROM users WHERE role='employer' ORDER BY id LIMIT 1");
    if (employer) {
      for (const placement of ["dashboard", "community"]) {
        run("INSERT INTO campaigns(owner_id,data,status,simulated) VALUES (?,?,'published',1)", employer.id, JSON.stringify({
          advertiser: "Loop Mobility · demo", title: "A greener last mile", description: "Explore bike and scooter connections after your metro journey. Simulated sponsorship placement.",
          destinationUrl: "https://www.visitdubai.com/", imageUrl: "", placement, startsAt: start, endsAt: end, budgetAed: 1500,
        }));
      }
    }
    run("INSERT INTO service_alerts(data,simulated) VALUES (?,1)", JSON.stringify({
      title: "Demo: Red Line service delay", body: "Simulated notice: allow an extra 10 minutes on the Red Line. This is not a live transport update.",
      titleAr: "تجريبي: تأخير في الخط الأحمر", bodyAr: "إشعار محاكاة: خصص عشر دقائق إضافية للخط الأحمر. هذا ليس تحديثاً مباشراً لخدمات النقل.",
      severity: "warning", category: "delay", audience: "line", service: "Red Line", status: "published", publishedAt: start, expiresAt: end,
    }));
    run("INSERT INTO service_alerts(data,simulated) VALUES (?,1)", JSON.stringify({
      title: "Welcome to the service inbox", body: "All notices in this prototype are simulated. Check official channels before travelling.",
      titleAr: "مرحباً في صندوق إشعارات الخدمة", bodyAr: "جميع الإشعارات في هذا النموذج محاكاة. تحقق من القنوات الرسمية قبل السفر.",
      severity: "info", category: "general", audience: "all", service: "", status: "published", publishedAt: start, expiresAt: end,
    }));
    run("INSERT INTO app_meta VALUES ('engagement_examples','seeded')");
  })();
}
