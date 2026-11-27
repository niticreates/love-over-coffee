import Link from "next/link";
import { ArrowUpRight, MapPin, Phone } from "lucide-react";
import { Hero } from "@/components/home/Hero";
import { MenuPreview } from "@/components/home/MenuPreview";
import { Hours } from "@/components/layout/Hours";
import { MapEmbed } from "@/components/layout/MapEmbed";
import { ProductCard } from "@/components/menu/ProductCard";
import { Photo } from "@/components/ui/Photo";
import { ImageReveal, Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WhatsAppIcon } from "@/components/ui/icons";
import { whatsappLink } from "@/lib/whatsapp";
import { toPublic } from "@/lib/public";
import { getSiteData } from "@/lib/site";

export const revalidate = 60;

const EXPERIENCES = [
  { title: "Coffee & Conversations", body: "Cappuccinos, cold coffees and Biscoff-laced indulgences, made for tables that stay occupied a little longer.", tone: "beverages" as const },
  { title: "Delicious Food", body: "Comfort plates with Italian and Mexican accents — nachos, pull-apart garlic bread, penne and more.", tone: "food" as const },
  { title: "Cozy Interiors", body: "Warm, aesthetic and laptop-friendly. A room that invites you to stay.", tone: "interiors" as const },
  { title: "Board Games & Good Times", body: "Games and books on the shelf, for long chats and easy evenings with friends.", tone: "experiences" as const },
];

