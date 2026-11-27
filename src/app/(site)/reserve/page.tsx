import { ArrowUpRight } from "lucide-react";
import { ReservationForm } from "@/components/forms/ReservationForm";
import { Hours } from "@/components/layout/Hours";
import { PlatformLogo } from "@/components/PlatformCard";
import { WhatsAppIcon } from "@/components/ui/icons";
import { PageHero } from "@/components/ui/PageHero";
import { Ticker } from "@/components/ui/Ticker";
import { MEDIA } from "@/lib/media";
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
  const title = settings.content.reservation_headline.replace(/\.$/, "");
  const lastSpace = title.lastIndexOf(" ");
  return (
    <>
      <PageHero
        eyebrow="Reservations"
        title={<>{title.slice(0, lastSpace)} <em className="text-turquoise-deep">{title.slice(lastSpace + 1)}</em><span className="text-pink">.</span></>}
        media={MEDIA.diningRoom}
        accent={MEDIA.latteArt}
        intro={<p>{settings.content.reservation_body}</p>}
      >
        <a href="#request" className="btn btn-primary">Request a table</a>
      </PageHero>
      <Ticker words={["Coffee dates", "Catch-ups", "Celebrations", "Long afternoons", "Party hall"]} tone="blush" />
      <section className="bg-cream py-section">
        <div className="container-site grid gap-12 lg:grid-cols-12">
          <aside className="space-y-10 lg:col-span-4">
            {(booking.length > 0 || wa) && (
              <section aria-labelledby="other-ways">
                <h2 id="other-ways" className="font-display text-3xl">Other ways <em className="text-turquoise-deep">to reserve</em></h2>
                <div className="mt-5 grid gap-4">
                  {booking.length > 0 && (
                    <div className="flex flex-col rounded-[22px] border border-oat bg-paper p-5">
                      <h3 className="font-display text-2xl">Reserve through an online booking platform</h3>
                      <p className="mt-1 text-sm text-muted">Book instantly on our verified listing.</p>
                      <ul className="mt-4 grid gap-2">
                        {booking.map((p) => (
                          <li key={p.id}>
                            <a href={p.platform_url!} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 rounded-full border border-oat bg-ivory p-2 pr-4 transition-colors hover:border-ink">
                              <PlatformLogo p={p} className="h-10 w-10 rounded-full" />
                              <span className="flex-1 text-sm font-semibold">Book a Table on {p.platform_name}<span className="sr-only"> (opens in a new tab)</span></span>
                              <ArrowUpRight size={16} className="text-muted group-hover:text-ink" aria-hidden />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {wa && (
                    <div className="flex flex-col rounded-[22px] bg-navy p-5 text-ivory">
                      <h3 className="font-display text-2xl">Enquire through WhatsApp</h3>
                      <p className="mt-1 text-sm text-ivory/75">Send your date, time and party size. <strong className="font-semibold text-ivory">This is an enquiry, not a booking</strong> — your table is held only once our staff reply to confirm.</p>
                      <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-ghost-light mt-5 min-h-[44px] w-full">
                        <WhatsAppIcon className="h-4 w-4" /> Message us on WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              </section>
            )}
            <div className="border-t border-ink/10 pt-6 text-sm">
              <p className="eyebrow text-muted">Hours</p>
              <Hours business={settings.business} className="mt-3 text-muted" />
            </div>
          </aside>
          <div id="request" className="scroll-mt-28 rounded-[28px] bg-paper p-6 shadow-[var(--shadow-soft)] md:p-10 lg:col-span-8">
            <h2 className="font-display text-[clamp(2rem,1.4rem+2vw,3rem)]">Request a table <em className="text-turquoise-deep">with the café</em><span className="text-pink">.</span></h2>
            <p className="mb-8 mt-2 text-sm text-muted">Requests are confirmed by our team — you&apos;ll get a confirmation from us.</p>
            <ReservationForm maxGuests={r.max_guests_per_booking} maxDays={r.max_days_ahead} enabled={r.enabled} phone={settings.business.phone_display} />
          </div>
        </div>
      </section>
    </>
  );
}
