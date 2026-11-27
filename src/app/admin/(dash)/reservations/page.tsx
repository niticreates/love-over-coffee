import { ReservationsBoard } from "@/components/admin/ReservationsBoard";
import { PageTitle } from "@/components/admin/ui";
import { guard } from "@/lib/auth";
import { addDays, nowIST } from "@/lib/reservations";
import { getStore } from "@/lib/store";
import { RESERVATION_STATUSES, type ReservationStatus } from "@/lib/types";

export default async function ReservationsPage({ searchParams }: { searchParams: Promise<{ date?: string; status?: string; range?: string }> }) {
  await guard("staff");
  const sp = await searchParams;
  const today = nowIST().date;
  const status = RESERVATION_STATUSES.includes(sp.status as ReservationStatus) ? (sp.status as ReservationStatus) : undefined;
  const list = await getStore().listReservations(sp.date ? { date: sp.date, status } : { from: today, to: addDays(today, sp.range === "all" ? 180 : 7), status });
  const settings = await getStore().getSettings();
  return (
    <>
      <PageTitle title="Reservations" />
      <form className="mb-6 flex flex-wrap gap-3 admin-surface p-4" method="get">
        <input type="date" name="date" defaultValue={sp.date} className="input w-auto" aria-label="Date" />
        <select name="status" defaultValue={status ?? ""} className="input w-auto" aria-label="Status">
          <option value="">All statuses</option>
          {RESERVATION_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
        <button className="btn btn-dark shrink-0 px-6">Filter</button>
        <a href="/admin/reservations" className="btn btn-outline px-4">Next 7 days</a>
      </form>
      {settings.reservations.max_covers_per_slot == null && (
        <p className="mb-6 border border-terracotta/40 bg-ivory p-4 text-sm">Seating capacity isn&apos;t set, so the website accepts every request and you approve each one manually. Set capacity in Settings to block full time slots automatically.</p>
      )}
      <ReservationsBoard reservations={list} />
    </>
  );
}
