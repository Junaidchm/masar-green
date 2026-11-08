import { Router } from "express";
import { GetReferralsResponse } from "@workspace/api-zod";
import { authRequired } from "../masar/auth";
import { one } from "../masar/store";
import { referralSummary } from "../masar/referrals";

export const referralsRouter = Router();
referralsRouter.get("/referrals", authRequired, (_req,res) => {
  const userId = res.locals.userId as number;
  if (one("SELECT role FROM users WHERE id=?",userId)?.role !== "commuter") {
    res.status(403).json({error:"rf.commuterOnly"}); return;
  }
  res.setHeader("Cache-Control","no-store");
  res.json(GetReferralsResponse.parse(referralSummary(userId)));
});
