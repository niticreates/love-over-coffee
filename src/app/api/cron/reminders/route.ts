import { json } from "@/lib/http";
import { notifyReservation } from "@/lib/notify";
import { addDays, nowIST } from "@/lib/reservations";
import { getStore } from "@/lib/store";

/** Daily (Vercel Cron, see vercel.json): remind guests with confirmed tables tomorrow. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return json({ error: "unauthorized" }, 401);
  const tomorrow = addDays(nowIST().date, 1);
  const list = await getStore().listReservations({ date: tomorrow, status: "confirmed" });
  for (const r of list) await notifyReservation(r, "reminder");
  return json({ ok: true, reminded: list.length });
}
