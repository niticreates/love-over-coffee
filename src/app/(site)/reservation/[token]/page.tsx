import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReservationActions } from "@/components/forms/ReservationActions";
import { fmt12 } from "@/lib/hours";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your reservation", robots: { index: false } };

const LABEL: Record<string, [string, string]> = {
  requested: ["Awaiting confirmation", "The café has your request and will confirm shortly. Your table is not guaranteed until confirmed."],
  confirmed: ["Confirmed", "Your table is confirmed. We look forward to seeing you."],
  rejected: ["Not available", "Sorry, the café couldn't accommodate this request. Please try another time or call us."],
  cancelled: ["Cancelled", "This reservation has been cancelled."],
  completed: ["Completed", "Thanks for visiting!"],
  no_show: ["Missed", "This reservation was marked as missed."],
};

export default async function ReservationStatus({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const r = await getStore().getReservationByToken(token);
  if (!r) notFound();
  const [title, body] = LABEL[r.status];
  const date = new Date(`${r.date}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  return (
    <div className="container-site max-w-3xl pt-32 pb-section md:pt-44">
      <p className="eyebrow text-terracotta-ink">Reservation {r.reference}</p>
      <h1 className="mt-5 text-display-md">{title}</h1>
      <p className="mt-4 max-w-prose text-muted">{body}</p>
      <dl className="mt-10 grid grid-cols-2 gap-6 border-y border-oat py-8 sm:grid-cols-3">
        <div><dt className="eyebrow text-walnut">Date</dt><dd className="mt-2 font-display text-2xl">{date}</dd></div>
        <div><dt className="eyebrow text-walnut">Time</dt><dd className="mt-2 font-display text-2xl">{fmt12(r.time)}</dd></div>
        <div><dt className="eyebrow text-walnut">Guests</dt><dd className="mt-2 font-display text-2xl">{r.guests}</dd></div>
      </dl>
      {["requested", "confirmed"].includes(r.status) && <ReservationActions token={token} />}
    </div>
  );
}
