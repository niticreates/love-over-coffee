import { demoMode } from "@/lib/config";
import { json } from "@/lib/http";
import { getStore } from "@/lib/store";

/**
 * Daily on the public demo (Vercel Cron, see vercel.json): wipe everything visitors typed in.
 * Does nothing outside DEMO_MODE, so the same schedule is harmless on the real site.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return json({ error: "unauthorized" }, 401);
  if (!demoMode()) return json({ error: "not_found" }, 404);
  const removed = await getStore().purgeCustomerData();
  return json({ ok: true, removed });
}
