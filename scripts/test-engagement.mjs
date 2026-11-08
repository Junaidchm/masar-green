/**
 * Development-only integration smoke test. Uses seeded demo accounts, creates
 * uniquely named records and removes only its own fixtures in finally.
 * Run: node scripts/test-engagement.mjs
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(path.resolve("artifacts/api-server/package.json"));
const Database = require("better-sqlite3");
const db = new Database(path.resolve("data/masar-green.sqlite"));
const base = `https://${process.env.REPLIT_DEV_DOMAIN}/api`;
const fixtures = { campaigns: [], alerts: [], feedback: [], enquiries: [] };
const accounts = {};
let workspaceCookie;
async function request(url, method = "GET", data, cookie) {
  const r = await fetch(base + url, {
    method, headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const cookies = r.headers.getSetCookie().map(c => c.split(";")[0]);
  return { status: r.status, data: await r.json(), cookie: cookies.find(c => c.startsWith("masar_session=")), workspace: cookies.find(c => c.startsWith("masar_feedback_workspace=")) };
}
async function call(account, url, method = "GET", data, status = 200) {
  const cookie = [accounts[account], workspaceCookie].filter(Boolean).join("; ");
  const r = await request(url, method, data, cookie);
  if (r.workspace) workspaceCookie = r.workspace;
  assert.equal(r.status, status, `${method} ${url}: ${JSON.stringify(r.data)}`);
  return r.data;
}
const suffix = randomUUID().slice(0, 8);
try {
  for (const [name, cardNumber, pin] of [
    ["commuter", "12345678", "1111"], ["other", "11223344", "3333"],
    ["employer", "55667788", "4444"], ["city", "99887766", "5555"],
  ]) {
    const r = await request("/auth/login", "POST", { cardNumber, pin });
    assert.equal(r.status, 200); assert.ok(r.cookie); accounts[name] = r.cookie;
    if (!workspaceCookie) workspaceCookie = r.workspace;
  }
  await call("guest", "/service-alerts", "GET", undefined, 401);
  await call("guest", "/feedback", "GET", undefined, 401);
  await call("commuter", "/campaigns", "GET", undefined, 403);
  const input = {
    advertiser: `Smoke ${suffix}`, title: `Test sponsorship ${suffix}`,
    description: "Development-only sponsorship verification.",
    destinationUrl: "https://example.com/", imageUrl: "", placement: "dashboard",
    startsAt: new Date(Date.now() - 60000).toISOString(),
    endsAt: new Date(Date.now() + 3600000).toISOString(), budgetAed: 100,
  };
  await call("employer", "/campaigns", "POST", { ...input, destinationUrl: "javascript:alert(1)" }, 400);
  const c = await call("employer", "/campaigns", "POST", input, 201); fixtures.campaigns.push(c.id);
  assert.equal(c.status, "pending");
  assert.ok(!(await call("guest", "/sponsored-placements")).some(p => p.id === c.id));
  await call("employer", `/campaigns/${c.id}/status`, "PATCH", { status: "published" }, 403);
  await call("city", `/campaigns/${c.id}/status`, "PATCH", { status: "published" });
  const publicCampaign = (await call("guest", "/sponsored-placements")).find(p => p.id === c.id);
  assert.ok(publicCampaign); assert.equal(publicCampaign.budgetAed, undefined); assert.equal(publicCampaign.ownerId, undefined);
  const sessionKey = randomUUID();
  for (const kind of ["impression", "impression", "click", "click"])
    await call("guest", `/sponsored-placements/${c.id}/events`, "POST", { kind, sessionKey });
  const metrics = (await call("employer", "/campaigns")).find(p => p.id === c.id);
  assert.equal(metrics.impressions, 1); assert.equal(metrics.clicks, 1);
  await call("city", `/campaigns/${c.id}/status`, "PATCH", { status: "paused" });
  assert.ok(!(await call("guest", "/sponsored-placements")).some(p => p.id === c.id));
  const en = await call("employer", "/sponsorship-enquiries", "POST", {
    company: `Smoke ${suffix}`, contactName: "Demo Contact", email: "demo@example.com", placement: "community", message: "Development-only enquiry, no external delivery.",
  }, 201); fixtures.enquiries.push(en.id);
  assert.ok(!(await call("other", "/sponsorship-enquiries")).some(e => e.id === en.id));
  assert.ok((await call("city", "/sponsorship-enquiries")).some(e => e.id === en.id));
  const alertInput = {
    title: `Test notice ${suffix}`, body: "Development notice, not a real disruption.",
    titleAr: "إشعار تجريبي للاختبار", bodyAr: "هذا إشعار تجريبي وليس تعطيلاً حقيقياً للخدمة.",
    severity: "warning", category: "delay", audience: "line", service: "Red Line", status: "draft",
    publishedAt: input.startsAt, expiresAt: input.endsAt,
  };
  await call("commuter", "/service-alerts", "POST", alertInput, 403);
  await call("city", "/service-alerts", "POST", { ...alertInput, service: "not-a-line" }, 400);
  const a = await call("city", "/service-alerts", "POST", alertInput, 201); fixtures.alerts.push(a.id);
  assert.ok(!(await call("commuter", "/service-alerts")).some(x => x.id === a.id));
  await call("city", `/service-alerts/${a.id}`, "PATCH", { ...alertInput, status: "published" });
  assert.equal((await call("commuter", "/service-alerts")).find(x => x.id === a.id).read, false);
  await call("commuter", `/service-alerts/${a.id}/read`, "POST");
  assert.equal((await call("commuter", "/service-alerts")).find(x => x.id === a.id).read, true);
  assert.equal((await call("other", "/service-alerts")).find(x => x.id === a.id).read, false);
  await call("city", `/service-alerts/${a.id}`, "PATCH", { ...alertInput, status: "published", title: `Updated ${suffix}` });
  assert.equal((await call("commuter", "/service-alerts")).find(x => x.id === a.id).read, false);
  await call("city", `/service-alerts/${a.id}`, "PATCH", {
    ...alertInput, status: "published", publishedAt: new Date(Date.now() - 120000).toISOString(), expiresAt: new Date(Date.now() - 60000).toISOString(),
  });
  assert.ok(!(await call("commuter", "/service-alerts")).some(x => x.id === a.id));
  const f = await call("commuter", "/feedback", "POST", {
    kind: "suggestion", category: "accessibility", station: "", subject: `Test suggestion ${suffix}`,
    description: "Development-only feedback to verify private tracking and staff replies.",
  }, 201); fixtures.feedback.push(f.id); assert.match(f.reference, /^MG-/);
  assert.ok(!(await call("other", "/feedback")).some(x => x.id === f.id));
  assert.ok(!(await call("employer", "/feedback")).some(x => x.id === f.id));
  await call("commuter", `/feedback/${f.id}/review`, "PATCH", { status: "resolved" }, 403);
  await call("city", `/feedback/${f.id}/review`, "PATCH", { status: "in_review", reply: "Thank you. Demo staff are reviewing this suggestion." });
  const saved = (await call("commuter", "/feedback")).find(x => x.id === f.id);
  assert.equal(saved.status, "in_review"); assert.equal(saved.replies.length, 1);
  assert.equal(saved.userId, undefined);
  // A separate visitor knows every published demo credential but not this
  // browser's unguessable workspace. Neither city review nor export may leak.
  const outsideCity = await request("/feedback", "GET", undefined, accounts.city);
  assert.equal(outsideCity.status, 200);
  assert.ok(!outsideCity.data.some(x => x.id === f.id));
  const outsideEnquiries = await request("/sponsorship-enquiries", "GET", undefined, [accounts.city, outsideCity.workspace].join("; "));
  assert.ok(!outsideEnquiries.data.some(x => x.id === en.id));
  const denied = await request(`/feedback/${f.id}/review`, "PATCH", { status: "resolved" }, [accounts.city, outsideCity.workspace].join("; "));
  assert.equal(denied.status, 404);
  const outsideCommuter = await request("/feedback", "GET", undefined, accounts.commuter);
  assert.ok(!outsideCommuter.data.some(x => x.id === f.id));
  const exported = await request("/privacy/export", "GET", undefined, [accounts.commuter, outsideCommuter.workspace].join("; "));
  assert.equal(exported.status, 200);
  assert.ok(!exported.data.feedback.some(x => x.id === f.id));
  console.log("PASS: campaign moderation/metrics, enquiries, alert lifecycle/read isolation, private feedback and replies.");
} finally {
  for (const cookie of Object.values(accounts)) await request("/auth/logout", "POST", undefined, cookie).catch(() => {});
  db.pragma("foreign_keys = ON");
  for (const [table, ids] of [
    ["campaigns", fixtures.campaigns], ["service_alerts", fixtures.alerts],
    ["feedback_tickets", fixtures.feedback], ["sponsorship_enquiries", fixtures.enquiries],
  ]) for (const id of ids) db.prepare(`DELETE FROM ${table} WHERE id=?`).run(id);
  db.close();
}
