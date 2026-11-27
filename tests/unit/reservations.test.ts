import { describe, expect, it } from "vitest";
import { checkBooking, generateSlots, windowFor } from "@/lib/reservations";
import type { DayHours, ReservationSettings } from "@/lib/types";

const settings: ReservationSettings = { enabled: true, slot_minutes: 30, seating_minutes: 90, max_guests_per_booking: 10, max_covers_per_slot: 10, min_lead_minutes: 60, max_days_ahead: 30, last_booking_before_close_minutes: 60 };
const hours: DayHours[] = [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: "11:00", close: day === 1 ? null : "23:00" }));
// 2030-01-07 is a Monday (closed); 2030-01-08 Tuesday. "now" = 2030-01-08 12:10 IST.
const now = new Date("2030-01-08T06:40:00Z");

describe("slots", () => {
  it("knows closed days and overnight closes", () => {
    expect(windowFor("2030-01-07", hours)).toBeNull();
    expect(windowFor("2030-01-08", [{ day: 2, open: "18:00", close: "01:00" }])).toEqual({ open: 1080, close: 1500 });
  });
  it("returns null when hours are unknown (requests only)", () => {
    expect(generateSlots("2030-01-08", 2, settings, null, [], now)).toBeNull();
  });
  it("blocks slots inside the lead time and when capacity is reached", () => {
    const slots = generateSlots("2030-01-08", 4, settings, hours, [{ time: "19:00", guests: 8, status: "confirmed" }], now)!;
    expect(slots[0].time).toBe("11:00");
    expect(slots.find((s) => s.time === "13:00")!.available).toBe(false); // 12:10 + 60 lead
    expect(slots.find((s) => s.time === "13:30")!.available).toBe(true);
    expect(slots.find((s) => s.time === "18:00")!.available).toBe(false); // overlaps 19:00 (8 booked + 4 > 10)
    expect(slots.find((s) => s.time === "20:30")!.available).toBe(true);
    expect(slots.at(-1)!.time).toBe("22:00");
  });
  it("cancelled bookings free capacity", () => {
    const slots = generateSlots("2030-01-08", 4, settings, hours, [{ time: "19:00", guests: 8, status: "cancelled" }], now)!;
    expect(slots.find((s) => s.time === "19:00")!.available).toBe(true);
  });
});

describe("checkBooking", () => {
  const ok = (d: string, t: string, g = 2) => checkBooking({ date: d, time: t, guests: g }, settings, hours, [], now);
  it("validates", () => {
    expect(ok("2030-01-08", "15:00")).toEqual({ ok: true });
    expect(ok("2030-01-14", "15:00")).toMatchObject({ code: "closed" });
    expect(ok("2030-01-01", "15:00")).toMatchObject({ code: "past" });
    expect(ok("2030-03-01", "15:00")).toMatchObject({ code: "too_far" });
    expect(ok("2030-01-08", "12:30")).toMatchObject({ code: "too_soon" });
    expect(ok("2030-01-08", "23:30")).toMatchObject({ code: "outside_hours" });
    expect(ok("2030-01-08", "15:00", 11)).toMatchObject({ code: "bad_guests" });
    expect(ok("2030-02-30", "15:00")).toMatchObject({ code: "bad_date" });
  });
});
