import "server-only";
import { shortRef, token } from "../ids";
import { notifyReservation } from "../notify";
import { checkBooking, generateSlots } from "../reservations";
import { getStore } from "../store";
import { demoMode } from "../config";
import type { ReservationStatus } from "../types";
import type { reservationSchema } from "../validation";
import type { z } from "zod";

// The public demo has no phone line, so booking errors there don't tell people to call.
const DEMO_BOOKING_MESSAGES: Record<string, (s: { max_guests_per_booking: number }) => string> = {
  disabled: () => "Online reservations are paused right now.",
  bad_guests: (s) => `Online bookings are for 1–${s.max_guests_per_booking} guests.`,
};

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
    (sameDay) => {
      const check = checkBooking(input, s.reservations, s.business.hours, sameDay);
      const demoMessage = !check.ok && demoMode() ? DEMO_BOOKING_MESSAGES[check.code] : undefined;
      return demoMessage && !check.ok ? { ...check, message: demoMessage(s.reservations) } : check;
    },
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
  actor?: string,
) {
  const store = getStore();
  const r = await store.getReservation(id);
  if (!r) return { ok: false as const, status: 404, message: "Reservation not found." };
  if (patch.status && patch.status !== r.status && !NEXT[r.status].includes(patch.status))
    return { ok: false as const, status: 409, message: `Can't move a ${r.status} booking to ${patch.status}.` };
  const updated = await store.updateReservation(id, patch, actor);
  if (patch.status && patch.status !== r.status && ["confirmed", "rejected", "cancelled"].includes(patch.status))
    await notifyReservation(updated, patch.status as "confirmed" | "rejected" | "cancelled");
  return { ok: true as const, reservation: updated };
}
