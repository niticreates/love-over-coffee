// Pure reservation logic. All wall-clock times are Asia/Kolkata (UTC+05:30, no DST).
import type { DayHours, Reservation, ReservationSettings } from "./types";

const IST_OFFSET_MIN = 330;

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
export function fromMinutes(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** Current date/time in IST as {date:"YYYY-MM-DD", minutes} */
export function nowIST(now = new Date()): { date: string; minutes: number; weekday: number } {
  const ist = new Date(now.getTime() + IST_OFFSET_MIN * 60_000);
  return {
    date: ist.toISOString().slice(0, 10),
    minutes: ist.getUTCHours() * 60 + ist.getUTCMinutes(),
    weekday: ist.getUTCDay(),
  };
}

export function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const d = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === date;
}

/** Opening window for a date, in minutes from that date's midnight (close may exceed 1440). */
export function windowFor(date: string, hours: DayHours[] | null): { open: number; close: number } | null {
  if (!hours) return null;
  const h = hours.find((x) => x.day === weekdayOf(date));
  if (!h || !h.open || !h.close) return null;
  const open = toMinutes(h.open);
  let close = toMinutes(h.close === "24:00" ? "00:00" : h.close);
  if (close <= open) close += 1440;
  return { open, close };
}

export interface Slot {
  time: string;
  available: boolean;
  remaining: number | null; // null when capacity isn't configured
}

/** Guests already booked whose seating overlaps a slot starting at `startMin`. */
export function coversOverlapping(
  existing: Pick<Reservation, "time" | "guests" | "status">[],
  startMin: number,
  seatingMinutes: number,
): number {
  return existing
    .filter((r) => r.status === "requested" || r.status === "confirmed")
    .filter((r) => {
      const s = toMinutes(r.time);
      return s < startMin + seatingMinutes && startMin < s + seatingMinutes;
    })
    .reduce((a, r) => a + r.guests, 0);
}

export function generateSlots(
  date: string,
  guests: number,
  settings: ReservationSettings,
  hours: DayHours[] | null,
  existing: Pick<Reservation, "time" | "guests" | "status">[],
  now = new Date(),
): Slot[] | null {
  const win = windowFor(date, hours);
  if (!win) return hours ? [] : null; // null → hours unknown; [] → closed that day
  const n = nowIST(now);
  const lastStart = Math.min(win.close - settings.last_booking_before_close_minutes, 1440 - settings.slot_minutes);
  const slots: Slot[] = [];
  for (let t = win.open; t <= lastStart; t += settings.slot_minutes) {
    let available = true;
    if (date === n.date && t < n.minutes + settings.min_lead_minutes) available = false;
    let remaining: number | null = null;
    if (settings.max_covers_per_slot != null) {
      remaining = settings.max_covers_per_slot - coversOverlapping(existing, t, settings.seating_minutes);
      if (remaining < guests) available = false;
    }
    slots.push({ time: fromMinutes(t), available, remaining });
  }
  return slots;
}

export type BookingCheck = { ok: true } | { ok: false; code: string; message: string };

export function checkBooking(
  input: { date: string; time: string; guests: number },
  settings: ReservationSettings,
  hours: DayHours[] | null,
  existing: Pick<Reservation, "time" | "guests" | "status">[],
  now = new Date(),
): BookingCheck {
  if (!settings.enabled) return { ok: false, code: "disabled", message: "Online reservations are paused right now. Please call us." };
  if (!isValidDate(input.date)) return { ok: false, code: "bad_date", message: "Please choose a valid date." };
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time)) return { ok: false, code: "bad_time", message: "Please choose a valid time." };
  if (input.guests < 1 || input.guests > settings.max_guests_per_booking)
    return { ok: false, code: "bad_guests", message: `Online bookings are for 1–${settings.max_guests_per_booking} guests. For larger groups, please call.` };
  const n = nowIST(now);
  if (input.date < n.date) return { ok: false, code: "past", message: "That date has passed." };
  if (input.date > addDays(n.date, settings.max_days_ahead))
    return { ok: false, code: "too_far", message: `Bookings open ${settings.max_days_ahead} days ahead.` };
  if (input.date === n.date && toMinutes(input.time) < n.minutes + settings.min_lead_minutes)
    return { ok: false, code: "too_soon", message: "Please choose a time a little later today." };

  const slots = generateSlots(input.date, input.guests, settings, hours, existing, now);
  if (slots === null) return { ok: true }; // hours not configured → accepted as a request; staff confirm
  if (slots.length === 0) return { ok: false, code: "closed", message: "We're closed on that day." };
  const slot = slots.find((s) => s.time === input.time);
  if (!slot) return { ok: false, code: "outside_hours", message: "That time is outside our booking hours." };
  if (!slot.available)
    return { ok: false, code: "full", message: "That time is fully booked. Please pick another slot." };
  return { ok: true };
}