export default async function Home() {
  const { settings, categories, products, featured, gallery, flags } = await getSiteData();
  const c = settings.content;
  const b = settings.business;
  const ordering = settings.commerce.ordering_enabled;
  return (
    <>
      <Hero headline={c.hero_headline} subhead={c.hero_subhead} image={c.hero_image_url} />

      {/* Brand introduction — asymmetric editorial */}
      <section className="container-site py-section">
        <div className="grid items-end gap-12 md:grid-cols-12">
          <ImageReveal className="md:col-span-6 lg:col-span-5">
            <Photo alt="The café interior" label="Interior" tone="interiors" shape="arch" className="aspect-[4/5]" sizes="(min-width:768px) 45vw, 100vw" />
          </ImageReveal>
          <div className="md:col-span-6 lg:col-span-6 lg:col-start-7">
            <Reveal>
              <SectionHeading index="01" eyebrow="Welcome" title={c.intro_headline}>
                <p>{c.intro_body}</p>
              </SectionHeading>
              <Link href="/story" className="btn btn-outline mt-10">Discover Our Story</Link>
            </Reveal>
            <Reveal delay={0.15} className="mt-14 ml-auto w-1/2 max-w-[240px]">
              <Photo alt="A cup of coffee" label="Coffee" tone="beverages" className="aspect-square" sizes="240px" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Signature favourites */}
      <section className="border-t border-oat bg-paper py-section">
        <div className="container-site">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <Reveal><SectionHeading index="02" eyebrow="Signature favourites" title={<>Loved by <em>regulars.</em></>} /></Reveal>
            <Link href="/menu" className="link-underline eyebrow self-start md:self-auto">Full menu →</Link>
          </div>
          <div className="mt-14 -mx-[var(--spacing-gutter)] flex snap-x snap-mandatory scroll-px-[var(--spacing-gutter)] gap-6 overflow-x-auto px-[var(--spacing-gutter)] pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-8 sm:gap-y-16 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {featured.map((p, i) => (
              <div key={p.id} className="w-[78vw] max-w-[320px] shrink-0 snap-start sm:w-auto sm:max-w-none">
                <Reveal delay={(i % 4) * 0.08}><ProductCard product={toPublic(p)} orderingEnabled={ordering} sample={flags.samplePrices} index={i} /></Reveal>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experience */}
      <section className="container-site py-section">
        <Reveal><SectionHeading index="03" eyebrow="The experience" title={<>Made for <em>slowing down.</em></>} align="center" /></Reveal>
        <div className="mt-20 grid gap-x-10 gap-y-20 md:grid-cols-2">
          {EXPERIENCES.map((e, i) => (
            <Reveal key={e.title} delay={(i % 2) * 0.1} className={i % 2 ? "md:mt-32" : ""}>
              <ImageReveal><Photo alt={e.title} label={e.title} tone={e.tone} className={i % 3 === 0 ? "aspect-[4/5]" : "aspect-[5/4]"} sizes="(min-width:768px) 45vw, 100vw" /></ImageReveal>
              <h3 className="mt-7 text-4xl">{e.title}</h3>
              <p className="mt-3 max-w-md leading-relaxed text-muted">{e.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Menu preview */}
      <section className="border-t border-oat py-section">
        <div className="container-site">
          <Reveal><SectionHeading index="04" eyebrow="The menu" title="Something for every mood." /></Reveal>
          <div className="mt-14"><MenuPreview categories={categories} products={products.map(toPublic)} sample={flags.samplePrices} /></div>
          <div className="mt-12 text-center"><Link href="/menu" className="btn btn-dark">Explore Full Menu</Link></div>
        </div>
      </section>

      {/* Gallery */}
      <section className="bg-paper py-section">
        <div className="container-site">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <Reveal><SectionHeading index="05" eyebrow="Gallery" title="Moments at the café." /></Reveal>
            <div className="flex gap-6">
              {b.instagram_url && <a href={b.instagram_url} target="_blank" rel="noopener noreferrer" className="link-underline eyebrow">Instagram ↗</a>}
              <Link href="/gallery" className="link-underline eyebrow">View gallery →</Link>
            </div>
          </div>
          <div className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            {gallery.slice(0, 5).map((g, i) => (
              <Reveal key={g.id} delay={i * 0.06} className={i === 0 ? "col-span-2 row-span-2" : ""}>
                <Photo src={g.url} alt={g.alt} label={g.alt} tone={g.category} className={i === 0 ? "aspect-square md:aspect-[1/1.02]" : "aspect-square"} sizes="(min-width:768px) 25vw, 50vw" />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Reservation CTA */}
      <section className="relative overflow-hidden bg-charcoal py-section text-ivory">
        <svg aria-hidden className="absolute -right-24 top-1/2 h-[140%] -translate-y-1/2 opacity-[.08]" viewBox="0 0 400 520" fill="none" stroke="#F2EBDD"><path d="M20 520V200a180 180 0 0 1 360 0v320" /><path d="M80 520V210a120 120 0 0 1 240 0v310" /></svg>
        <div className="container-site relative text-center">
          <Reveal>
            <p className="eyebrow text-sage">Reservations</p>
            <h2 className="mx-auto mt-6 max-w-3xl text-display-md">{c.reservation_headline}</h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ivory/75">{c.reservation_body}</p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link href="/reserve" className="btn btn-primary">Book Your Table</Link>
              {whatsappLink(settings.business, "reservation") && (
                <a href={whatsappLink(settings.business, "reservation")!} target="_blank" rel="noopener noreferrer" className="btn btn-outline border-ivory/40 text-ivory hover:bg-ivory hover:text-espresso">
                  <WhatsAppIcon className="h-4 w-4" /> Enquire on WhatsApp
                </a>
              )}
            </div>
            <p className="mt-5 text-xs text-ivory/55">WhatsApp enquiries are confirmed by our team.</p>
          </Reveal>
        </div>
      </section>

      {/* Location */}
      <section className="container-site py-section">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal>
              <SectionHeading index="06" eyebrow="Visit us" title="Find Your Way to Us." />
              <div className="mt-10 space-y-8 text-[1.02rem]">
                <div className="flex gap-4">
                  <MapPin className="mt-1 shrink-0 text-terracotta-ink" size={18} />
                  <address className="not-italic leading-relaxed">{b.address_lines.join(", ")}<br />{b.city}, {b.region} {b.postal_code}</address>
                </div>
                <div className="flex gap-4">
                  <Phone className="mt-1 shrink-0 text-terracotta-ink" size={18} />
                  <a href={`tel:${b.phone_e164}`} className="link-underline">{b.phone_display}</a>
                </div>
                <div className="border-t border-oat pt-6">
                  <p className="eyebrow text-walnut">Opening hours</p>
                  <Hours business={b} className="mt-4 max-w-sm text-muted" />
                </div>
              </div>
              <a href={b.maps_place_url} target="_blank" rel="noopener noreferrer" className="btn btn-dark mt-10">Get Directions <ArrowUpRight size={14} /></a>
            </Reveal>
          </div>
          <Reveal className="lg:col-span-7"><MapEmbed query={b.maps_query} className="aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[480px]" /></Reveal>
        </div>
      </section>
    </>
  );
}
