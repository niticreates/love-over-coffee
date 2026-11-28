import { z } from "zod";
import { authenticate, startSession } from "@/lib/auth";
import { DemoConfigError } from "@/lib/config";
import { fail, json, limit, parseBody, sameOrigin } from "@/lib/http";

const schema = z.object({ email: z.string().max(160), password: z.string().min(1).max(200) });

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "bad_origin", "Cross-site request blocked.");
  const limited = limit(req, "admin-login", 8, 15 * 60_000);
  if (limited) return limited;
  const body = await parseBody(req, schema);
  if (!body.ok) return body.res;
  let r: Awaited<ReturnType<typeof authenticate>>;
  try {
    r = await authenticate(body.data.email.trim().toLowerCase(), body.data.password);
  } catch (e) {
    if (e instanceof DemoConfigError) return fail(503, "misconfigured", "Sign-in is unavailable on this demo until its configuration is fixed.");
    throw e;
  }
  if ("error" in r) return fail(401, "invalid_credentials", r.error);
  await startSession(r);
  return json({ ok: true, name: r.name, role: r.role });
}
