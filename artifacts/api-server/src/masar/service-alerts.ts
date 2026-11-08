import { Router } from "express";
import { CreateServiceAlertBody, CreateServiceAlertResponse, UpdateServiceAlertBody, UpdateServiceAlertResponse,
  GetServiceAlertsResponse, MarkServiceAlertReadResponse } from "@workspace/api-zod";
import { authRequired } from "./auth";
import { all, one, run } from "./store";
import { active, alert, validDates } from "./engagement-store";
import { cityOnly, cleanBody, engagementLimiter, roleOf, validId } from "./engagement-common";
import { places, transitLines } from "./locations";

export const alertsRouter = Router();
function validAudience(d: { audience: string; service: string }) {
  return d.audience === "all" ? d.service === ""
    : d.audience === "station" ? places.some(p => p.name === d.service)
      : [...places.map(p => p.line), ...transitLines.map(p => p.name)].includes(d.service);
}
alertsRouter.get("/service-alerts", authRequired, (_req, res) => {
  const rows = all("SELECT * FROM service_alerts ORDER BY id DESC").map(r => alert(r, res.locals.userId));
  // Affected-service labels are explicit subscriptions/filters, not inferred location targeting.
  const visible = roleOf(res.locals.userId) === "city" ? rows : rows.filter(a => a.status === "published" && active(a));
  res.json(GetServiceAlertsResponse.parse(visible));
});
alertsRouter.post("/service-alerts", authRequired, cityOnly, engagementLimiter, (req, res) => {
  const input = CreateServiceAlertBody.safeParse(cleanBody(req.body));
  if (!input.success || !validDates(input.data.publishedAt, input.data.expiresAt) || !validAudience(input.data)) {
    res.status(400).json({ error: "engagement.invalid" }); return;
  }
  const id = run("INSERT INTO service_alerts(data) VALUES (?)", JSON.stringify(input.data)).lastInsertRowid;
  res.status(201).json(CreateServiceAlertResponse.parse(alert(one("SELECT * FROM service_alerts WHERE id=?", id)!, res.locals.userId)));
});
alertsRouter.patch("/service-alerts/:id", authRequired, cityOnly, engagementLimiter, (req, res) => {
  const id = validId(req.params.id), input = UpdateServiceAlertBody.safeParse(cleanBody(req.body));
  if (!id || !input.success || !validDates(input.data.publishedAt, input.data.expiresAt) || !validAudience(input.data)) {
    res.status(400).json({ error: "engagement.invalid" }); return;
  }
  if (!one("SELECT id FROM service_alerts WHERE id=?", id)) { res.status(404).json({ error: "engagement.notFound" }); return; }
  run("UPDATE service_alerts SET data=?,revision=revision+1 WHERE id=?", JSON.stringify(input.data), id);
  res.json(UpdateServiceAlertResponse.parse(alert(one("SELECT * FROM service_alerts WHERE id=?", id)!, res.locals.userId)));
});
alertsRouter.post("/service-alerts/:id/read", authRequired, (req, res) => {
  const id = validId(req.params.id);
  if (!id) { res.status(400).json({ error: "engagement.invalid" }); return; }
  const row = one("SELECT * FROM service_alerts WHERE id=?", id);
  if (!row || (roleOf(res.locals.userId) !== "city" && !(JSON.parse(row.data).status === "published" && active(JSON.parse(row.data))))) {
    res.status(404).json({ error: "engagement.notFound" }); return;
  }
  run("INSERT INTO alert_reads VALUES (?,?,?) ON CONFLICT(alert_id,user_id) DO UPDATE SET revision=excluded.revision", id, res.locals.userId, row.revision);
  res.json(MarkServiceAlertReadResponse.parse({ message: "engagement.recorded" }));
});
