"use client";
import { useState } from "react";
import { fmt12 } from "@/lib/hours";
import type { Reservation, ReservationStatus } from "@/lib/types";
import { useAdminAction } from "./useAdmin";
import { Badge } from "./ui";

const NEXT: Record<ReservationStatus, ReservationStatus[]> = {
  requested: ["confirmed", "rejected", "cancelled"], confirmed: ["completed", "no_show", "cancelled"], rejected: [], cancelled: [], completed: [], no_show: [],
};
const LABEL: Partial<Record<ReservationStatus, string>> = { confirmed: "Approve", rejected: "Decline", cancelled: "Cancel", completed: "Seated / done", no_show: "No-show" };

export function ReservationsBoard({ reservations }: { reservations: Reservation[] }) {
  const { run, busy } = useAdminAction();
  const [editing, setEditing] = useState<string | null>(null);
  if (!reservations.length) return <p className="admin-surface p-8 text-center text-muted">No reservations in this range.</p>;
  const byDate = reservations.reduce<Record<string, Reservation[]>>((a, r) => ((a[r.date] ??= []).push(r), a), {});
  return (
    <div className="grid gap-6">
      {Object.entries(byDate).map(([date, list]) => (
        <section key={date} className="admin-surface">
          <h2 className="border-b border-ink/8 bg-turquoise-soft/60 px-5 py-4 font-display text-2xl text-ink">
            {new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}
            <span className="ml-3 font-sans text-xs text-muted">{list.filter((r) => r.status === "confirmed").reduce((a, r) => a + r.guests, 0)} confirmed guests</span>
          </h2>
          <ul className="divide-y divide-oat">
            {list.map((r) => (
              <li key={r.id} className="grid gap-3 p-5 md:grid-cols-[110px_1fr_auto] md:items-start">
                <div><p className="font-display text-2xl">{fmt12(r.time)}</p><p className="text-xs text-muted">{r.guests} guests</p></div>
                <div className="text-sm">
                  <p className="font-semibold">{r.name} <Badge value={r.status} /> <span className="ml-1 text-xs text-muted">{r.reference}</span></p>
                  <p className="mt-1"><a className="underline" href={`tel:${r.phone}`}>{r.phone}</a>{r.email ? ` · ${r.email}` : ""}</p>
                  {r.occasion && <p className="mt-1 text-muted">Occasion: {r.occasion}</p>}
                  {r.requests && <p className="mt-1 italic text-muted">“{r.requests}”</p>}
                  {r.staff_note && <p className="mt-2 whitespace-pre-line bg-paper p-2 text-xs">{r.staff_note}</p>}
                  {editing === r.id && (
                    <form
                      className="mt-3 flex flex-wrap items-end gap-2"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
                        const ok = await run(`/api/admin/reservations/${r.id}`, { date: f.date, time: f.time, guests: Number(f.guests), staff_note: f.staff_note || null }, "PATCH", "Booking updated");
                        if (ok) setEditing(null);
                      }}
                    >
                      <input name="date" type="date" defaultValue={r.date} className="input w-auto" aria-label="Date" />
                      <input name="time" type="time" defaultValue={r.time} className="input w-auto" aria-label="Time" />
                      <input name="guests" type="number" min={1} max={50} defaultValue={r.guests} className="input w-20" aria-label="Guests" />
                      <input name="staff_note" defaultValue={r.staff_note ?? ""} placeholder="Staff note" className="input min-w-[180px] flex-1" aria-label="Staff note" />
                      <button className="btn btn-dark min-h-[44px] px-3" disabled={busy}>Save</button>
                    </form>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  {NEXT[r.status].map((s) => (
                    <button key={s} disabled={busy} onClick={() => run(`/api/admin/reservations/${r.id}`, { status: s }, "PATCH", `${r.name}: ${s.replace(/_/g, " ")}`)} className={`btn min-h-[38px] px-3 ${s === "confirmed" ? "btn-primary" : "btn-outline"}`}>{LABEL[s]}</button>
                  ))}
                  {["requested", "confirmed"].includes(r.status) && <button className="btn btn-outline min-h-[38px] px-3" onClick={() => setEditing(editing === r.id ? null : r.id)}>Modify</button>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
