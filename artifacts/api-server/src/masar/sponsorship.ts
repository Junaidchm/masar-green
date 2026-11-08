import { Router } from "express";
import {
  CreateCampaignBody, CreateCampaignResponse, GetCampaignsResponse, ModerateCampaignBody, ModerateCampaignResponse,
  CreateSponsorshipEnquiryBody, CreateSponsorshipEnquiryResponse, GetSponsorshipEnquiriesResponse,
  GetSponsoredPlacementsResponse, TrackPlacementEventBody, TrackPlacementEventResponse,
} from "@workspace/api-zod";
import { authRequired } from "./auth";
import { all, one, run, sql } from "./store";
import { active, campaign, nowIso, safeUrl, sessionHash, validDates } from "./engagement-store";
import { cityOnly, cleanBody, engagementLimiter, roleOf, validId } from "./engagement-common";
import { feedbackWorkspace } from "./feedback-workspace";

export const sponsorshipRouter = Router();
sponsorshipRouter.get("/campaigns", authRequired, (_req, res) => {
  const role = roleOf(res.locals.userId);
  if (!["city", "employer"].includes(role)) { res.status(403).json({ error: "engagement.forbidden" }); return; }
  const rows = role === "city" ? all("SELECT * FROM campaigns ORDER BY id DESC")
    : all("SELECT * FROM campaigns WHERE owner_id=? ORDER BY id DESC", res.locals.userId);
  res.json(GetCampaignsResponse.parse(rows.map(campaign)));
});
sponsorshipRouter.post("/campaigns", authRequired, engagementLimiter, (req, res) => {
  if (roleOf(res.locals.userId) !== "employer") { res.status(403).json({ error: "engagement.forbidden" }); return; }
  const input = CreateCampaignBody.safeParse(cleanBody(req.body));
  if (!input.success || !validDates(input.data.startsAt, input.data.endsAt) || !safeUrl(input.data.destinationUrl)
    || !safeUrl(input.data.imageUrl ?? "", true)) { res.status(400).json({ error: "engagement.invalid" }); return; }
  const id = run("INSERT INTO campaigns(owner_id,data) VALUES (?,?)", res.locals.userId, JSON.stringify(input.data)).lastInsertRowid;
  res.status(201).json(CreateCampaignResponse.parse(campaign(one("SELECT * FROM campaigns WHERE id=?", id)!)));
});
sponsorshipRouter.patch("/campaigns/:id/status", authRequired, cityOnly, engagementLimiter, (req, res) => {
  const id = validId(req.params.id), input = ModerateCampaignBody.safeParse(req.body);
  if (!id || !input.success) { res.status(400).json({ error: "engagement.invalid" }); return; }
  const row = one("SELECT * FROM campaigns WHERE id=?", id);
  if (!row) { res.status(404).json({ error: "engagement.notFound" }); return; }
  run("UPDATE campaigns SET status=? WHERE id=?", input.data.status, id);
  res.json(ModerateCampaignResponse.parse(campaign(one("SELECT * FROM campaigns WHERE id=?", id)!)));
});
sponsorshipRouter.get("/sponsorship-enquiries", authRequired, feedbackWorkspace, (_req, res) => {
  const rows = roleOf(res.locals.userId) === "city"
    ? all("SELECT * FROM sponsorship_enquiries WHERE workspace_hash=? ORDER BY id DESC", res.locals.feedbackWorkspace)
    : all("SELECT * FROM sponsorship_enquiries WHERE owner_id=? AND workspace_hash=? ORDER BY id DESC", res.locals.userId, res.locals.feedbackWorkspace);
  res.json(GetSponsorshipEnquiriesResponse.parse(rows.map(r => ({ ...JSON.parse(r.data), id: r.id, createdAt: r.created_at }))));
});
sponsorshipRouter.post("/sponsorship-enquiries", authRequired, feedbackWorkspace, engagementLimiter, (req, res) => {
  const input = CreateSponsorshipEnquiryBody.safeParse(cleanBody(req.body));
  if (!input.success) { res.status(400).json({ error: "engagement.invalid" }); return; }
  const createdAt = nowIso();
  const id = Number(run("INSERT INTO sponsorship_enquiries(owner_id,data,created_at,workspace_hash) VALUES (?,?,?,?)", res.locals.userId, JSON.stringify(input.data), createdAt, res.locals.feedbackWorkspace).lastInsertRowid);
  res.status(201).json(CreateSponsorshipEnquiryResponse.parse({ ...input.data, id, createdAt }));
});
sponsorshipRouter.get("/sponsored-placements", (_req, res) => {
  const rows = all("SELECT * FROM campaigns WHERE status='published' ORDER BY id DESC").map(r => ({ ...JSON.parse(r.data), id: r.id, simulated: !!r.simulated }))
    .filter(active).map(({ budgetAed: _budget, ...p }) => p);
  res.json(GetSponsoredPlacementsResponse.parse(rows));
});
sponsorshipRouter.post("/sponsored-placements/:id/events", engagementLimiter, (req, res) => {
  const id = validId(req.params.id), input = TrackPlacementEventBody.safeParse(req.body);
  if (!id || !input.success || !/^[a-zA-Z0-9_-]{20,80}$/.test(input.data.sessionKey)) { res.status(400).json({ error: "engagement.invalid" }); return; }
  const row = one("SELECT * FROM campaigns WHERE id=? AND status='published'", id);
  if (!row || !active(JSON.parse(row.data))) { res.status(404).json({ error: "engagement.notFound" }); return; }
  const hash = sessionHash(input.data.sessionKey);
  sql.transaction(() => {
    // A click implies a view; each event kind is counted at most once per tab session.
    run("INSERT OR IGNORE INTO placement_events VALUES (?,?,?,?)", id, hash, "impression", nowIso());
    if (input.data.kind === "click") run("INSERT OR IGNORE INTO placement_events VALUES (?,?,?,?)", id, hash, "click", nowIso());
  })();
  res.json(TrackPlacementEventResponse.parse({ message: "engagement.recorded" }));
});
