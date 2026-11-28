import { ArrowUpRight, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { Hours } from "@/components/layout/Hours";
import { MapEmbed } from "@/components/layout/MapEmbed";
import { PlatformCard } from "@/components/PlatformCard";
import { WhatsAppIcon } from "@/components/ui/icons";
import { Mascot } from "@/components/ui/Mascot";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { Ticker } from "@/components/ui/Ticker";
import { MEDIA } from "@/lib/media";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { breadcrumbJsonLd, JsonLd, pageMeta } from "@/lib/seo";
import { getSiteData } from "@/lib/site";
import { whatsappLink } from "@/lib/whatsapp";
import { PhoneLink } from "@/components/ui/PhoneLink";
import { DemoContactNotice } from "@/components/layout/DemoNotice";

export const revalidate = 60;
export const metadata = pageMeta(
  "Book a Table or Order Online | Love Over Coffee Vijay Nagar, Indore",
  "Book a table at Love Over Coffee, Vijay Nagar, Indore on District, order on Zomato or Swiggy, order online for pickup, or ask about birthdays on WhatsApp.",
  "/book-order",
);

export default async function BookOrderPage() {
  const { platforms, settings } = await getSiteData();
  const b = settings.business;
  const reserve = platforms.filter((p) => p.platform_type === "reservation");
  const order = platforms.filter((p) => p.platform_type === "ordering");
  const mapsLink = platforms.find((p) => p.platform_type === "location")?.platform_url ?? b.maps_place_url;
  const waReserve = whatsappLink(b, "reservation");
  const waOrder = whatsappLink(b, "ordering");
  const waGroup = whatsappLink(b, "group");
  const direct = settings.commerce.ordering_enabled;
  const names = (list: typeof platforms) => list.map((p) => p.platform_name).join(" or ");
  const address = `${b.address_lines.join(", ")}, ${b.city} ${b.postal_code}`;
  const faqs = [
    {
      q: "How do I reserve a table at Love Over Coffee, Vijay Nagar?",
      a: `${reserve.length ? `Book on ${names(reserve)}, ` : ""}send a request through the Reserve a Table page on this website${waReserve ? ", or message the café on WhatsApp" : ""}. A request is confirmed once café staff confirm it.`,
    },
    ...(waReserve ? [{ q: "Is a WhatsApp message a confirmed booking?", a: "No. A WhatsApp message is an enquiry. Your table or order is confirmed only when café staff reply to confirm it." }] : []),
    ...(direct ? [{ q: "Can I order online for pickup?", a: "Yes. Add items from the menu on this website, pay at checkout and collect your order from the café." }] : []),
    ...(order.length ? [{ q: "Does Love Over Coffee deliver?", a: `Delivery is available through ${names(order)}. Orders placed there are handled by those platforms.` }] : []),
    { q: "Where is Love Over Coffee in Indore?", a: `At ${address}, in Vijay Nagar.${b.phone_display ? ` Call ${b.phone_display} for directions.` : ""}` },
  ];

  return (
    <div>
      <JsonLd data={breadcrumbJsonLd([["Book & Order", "/book-order"]])} />
      <PageHero
        eyebrow="Book & Order"
        title={<>Your Coffee Experience, <em className="text-turquoise-deep">Your Way</em><span className="text-pink">.</span></>}
        media={MEDIA.storefront}
        accent={MEDIA.latteArt}
        intro={<p>Reserve your table or order your favourites through your preferred platform.</p>}
      />
      <div className="container-site"><DemoContactNotice className="mb-8" /></div>

      {/* Three ways in */}
      <div className="container-site"><nav aria-label="Ways to visit" className="grid gap-px overflow-hidden rounded-[28px] bg-navy/60 sm:grid-cols-3">
        {[
          { n: "01", t: "Book a table", d: reserve.length ? "Instantly on a booking platform, or request one from us." : "Request one directly from the café.", href: "#reserve" },
          { n: "02", t: "Order", d: direct ? "Pickup from our own website, or delivery via partners." : "Delivery and takeaway via our partners.", href: "#order" },
          { n: "03", t: "Talk to us", d: "WhatsApp or call the café — staff reply and confirm.", href: "#visit" },
        ].map((x) => (
          <a key={x.n} href={x.href} className="group bg-navy p-6 text-ivory transition-colors hover:bg-ink md:p-8">
            <span className="font-display text-sm italic text-turquoise">{x.n}</span>
            <span className="mt-2 block font-display text-3xl transition-transform duration-500 group-hover:translate-x-1 group-hover:italic">{x.t} <span className="text-turquoise">→</span></span>
            <span className="mt-2 block text-sm text-ivory/70">{x.d}</span>
          </a>
        ))}
      </nav></div>

      {/* A. Reserve */}
      <section id="reserve" className="container-site scroll-mt-28 py-section">
        <Reveal><SectionHeading index="A" eyebrow="Reserve your table" title={<>A table, <em className="text-turquoise-deep">held for you.</em></>} /></Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reserve.map((p, i) => <div key={p.id} data-aos="flip-up" data-aos-delay={String(i * 110)}><PlatformCard p={p} cta="Book a Table" /></div>)}
          <Reveal>
            <Link href="/reserve" className="group flex h-full flex-col rounded-[22px] border border-oat bg-paper p-6 transition-[border-color,box-shadow] duration-300 hover:border-walnut/50 hover:shadow-soft md:p-7">
              <span className="grid h-12 w-12 place-items-center rounded-[12px] bg-turquoise" aria-hidden><Mascot className="h-auto w-[55%]" title={null} animated={false} /></span>
              <h3 className="mt-6 text-3xl">Request with the café</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">Send a request on our website. Our team confirms it with you.</p>
              <span className="mt-auto pt-6"><span className="btn btn-primary min-h-[42px] w-full">Request a Table</span></span>
            </Link>
          </Reveal>
          {waReserve && (
            <Reveal>
              <a href={waReserve} target="_blank" rel="noopener noreferrer" className="group flex h-full flex-col rounded-[22px] border border-oat bg-paper p-6 transition-[border-color,box-shadow] duration-300 hover:border-walnut/50 hover:shadow-soft md:p-7">
                <span className="grid h-12 w-12 place-items-center rounded-[12px] bg-[#25D366] text-white" aria-hidden><WhatsAppIcon className="h-6 w-6" /></span>
                <h3 className="mt-6 text-3xl">Enquire on WhatsApp</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">Message us your date, time and party size. A WhatsApp message isn&apos;t a confirmed booking until our staff reply to confirm.</p>
                <span className="mt-auto pt-6"><span className="btn btn-outline min-h-[42px] w-full group-hover:bg-espresso group-hover:text-ivory">Message us <span className="sr-only">(opens WhatsApp)</span></span></span>
              </a>
            </Reveal>
          )}
        </div>
      </section>

      {/* B. Order */}
      <section id="order" className="scroll-mt-28 bg-navy py-section text-ivory">
        <div className="container-site">
          <Reveal><SectionHeading tone="light" index="B" eyebrow="Order your favourites" title={<>Delivered, <em className="text-turquoise">or ready to collect.</em></>} /></Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {direct && (
              <Reveal>
                <Link href="/menu" className="group flex h-full flex-col rounded-[22px] bg-turquoise p-6 text-ink transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-24px_rgb(0_0_0/.6)] md:p-7">
                  <span className="grid h-12 w-12 place-items-center rounded-[12px] bg-ivory" aria-hidden><Mascot className="h-auto w-[55%]" title={null} animated={false} /></span>
                  <h3 className="mt-6 text-3xl">Order from us</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/80">Order and pay on our website for pickup — straight to our kitchen.</p>
                  <span className="mt-auto pt-6"><span className="btn btn-card min-h-[42px] w-full">Order Now</span></span>
                </Link>
              </Reveal>
            )}
            {order.map((p, i) => <div key={p.id} data-aos="flip-up" data-aos-delay={String((i + 1) * 110)}><PlatformCard p={p} cta="Order Now" tone="turquoise" /></div>)}
          </div>
          {waOrder && (
            <p className="mt-8 text-sm text-ivory/70">
              Questions about an order or a large order? <a href={waOrder} target="_blank" rel="noopener noreferrer" className="link-underline text-ivory">Ask us on WhatsApp</a>.
              {" "}Orders placed with Zomato or Swiggy are handled by those platforms.
            </p>
          )}
        </div>
      </section>

      <Ticker words={["Book a table", "Order online", "Zomato", "Swiggy", "District", "WhatsApp us"]} />

      {/* C. Location */}
      <section id="visit" className="scroll-mt-28 bg-cream py-section">
        <div className="container-site grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal>
              <SectionHeading index="C" eyebrow="Discover our location" title="Find your way to us." />
              <div className="mt-10 space-y-6">
                <div className="flex gap-4"><MapPin className="mt-1 shrink-0 text-terracotta-ink" size={18} /><address className="not-italic leading-relaxed">{b.address_lines.join(", ")}<br />{b.city}, {b.region} {b.postal_code}</address></div>
                <div className="flex gap-4"><Phone className="mt-1 shrink-0 text-terracotta-ink" size={18} /><PhoneLink e164={b.phone_e164} className="link-underline">{b.phone_display}</PhoneLink></div>
                <div className="border-t border-oat pt-6"><p className="eyebrow text-walnut">Opening hours</p><Hours business={b} className="mt-3 max-w-sm text-muted" /></div>
              </div>
              <div className="mt-10 flex flex-wrap gap-3">
                <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="btn btn-dark">Get Directions <ArrowUpRight size={14} /></a>
                <PhoneLink e164={b.phone_e164} className="btn btn-outline"><Phone size={14} /> Call</PhoneLink>
                {waGroup && <a href={waGroup} target="_blank" rel="noopener noreferrer" className="btn btn-outline"><WhatsAppIcon className="h-4 w-4" /> Group visit</a>}
              </div>
            </Reveal>
          </div>
          <Reveal className="lg:col-span-7"><div className="h-full overflow-hidden rounded-[24px] border border-oat"><MapEmbed query={b.maps_query} className="aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[460px]" /></div></Reveal>
        </div>
      </section>

      {/* D. Questions people ask — visible answers, mirrored in FAQPage structured data */}
      <section id="faq" className="container-site scroll-mt-28 py-section">
        <Reveal><SectionHeading index="D" eyebrow="Good to know" title={<>Booking &amp; ordering, <em className="text-turquoise-deep">answered.</em></>} /></Reveal>
        <div className="mt-10 max-w-4xl divide-y divide-oat border-y border-oat">
          {faqs.map((f, i) => (
            <details key={f.q} data-aos="fade-up" data-aos-delay={String(i * 70)} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-2xl text-ink">
                {f.q}
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-turquoise text-ink transition-transform duration-300 group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="mt-3 max-w-prose leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
        <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />
      </section>
    </div>
  );
}
