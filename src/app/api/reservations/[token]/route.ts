import { z } from "zod";
import { fail, json, limit, parseBody } from "@/lib/http";
import { notifyReservation } from "@/lib/notify";
import { getStore } from "@/lib/store";
import { clean } from "@/lib/validation";

const schema = z.object({ action: z.enum(["cancel", "modify"]), message: z.string().max(500).optional() });

/** Guest self-service: cancel outright, or send a modification request to staff. */
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const limited = limit(req, "res-change", 10, 10 * 60_000);
  if (limited) return limited;
  const { token } = await params;
  const body = await parseBody(req, schema);
  if (!body.ok) return body.res;
  const store = getStore();
  const r = await store.getReservationByToken(token);
  if (!r) return fail(404, "not_found", "Reservation not found.");
  if (!["requested", "confirmed"].includes(r.status)) return fail(409, "closed", "This reservation can no longer be changed online.");
  if (body.data.action === "cancel") {
    const updated = await store.updateReservation(r.id, { status: "cancelled" });
    await notifyReservation(updated, "cancelled");
    return json({ ok: true, status: updated.status });
  }
  const note = clean(body.data.message ?? "");
  if (note.length < 3) return fail(422, "invalid", "Tell us what you'd like to change.");
  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  await store.updateReservation(r.id, { staff_note: `${r.staff_note ? `${r.staff_note}\n` : ""}[${stamp} UTC] Guest change request: ${note}` });
  return json({ ok: true, status: r.status, message: "Your request has been sent. The café will contact you to confirm." });
}
