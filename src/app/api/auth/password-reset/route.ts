import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { dataMode, env } from "@/lib/config";
import { fail, json, limit, parseBody, sameOrigin } from "@/lib/http";
import { RESET_PATH } from "@/lib/recovery";

const schema = z.object({ email: z.string().trim().toLowerCase().email().max(160) });

/**
 * Sends a Supabase password-recovery email whose link opens /auth/reset-password. The answer is
 * the same whether or not the address has an account, so it can't be used to find staff emails.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "bad_origin", "Cross-site request blocked.");
  const limited = limit(req, "password-reset", 5, 15 * 60_000);
  if (limited) return limited;
  const body = await parseBody(req, schema);
  if (!body.ok) return body.res;
  if (dataMode() !== "supabase") return fail(503, "unavailable", "Password reset needs the Supabase database to be connected.");

  // Supabase only follows redirect URLs on the project's allow list, so a spoofed Host header
  // can't send the link elsewhere; an unlisted URL falls back to the Site URL, which the
  // homepage forwards to the reset page.
  const origin = new URL(req.url).origin;
  const anon = createClient(env.supabaseUrl, env.supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await anon.auth.resetPasswordForEmail(body.data.email, { redirectTo: origin + RESET_PATH });
  if (error?.code === "over_email_send_rate_limit" || error?.code === "over_request_rate_limit")
    return fail(429, "rate_limited", "Too many reset emails were sent. Please wait a few minutes and try again.");
  return json({ ok: true });
}
