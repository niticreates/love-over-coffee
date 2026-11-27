import { z } from "zod";
import { authenticate, startSession } from "@/lib/auth";
import { fail, json, limit, parseBody, sameOrigin } from "@/lib/http";

const schema = z.object({ email: z.string().max(160), password: z.string().min(1).max(200) });

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "bad_origin", "Cross-site request blocked.");
  const limited = limit(req, "admin-login", 8, 15 * 60_000);
  if (limited) return limited;
  const body = await parseBody(req, schema);
  if (!body.ok) return body.res;
  const r = await authenticate(body.data.email.trim().toLowerCase(), body.data.password);
  if ("error" in r) return fail(401, "invalid_credentials", r.error);
  await startSession(r);
  return json({ ok: true, name: r.name, role: r.role });
}
