import { ArrowUpRight, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { Hours } from "@/components/layout/Hours";
import { MapEmbed } from "@/components/layout/MapEmbed";
import { PlatformCard } from "@/components/PlatformCard";
import { WhatsAppIcon } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { pageMeta } from "@/lib/seo";
import { getSiteData } from "@/lib/site";
import { whatsappLink } from "@/lib/whatsapp";

export const revalidate = 60;
export const metadata = pageMeta(
  "Book & Order",
  "Book a table or order Love Over Coffee, Vijay Nagar, Indore through District, Zomato or Swiggy — or message us on WhatsApp.",
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

  return (
    <div className="pt-32 md:pt-44">
      <header className="container-site grid gap-8 md:grid-cols-12 md:items-end">
        <div className="md:col-span-8">
          <p className="eyebrow text-terracotta-ink">Book &amp; Order</p>
          <h1 className="mt-5 text-display-lg">Your Coffee Experience, <em>Your Way.</em></h1>
        </div>
        <p className="text-lg leading-relaxed text-muted md:col-span-4">Reserve your table or order your favourites through your preferred platform.</p>
      </header>

      {/* Three ways in */}
      <div className="container-site mt-14"><nav aria-label="Ways to visit" className="grid gap-px overflow-hidden border border-oat bg-oat sm:grid-cols-3">
        {[
          { n: "01", t: "Book a table", d: reserve.length ? "Instantly on a booking platform, or request one from us." : "Request one directly from the café.", href: "#reserve" },
          { n: "02", t: "Order", d: direct ? "Pickup from our own website, or delivery via partners." : "Delivery and takeaway via our partners.", href: "#order" },
          { n: "03", t: "Talk to us", d: "WhatsApp or call the café — staff reply and confirm.", href: "#visit" },
        ].map((x) => (
          <a key={x.n} href={x.href} className="group bg-ivory p-6 transition-colors hover:bg-paper">
            <span className="font-display text-sm italic text-terracotta-ink">{x.n}</span>
            <span className="mt-2 block font-display text-2xl group-hover:italic">{x.t}</span>
            <span className="mt-1 block text-sm text-muted">{x.d}</span>
          </a>
        ))}
      </nav></div>

      {/* A. Reserve */}
      <section id="reserve" className="container-site scroll-mt-28 py-section">
        <Reveal><SectionHeading index="A" eyebrow="Reserve your table" title={<>A table, <em>held for you.</em></>} /></Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reserve.map((p) => <Reveal key={p.id}><PlatformCard p={p} cta="Book a Table" /></Reveal>)}
          <Reveal>
            <Link href="/reserve" className="group flex h-full flex-col border border-oat bg-paper p-6 transition-[border-color,box-shadow] duration-300 hover:border-walnut/50 hover:shadow-soft md:p-7">
              <span className="font-display grid h-12 w-12 place-items-center rounded-[10px] bg-terracotta text-lg italic text-white" aria-hidden>L</span>
              <h3 className="mt-6 text-3xl">Request with the café</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">Send a request on our website. Our team confirms it with you.</p>
              <span className="mt-auto pt-6"><span className="btn btn-primary min-h-[42px] w-full">Request a Table</span></span>
            </Link>
          </Reveal>
          {waReserve && (
            <Reveal>
              <a href={waReserve} target="_blank" rel="noopener noreferrer" className="group flex h-full flex-col border border-oat bg-paper p-6 transition-[border-color,box-shadow] duration-300 hover:border-walnut/50 hover:shadow-soft md:p-7">
                <span className="grid h-12 w-12 place-items-center rounded-[10px] bg-[#25D366] text-white" aria-hidden><WhatsAppIcon className="h-6 w-6" /></span>
                <h3 className="mt-6 text-3xl">Enquire on WhatsApp</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">Message us your date, time and party size. A WhatsApp message isn&apos;t a confirmed booking until our staff reply to confirm.</p>
                <span className="mt-auto pt-6"><span className="btn btn-outline min-h-[42px] w-full group-hover:bg-espresso group-hover:text-ivory">Message us <span className="sr-only">(opens WhatsApp)</span></span></span>
              </a>
            </Reveal>
          )}
        </div>
      </section>

      {/* B. Order */}
      <section id="order" className="scroll-mt-28 border-t border-oat bg-paper py-section">
        <div className="container-site">
          <Reveal><SectionHeading index="B" eyebrow="Order your favourites" title={<>Delivered, <em>or ready to collect.</em></>} /></Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {direct && (
              <Reveal>
                <Link href="/menu" className="flex h-full flex-col border border-espresso bg-ivory p-6 md:p-7">
                  <span className="font-display grid h-12 w-12 place-items-center rounded-[10px] bg-espresso text-lg italic text-ivory" aria-hidden>L</span>
                  <h3 className="mt-6 text-3xl">Order from us</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">Order and pay on our website for pickup — straight to our kitchen.</p>
                  <span className="mt-auto pt-6"><span className="btn btn-dark min-h-[42px] w-full">Order Now</span></span>
                </Link>
              </Reveal>
            )}
            {order.map((p) => <Reveal key={p.id}><PlatformCard p={p} cta="Order Now" /></Reveal>)}
          </div>
          {waOrder && (
            <p className="mt-8 text-sm text-muted">
              Questions about an order or a large order? <a href={waOrder} target="_blank" rel="noopener noreferrer" className="link-underline text-espresso">Ask us on WhatsApp</a>.
              {" "}Orders placed with Zomato or Swiggy are handled by those platforms.
            </p>
          )}
        </div>
      </section>

      {/* C. Location */}
      <section id="visit" className="container-site scroll-mt-28 py-section">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal>
              <SectionHeading index="C" eyebrow="Discover our location" title="Find your way to us." />
              <div className="mt-10 space-y-6">
                <div className="flex gap-4"><MapPin className="mt-1 shrink-0 text-terracotta-ink" size={18} /><address className="not-italic leading-relaxed">{b.address_lines.join(", ")}<br />{b.city}, {b.region} {b.postal_code}</address></div>
                <div className="flex gap-4"><Phone className="mt-1 shrink-0 text-terracotta-ink" size={18} /><a href={`tel:${b.phone_e164}`} className="link-underline">{b.phone_display}</a></div>
                <div className="border-t border-oat pt-6"><p className="eyebrow text-walnut">Opening hours</p><Hours business={b} className="mt-3 max-w-sm text-muted" /></div>
              </div>
              <div className="mt-10 flex flex-wrap gap-3">
                <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="btn btn-dark">Get Directions <ArrowUpRight size={14} /></a>
                <a href={`tel:${b.phone_e164}`} className="btn btn-outline"><Phone size={14} /> Call</a>
                {waGroup && <a href={waGroup} target="_blank" rel="noopener noreferrer" className="btn btn-outline"><WhatsAppIcon className="h-4 w-4" /> Group visit</a>}
              </div>
            </Reveal>
          </div>
          <Reveal className="lg:col-span-7"><MapEmbed query={b.maps_query} className="aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[460px]" /></Reveal>
        </div>
      </section>
    </div>
  );
}
