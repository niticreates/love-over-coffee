import { ArrowUpRight, Phone } from "lucide-react";
import { ContactForm } from "@/components/forms/ContactForm";
import { Hours } from "@/components/layout/Hours";
import { MapEmbed } from "@/components/layout/MapEmbed";
import { WhatsAppIcon } from "@/components/ui/icons";
import { ClosingCTA } from "@/components/ui/ClosingCTA";
import { PageHero } from "@/components/ui/PageHero";
import { Ticker } from "@/components/ui/Ticker";
import { MEDIA } from "@/lib/media";
import { JsonLd, pageMeta } from "@/lib/seo";
import { whatsappLink } from "@/lib/whatsapp";
import { getSiteData } from "@/lib/site";

export const revalidate = 300;
export const metadata = pageMeta("Contact & Location", "Find Love Over Coffee at Plot No. 11, Scheme No. 113, Vijay Nagar, Indore 452010. Call +91 93296 97769, get directions, or send us a message.", "/contact");

export default async function ContactPage() {
  const { settings, platforms } = await getSiteData();
  const b = settings.business;
  const c = settings.commerce;
  const mapsLink = platforms.find((p) => p.platform_type === "location")?.platform_url ?? b.maps_place_url;
  const waGroup = whatsappLink(b, "group");
  const faqs = [
    { q: "Can I reserve a table?", a: "Yes. Send a request on our reservations page with your date, time and number of guests. Your booking is confirmed once the café approves it — you'll get a confirmation from us." },
    { q: "Do you take online orders?", a: c.ordering_enabled ? `Yes — order on this website and pay securely online${c.delivery_enabled ? " for pickup or delivery" : " for pickup at the café"}.` : "Online ordering is opening soon. Until then, please call the café to place an order." },
    { q: "Do you have board games?", a: "Yes — games and books are available at the café for guests to enjoy." },
    { q: "Is the café good for working?", a: "Many guests come to work over coffee. Seating is first-come, first-served unless you reserve." },
    { q: "Where exactly are you?", a: `${b.address_lines.join(", ")}, ${b.city} ${b.postal_code}. Use “Get directions” for turn-by-turn navigation.` },
  ];
  return (
    <div>
      <PageHero
        eyebrow="Contact"
        title={<>Come say <em className="text-turquoise-deep">hello</em><span className="text-pink">.</span></>}
        media={MEDIA.diningRoom}
        accent={MEDIA.coldCoffees}
        intro={<p>Call, WhatsApp or drop in — we&apos;re on Scheme 113 in Vijay Nagar, Indore.</p>}
      >
        <div className="flex flex-wrap gap-3">
          <a href={`tel:${b.phone_e164}`} className="btn btn-dark"><Phone size={14} /> {b.phone_display}</a>
          {whatsappLink(b, "general") && <a href={whatsappLink(b, "general")!} target="_blank" rel="noopener noreferrer" className="btn btn-outline"><WhatsAppIcon className="h-4 w-4" /> WhatsApp</a>}
        </div>
      </PageHero>
      <Ticker words={["Call us", "WhatsApp us", "Drop in", "Scheme 113", "Vijay Nagar", "Indore"]} />
      <section className="bg-cream py-section">
      <div className="container-site grid gap-14 lg:grid-cols-12">
        <div className="space-y-10 lg:col-span-5">
          <div>
            <p className="eyebrow text-walnut">Address</p>
            <address className="mt-4 font-display text-3xl not-italic leading-snug">{b.address_lines.map((l) => <span key={l} className="block">{l}</span>)}{b.city}, {b.region} {b.postal_code}</address>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={`tel:${b.phone_e164}`} className="btn btn-dark"><Phone size={14} /> {b.phone_display}</a>
            {whatsappLink(b, "general") && <a href={whatsappLink(b, "general")!} target="_blank" rel="noopener noreferrer" className="btn btn-outline"><WhatsAppIcon className="h-4 w-4" /> WhatsApp</a>}
            <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="btn btn-outline">Get directions <ArrowUpRight size={14} /></a>
          </div>
          <div className="border-t border-oat pt-8">
            <p className="eyebrow text-walnut">Opening hours</p>
            <Hours business={b} className="mt-4 max-w-sm text-muted" />
          </div>
        </div>
        <div className="overflow-hidden rounded-[24px] border border-oat lg:col-span-7"><MapEmbed query={b.maps_query} className="aspect-[4/3] h-full" /></div>
      </div>
      </section>
      <div className="container-site grid gap-14 py-section lg:grid-cols-12">
        <section className="lg:col-span-5" aria-labelledby="msg">
          <h2 id="msg" className="text-display-md">Send a <em className="text-turquoise-deep">message</em><span className="text-pink">.</span></h2>
          <p className="mt-4 text-muted">For events, large groups or anything else.</p>
          {waGroup && <p className="mt-3 text-sm text-muted">Coming with a group? <a href={waGroup} target="_blank" rel="noopener noreferrer" className="link-underline text-espresso">Message us on WhatsApp</a> and our team will confirm what we can arrange.</p>}
          <div className="mt-8"><ContactForm /></div>
        </section>
        <section className="lg:col-span-6 lg:col-start-7" aria-labelledby="faq">
          <h2 id="faq" className="text-display-md">Good <em className="text-turquoise-deep">questions</em><span className="text-pink">.</span></h2>
          <div className="mt-8 divide-y divide-oat border-y border-oat">
            {faqs.map((f, i) => (
              <details key={f.q} data-aos="fade-up" data-aos-delay={String(i * 70)} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-2xl">
                  {f.q}<span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-turquoise text-ink transition-transform duration-300 group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <p className="mt-3 max-w-prose leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
      <ClosingCTA />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />
    </div>
  );
}
