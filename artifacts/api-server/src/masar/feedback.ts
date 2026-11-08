import { Router } from "express";
import { randomUUID } from "node:crypto";
import { CreateFeedbackBody, CreateFeedbackResponse, GetFeedbackResponse, ReviewFeedbackBody, ReviewFeedbackResponse } from "@workspace/api-zod";
import { authRequired } from "./auth";
import { all, one, run, sql } from "./store";
import { nowIso, ticket } from "./engagement-store";
import { cityOnly, cleanBody, engagementLimiter, roleOf, validId } from "./engagement-common";
import { places } from "./locations";
import { feedbackWorkspace } from "./feedback-workspace";

export const feedbackRouter = Router();
feedbackRouter.get("/feedback", authRequired, feedbackWorkspace, (_req, res) => {
  const rows = roleOf(res.locals.userId) === "city"
    ? all("SELECT * FROM feedback_tickets WHERE workspace_hash=? ORDER BY id DESC", res.locals.feedbackWorkspace)
    : all("SELECT * FROM feedback_tickets WHERE user_id=? AND workspace_hash=? ORDER BY id DESC", res.locals.userId, res.locals.feedbackWorkspace);
  res.json(GetFeedbackResponse.parse(rows.map(ticket)));
});
feedbackRouter.post("/feedback", authRequired, feedbackWorkspace, engagementLimiter, (req, res) => {
  if (roleOf(res.locals.userId) !== "commuter") { res.status(403).json({ error: "engagement.forbidden" }); return; }
  const input = CreateFeedbackBody.safeParse(cleanBody(req.body));
  if (!input.success || (input.data.station && !places.some(p => p.name === input.data.station))) {
    res.status(400).json({ error: "engagement.invalid" }); return;
  }
  const reference = `MG-${randomUUID().slice(0, 8).toUpperCase()}`;
  const id = run("INSERT INTO feedback_tickets(user_id,reference,data,created_at,workspace_hash) VALUES (?,?,?,?,?)", res.locals.userId, reference, JSON.stringify(input.data), nowIso(), res.locals.feedbackWorkspace).lastInsertRowid;
  res.status(201).json(CreateFeedbackResponse.parse(ticket(one("SELECT * FROM feedback_tickets WHERE id=?", id)!)));
});
feedbackRouter.patch("/feedback/:id/review", authRequired, cityOnly, feedbackWorkspace, engagementLimiter, (req, res) => {
  const id = validId(req.params.id), input = ReviewFeedbackBody.safeParse(cleanBody(req.body));
  if (!id || !input.success) { res.status(400).json({ error: "engagement.invalid" }); return; }
  if (!one("SELECT id FROM feedback_tickets WHERE id=? AND workspace_hash=?", id, res.locals.feedbackWorkspace)) { res.status(404).json({ error: "engagement.notFound" }); return; }
  sql.transaction(() => {
    run("UPDATE feedback_tickets SET status=? WHERE id=?", input.data.status, id);
    if (input.data.reply) run("INSERT INTO feedback_replies(ticket_id,body,created_at) VALUES (?,?,?)", id, input.data.reply, nowIso());
  })();
  res.json(ReviewFeedbackResponse.parse(ticket(one("SELECT * FROM feedback_tickets WHERE id=?", id)!)));
});
