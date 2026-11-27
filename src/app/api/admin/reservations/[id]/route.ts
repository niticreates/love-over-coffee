import { adminRoute } from "@/lib/admin-api";
import { reservationPatchSchema } from "@/lib/admin-schemas";
import { fail, json, parseBody } from "@/lib/http";
import { changeReservation } from "@/lib/services/reservations";

export const PATCH = adminRoute<{ params: Promise<{ id: string }> }>("staff", async (req, _a, { params }) => {
  const body = await parseBody(req, reservationPatchSchema);
  if (!body.ok) return body.res;
  const r = await changeReservation((await params).id, body.data);
  if (!r.ok) return fail(r.status, "invalid_transition", r.message);
  return json(r.reservation);
});
