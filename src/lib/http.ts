import "server-only";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { fieldErrors } from "./validation";
import { clientIp, rateLimit } from "./rate-limit";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
export const fail = (status: number, code: string, message: string, fields?: Record<string, string>) =>
  json({ error: { code, message, fields } }, status);

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<{ ok: true; data: T } | { ok: false; res: NextResponse }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { ok: false, res: fail(400, "bad_json", "Invalid request.") };
  }
  const r = schema.safeParse(body);
  if (!r.success) return { ok: false, res: fail(422, "invalid", "Please check the highlighted fields.", fieldErrors(r.error as ZodError)) };
  return { ok: true, data: r.data };
}

export function limit(req: Request, bucket: string, max: number, windowMs: number): NextResponse | null {
  const r = rateLimit(`${bucket}:${clientIp(req.headers)}`, max, windowMs);
  if (r.ok) return null;
  const res = fail(429, "rate_limited", "Too many attempts. Please wait a moment and try again.");
  res.headers.set("Retry-After", String(r.retryAfter));
  return res;
}

/** Reject cross-site form posts to state-changing JSON endpoints (CSRF defence for cookie-auth routes). */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser clients; cookie-auth routes also require the session
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}
