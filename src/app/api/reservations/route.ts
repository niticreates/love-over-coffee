import { fail, json, limit, parseBody } from "@/lib/http";
import { notifyReservation } from "@/lib/notify";
import { requestReservation } from "@/lib/services/reservations";
import { reservationSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const limited = limit(req, "reserve", 6, 10 * 60_000);
  if (limited) return limited;
  const body = await parseBody(req, reservationSchema);
  if (!body.ok) return body.res;
  if (body.data.website) return json({ ok: true }); // honeypot: pretend success
  try {
    const r = await requestReservation(body.data);
    if (!r.ok) return fail(409, r.code, r.message);
    if (!r.existed) await notifyReservation(r.reservation, "requested");
    return json({ ok: true, reference: r.reservation.reference, token: r.reservation.public_token, status: r.reservation.status, duplicate: r.existed });
  } catch (e) {
    console.error("reservation failed", e);
    return fail(503, "unavailable", "We couldn't save your request just now. Please try again or call us.");
  }
}
