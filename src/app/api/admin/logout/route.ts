import { endSession } from "@/lib/auth";
import { fail, json, sameOrigin } from "@/lib/http";

export async function POST(req: Request) {
  // A third-party page must not be able to sign staff out.
  if (!sameOrigin(req)) return fail(403, "bad_origin", "Cross-site request blocked.");
  await endSession();
  return json({ ok: true });
}
