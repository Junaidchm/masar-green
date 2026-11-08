import type { RequestHandler } from "express";
import { z } from "zod";
import { rateLimit } from "express-rate-limit";
import { one } from "./store";

export const cityOnly: RequestHandler = (_req, res, next) => {
  if (one("SELECT role FROM users WHERE id=?", res.locals.userId)?.role !== "city") {
    res.status(403).json({ error: "engagement.forbidden" }); return;
  }
  next();
};
export const roleOf = (id: number): string => one("SELECT role FROM users WHERE id=?", id)!.role;
export const validId = (value: unknown) => {
  const parsed = z.coerce.number().int().positive().safeParse(value);
  return parsed.success ? parsed.data : null;
};
// Trim before generated min/max checks, so whitespace cannot satisfy required text.
export function cleanBody(body: unknown): unknown {
  if (!body || typeof body !== "object" || Array.isArray(body)) return body;
  return Object.fromEntries(Object.entries(body).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v]));
}
export const engagementLimiter = rateLimit({
  windowMs: 60000, limit: 40, standardHeaders: "draft-7", legacyHeaders: false,
  message: { error: "engagement.rate" },
});
