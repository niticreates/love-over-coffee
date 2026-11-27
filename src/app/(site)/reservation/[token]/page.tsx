import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReservationActions } from "@/components/forms/ReservationActions";
import { PageHero } from "@/components/ui/PageHero";
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
    <>
    <PageHero size="compact" eyebrow={`Reservation ${r.reference}`} title={<>{title}<span className="text-pink">.</span></>} intro={<p>{body}</p>} />
    <div className="container-site max-w-3xl pb-section">
      <dl className="grid grid-cols-2 gap-6 rounded-[24px] bg-navy p-6 text-ivory sm:grid-cols-3 md:p-8 [&_dt]:text-turquoise">
        <div><dt className="eyebrow text-walnut">Date</dt><dd className="mt-2 font-display text-2xl">{date}</dd></div>
        <div><dt className="eyebrow text-walnut">Time</dt><dd className="mt-2 font-display text-2xl">{fmt12(r.time)}</dd></div>
        <div><dt className="eyebrow text-walnut">Guests</dt><dd className="mt-2 font-display text-2xl">{r.guests}</dd></div>
      </dl>
      {["requested", "confirmed"].includes(r.status) && <ReservationActions token={token} />}
    </div>
    </>
  );
}
