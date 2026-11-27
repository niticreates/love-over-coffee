import { ArrowUpRight } from "lucide-react";
import { ReservationForm } from "@/components/forms/ReservationForm";
import { Hours } from "@/components/layout/Hours";
import { PlatformLogo } from "@/components/PlatformCard";
import { WhatsAppIcon } from "@/components/ui/icons";
import { Photo } from "@/components/ui/Photo";
import { pageMeta } from "@/lib/seo";
import { getSiteData } from "@/lib/site";
import { whatsappLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
export const metadata = pageMeta("Reserve a Table", "Request a table at Love Over Coffee, Vijay Nagar, Indore — for coffee dates, catch-ups and celebrations.", "/reserve");

export default async function ReservePage() {
  const { settings, platforms } = await getSiteData();
  const r = settings.reservations;
  const booking = platforms.filter((p) => p.platform_type === "reservation");
  const wa = whatsappLink(settings.business, "reservation");
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
        {(booking.length > 0 || wa) && (
          <section aria-labelledby="other-ways" className="mb-12">
            <h2 id="other-ways" className="eyebrow text-walnut">Other ways to reserve</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {booking.length > 0 && (
                <div className="flex flex-col border border-oat bg-paper p-5">
                  <h3 className="font-display text-2xl">Reserve through an online booking platform</h3>
                  <p className="mt-1 text-sm text-muted">Book instantly on our verified listing.</p>
                  <ul className="mt-4 grid gap-2">
                    {booking.map((p) => (
                      <li key={p.id}>
                        <a href={p.platform_url!} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 border border-oat bg-ivory p-2.5 pr-4 transition-colors hover:border-walnut/50">
                          <PlatformLogo p={p} className="h-10 w-10" />
                          <span className="flex-1 text-sm font-semibold">Book a Table on {p.platform_name}<span className="sr-only"> (opens in a new tab)</span></span>
                          <ArrowUpRight size={16} className="text-muted group-hover:text-espresso" aria-hidden />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {wa && (
                <div className="flex flex-col border border-oat bg-paper p-5">
                  <h3 className="font-display text-2xl">Enquire through WhatsApp</h3>
                  <p className="mt-1 text-sm text-muted">Send your date, time and party size. <strong className="font-semibold text-espresso">This is an enquiry, not a booking</strong> — your table is held only once our staff reply to confirm.</p>
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-outline mt-5 min-h-[44px] w-full">
                    <WhatsAppIcon className="h-4 w-4" /> Message us on WhatsApp
                  </a>
                </div>
              )}
            </div>
            <p className="mt-8 text-sm text-muted">Or request a table directly with the café below.</p>
          </section>
        )}
        <ReservationForm maxGuests={r.max_guests_per_booking} maxDays={r.max_days_ahead} enabled={r.enabled} phone={settings.business.phone_display} />
      </div>
    </div>
  );
}
