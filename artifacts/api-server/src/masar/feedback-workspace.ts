import { randomBytes, createHash } from "node:crypto";
import type { Request, Response, RequestHandler } from "express";
import { one, run } from "./store";
import "./engagement-store";

const cookieName = "masar_feedback_workspace";
const hash = (v: string) => createHash("sha256").update(v).digest("hex");

/** Public demo personas are not staff identities. Keep their free-text feedback
 * in an unguessable browser workspace shared only across that browser's demos. */
export function readFeedbackWorkspace(req: Request): string | null {
  const token = req.cookies?.[cookieName];
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) return null;
  const digest = hash(token);
  return one("SELECT token_hash FROM feedback_workspaces WHERE token_hash=? AND expires_at>?", digest, Date.now()) ? digest : null;
}
export function ensureFeedbackWorkspace(req: Request, res: Response): string {
  const existing = readFeedbackWorkspace(req);
  if (existing) return existing;
  const token = randomBytes(32).toString("hex"), digest = hash(token);
  run("INSERT INTO feedback_workspaces VALUES (?,?)", digest, Date.now() + 7 * 86400000);
  res.cookie(cookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 7 * 86400000 });
  return digest;
}
export const feedbackWorkspace: RequestHandler = (req, res, next) => {
  res.locals.feedbackWorkspace = ensureFeedbackWorkspace(req, res);
  next();
};
