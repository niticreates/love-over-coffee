"use client";
import clsx from "clsx";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { postJSON } from "./api";
import { Field, TextArea, TextInput } from "./Field";

interface Slot { time: string; available: boolean; remaining: number | null }
const OCCASIONS = ["", "Coffee date", "Birthday", "Anniversary", "Catch-up with friends", "Work meeting", "Other"];

function istToday() {
  return new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
}
function addDays(d: string, n: number) {
  const x = new Date(`${d}T00:00:00Z`);
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
}
const fmt12 = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
};

export function ReservationForm({ maxGuests, maxDays, enabled, phone }: { maxGuests: number; maxDays: number; enabled: boolean; phone: string }) {
  const today = useMemo(istToday, []);
  const [date, setDate] = useState(today);
  const [guests, setGuests] = useState(2);
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<Slot[] | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{ reference: string; token: string } | null>(null);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setTime("");
    fetch(`/api/reservations/availability?date=${date}&guests=${guests}`)
      .then((r) => r.json())
      .then((d) => live && setSlots(d.slots ?? null))
      .catch(() => live && setSlots(null))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [date, guests]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    const f = Object.fromEntries(new FormData(e.currentTarget));
    if (!time) return setErrors({ time: "Choose a time" });
    setSending(true);
    setErrors({});
    setFormError("");
    const r = await postJSON<{ reference: string; token: string }>("/api/reservations", { ...f, date, time, guests });
    setSending(false);
    if (r.ok) return setDone(r.data);
    setErrors(r.error.fields ?? {});
    setFormError(r.error.message);
    if (r.error.code === "full") setDate((d) => d); // trigger nothing; user picks another slot
  }

  if (!enabled)
    return <p className="text-lg">Online reservations are paused right now. Please call us on <a className="link-underline" href={`tel:${phone}`}>{phone}</a>.</p>;

  if (done)
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[24px] border border-oat bg-paper p-8 md:p-12" role="status">
        <p className="eyebrow text-terracotta-ink">Request received</p>
        <h2 className="mt-4 text-display-sm">Thank you — we&apos;ve got your request.</h2>
        <p className="mt-4 max-w-prose text-muted">Your table is <strong>not yet confirmed</strong>. The café will review it and confirm shortly. Keep your reference handy:</p>
        <p className="mt-6 font-display text-4xl tracking-wide">{done.reference}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/reservation/${done.token}`} className="btn btn-dark">View your booking</Link>
          <Link href="/menu" className="btn btn-outline">Browse the menu</Link>
        </div>
      </motion.div>
    );

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Date" name="date" error={errors.date}>
          <TextInput name="date" type="date" value={date} min={today} max={addDays(today, maxDays)} onChange={(e) => setDate(e.target.value)} required />
        </Field>
        <Field label="Guests" name="guests" error={errors.guests} hint={`For more than ${maxGuests}, please call us.`}>
          <select id="guests" name="guests" className="input" value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
            {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>)}
          </select>
        </Field>
      </div>

      <fieldset>
        <legend className="eyebrow text-walnut">Preferred time</legend>
        {loading || slots === undefined ? (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5" aria-busy="true">
            {Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-11 animate-pulse bg-oat" />)}
          </div>
        ) : slots === null ? (
          <div className="mt-3 max-w-xs">
            <TextInput name="time_free" type="time" step={900} value={time} onChange={(e) => setTime(e.target.value)} aria-label="Preferred time" error={errors.time} />
            <p className="mt-2 text-xs text-muted">The café will confirm whether this time works.</p>
          </div>
        ) : slots.length === 0 ? (
          <p className="mt-3 text-muted">We&apos;re closed on this day. Please pick another date.</p>
        ) : (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5" role="radiogroup" aria-label="Available times">
            {slots.map((s) => (
              <button
                key={s.time} type="button" role="radio" aria-checked={time === s.time} disabled={!s.available} onClick={() => setTime(s.time)}
                className={clsx("h-11 rounded-full border text-sm tabular-nums transition-colors disabled:cursor-not-allowed disabled:text-muted/50 disabled:line-through", time === s.time ? "border-espresso bg-espresso text-ivory" : "border-oat bg-paper hover:border-walnut")}
              >
                {fmt12(s.time)}
              </button>
            ))}
          </div>
        )}
        {errors.time && <p className="field-error mt-2" role="alert">{errors.time}</p>}
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" name="name" error={errors.name}><TextInput name="name" autoComplete="name" required error={errors.name} /></Field>
        <Field label="Mobile number" name="phone" error={errors.phone}><TextInput name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" required error={errors.phone} /></Field>
        <Field label="Email (optional)" name="email" error={errors.email}><TextInput name="email" type="email" autoComplete="email" error={errors.email} /></Field>
        <Field label="Occasion (optional)" name="occasion">
          <select id="occasion" name="occasion" className="input">{OCCASIONS.map((o) => <option key={o} value={o}>{o || "—"}</option>)}</select>
        </Field>
      </div>
      <Field label="Special requests (optional)" name="requests" error={errors.requests}><TextArea name="requests" maxLength={500} placeholder="Window seat, high chair, a candle on the dessert…" error={errors.requests} /></Field>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {formError && <p className="field-error" role="alert">{formError}</p>}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <button className="btn btn-primary" disabled={sending}>{sending ? "Sending request…" : "Request reservation"}</button>
        <p className="text-xs text-muted">Reservations are requests until confirmed by the café.</p>
      </div>
    </form>
  );
}
