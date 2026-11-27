import "server-only";
import { shortRef, token } from "../ids";
import { notifyReservation } from "../notify";
import { checkBooking, generateSlots } from "../reservations";
import { getStore } from "../store";
import type { ReservationStatus } from "../types";
import type { reservationSchema } from "../validation";
import type { z } from "zod";

export async function availability(date: string, guests: number) {
  const store = getStore();
  const s = await store.getSettings();
  const existing = await store.listReservations({ date });
  const slots = generateSlots(date, guests, s.reservations, s.business.hours, existing);
  return { slots, hoursKnown: s.business.hours != null, capacityKnown: s.reservations.max_covers_per_slot != null };
}

export async function requestReservation(input: z.output<typeof reservationSchema>) {
  const store = getStore();
  const s = await store.getSettings();
  return store.createReservation(
    {
      reference: shortRef("TBL"),
      public_token: token(),
      name: input.name,
      phone: input.phone,
      email: input.email,
      date: input.date,
      time: input.time,
      guests: input.guests,
      occasion: input.occasion,
      requests: input.requests,
    },
    (sameDay) => checkBooking(input, s.reservations, s.business.hours, sameDay),
  );
}

const NEXT: Record<ReservationStatus, ReservationStatus[]> = {
  requested: ["confirmed", "rejected", "cancelled"],
  confirmed: ["completed", "no_show", "cancelled"],
  rejected: [],
  cancelled: [],
  completed: [],
  no_show: [],
};

export async function changeReservation(
  id: string,
  patch: { status?: ReservationStatus; date?: string; time?: string; guests?: number; staff_note?: string | null; table_id?: string | null },
) {
  const store = getStore();
  const r = await store.getReservation(id);
  if (!r) return { ok: false as const, status: 404, message: "Reservation not found." };
  if (patch.status && patch.status !== r.status && !NEXT[r.status].includes(patch.status))
    return { ok: false as const, status: 409, message: `Can't move a ${r.status} booking to ${patch.status}.` };
  const updated = await store.updateReservation(id, patch);
  if (patch.status && patch.status !== r.status && ["confirmed", "rejected", "cancelled"].includes(patch.status))
    await notifyReservation(updated, patch.status as "confirmed" | "rejected" | "cancelled");
  return { ok: true as const, reservation: updated };
}
