import { ReservationForm } from "@/components/forms/ReservationForm";
import { Hours } from "@/components/layout/Hours";
import { Photo } from "@/components/ui/Photo";
import { pageMeta } from "@/lib/seo";
import { getSiteData } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata = pageMeta("Reserve a Table", "Request a table at Love Over Coffee, Vijay Nagar, Indore — for coffee dates, catch-ups and celebrations.", "/reserve");

export default async function ReservePage() {
  const { settings } = await getSiteData();
  const r = settings.reservations;
  return (
    <div className="container-site grid gap-14 pt-32 pb-section md:pt-44 lg:grid-cols-12">
      <aside className="lg:col-span-4">
        <p className="eyebrow text-terracotta-ink">Reservations</p>
        <h1 className="mt-5 text-display-md">{settings.content.reservation_headline}</h1>
        <p className="mt-6 leading-relaxed text-muted">{settings.content.reservation_body}</p>
        <Photo alt="A table at the café" label="Your table" tone="interiors" shape="arch" className="mt-10 hidden aspect-[3/4] max-w-xs lg:block" sizes="320px" />
        <div className="mt-10 border-t border-oat pt-6 text-sm">
          <p className="eyebrow text-walnut">Hours</p>
          <Hours business={settings.business} className="mt-3 text-muted" />
        </div>
      </aside>
      <div className="lg:col-span-7 lg:col-start-6">
        <ReservationForm maxGuests={r.max_guests_per_booking} maxDays={r.max_days_ahead} enabled={r.enabled} phone={settings.business.phone_display} />
      </div>
    </div>
  );
}
