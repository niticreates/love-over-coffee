import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin, Phone } from "lucide-react";
import { Experiences } from "@/components/home/Experiences";
import { Hero } from "@/components/home/Hero";
import { HomeGallery } from "@/components/home/HomeGallery";
import { RoomStrip } from "@/components/home/RoomStrip";
import { SignatureMenu } from "@/components/home/SignatureMenu";
import { Hours } from "@/components/layout/Hours";
import { MapEmbed } from "@/components/layout/MapEmbed";
import { Mascot } from "@/components/ui/Mascot";
import { ImageReveal, Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WhatsAppIcon } from "@/components/ui/icons";
import { MEDIA, type Media } from "@/lib/media";
import { toPublic } from "@/lib/public";
import { getSiteData } from "@/lib/site";
import { whatsappLink } from "@/lib/whatsapp";
import type { Metadata } from "next";
import { PhoneLink } from "@/components/ui/PhoneLink";

export const metadata: Metadata = { title: { absolute: "Love Over Coffee Indore | Café in Vijay Nagar, Scheme 113" }, alternates: { canonical: "/" } };

export const revalidate = 60;

const EXPERIENCES = [
  { title: "Coffee & conversations", body: "Cappuccinos with latte art, cold coffees and Biscoff-laced indulgences, made for tables that stay occupied a little longer.", media: MEDIA.latteArt },
  { title: "Comfort food", body: "Plates with Italian and Mexican accents — loaded nachos, pull-apart garlic bread, pizza, penne and more.", media: MEDIA.nachos },
  { title: "A room to stay in", body: "A deep navy ceiling, blush velvet chairs, green sofas and warm light. Laptop-friendly, conversation-friendly.", media: MEDIA.diningRoom },
  { title: "Books & good company", body: "A wall of books by the counter and board games for long, easy evenings with friends.", media: MEDIA.counterBooks },
];

/** Inline photograph set into a line of display type. */
function Pill({ m }: { m: Media }) {
  return (
    <span className="img-pill" aria-hidden>
      <Image src={m.src} alt="" fill sizes="120px" className="object-cover" style={{ objectPosition: m.position }} />
    </span>
  );
}

export default async function Home() {
  const { settings, featured, gallery, flags } = await getSiteData();
  const c = settings.content;
  const b = settings.business;
  const ordering = settings.commerce.ordering_enabled;
  const waReserve = whatsappLink(b, "reservation");
  return (
    <>
      <Hero headline={c.hero_headline} subhead={c.hero_subhead} image={c.hero_image_url} orderingEnabled={ordering} />

      {/* A — Brand introduction: editorial statement with photographs set into the type */}
      <section className="container-site pt-section pb-[calc(var(--spacing-section)*.6)]">
        <Reveal>
          <SectionHeading index="01" eyebrow="Welcome" title={c.intro_headline} />
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-10 max-w-6xl font-display text-[clamp(1.9rem,1.1rem+3.4vw,4.4rem)] leading-[1.08] tracking-[-.02em] text-ink text-balance">
            A coffee <span className="whitespace-nowrap">house <Pill m={MEDIA.latteArt} />,</span> a comfort-food <span className="whitespace-nowrap">kitchen <Pill m={MEDIA.nachos} /></span> and a living <span className="whitespace-nowrap">room <Pill m={MEDIA.diningRoom} /></span> for{" "}
            <em className="text-turquoise-deep">Vijay Nagar</em>
            <span className="text-pink">.</span>
          </p>
        </Reveal>
        <div className="mt-16 grid items-center gap-12 md:grid-cols-12 md:gap-10">
          <ImageReveal className="md:col-span-5">
            <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-[24px]">
              <Image src={MEDIA.storefront.src} alt={MEDIA.storefront.alt} fill sizes="(min-width:768px) 40vw, 90vw" className="object-cover" style={{ objectPosition: MEDIA.storefront.position }} />
            </div>
          </ImageReveal>
          <Reveal className="md:col-span-6 md:col-start-7" delay={0.1}>
            <p className="eyebrow flex items-center gap-3 text-pink"><span className="h-px w-8 bg-pink/60" />Find us on Scheme 113</p>
            <p className="mt-6 font-display text-[clamp(1.9rem,1.2rem+2vw,3.1rem)] leading-[1.12] tracking-[-.02em] text-ink text-balance">
              Some cafés you visit. <em className="text-turquoise-deep">This one you come back to.</em>
            </p>
            <p className="mt-6 max-w-xl text-xl leading-relaxed text-muted md:text-[1.35rem]">{c.intro_body}</p>
            <ul className="mt-9 grid max-w-xl grid-cols-3 gap-4 border-y border-ink/10 py-6">
              {[["Coffee", "made with care"], ["Comfort food", "made to share"], ["A room", "made to stay"]].map(([a, b]) => (
                <li key={a}>
                  <p className="font-display text-xl text-ink md:text-2xl">{a}</p>
                  <p className="mt-1 text-sm text-muted">{b}</p>
                </li>
              ))}
            </ul>
            <Link href="/our-story" className="btn btn-dark mt-9">Discover our story</Link>
          </Reveal>
        </div>
      </section>

      {/* B — Signature experiences */}
      <section className="bg-cream py-section">
        <div className="container-site">
          <Reveal><SectionHeading index="02" eyebrow="The experience" title={<>Made for <em>slowing down.</em></>} /></Reveal>
          <div className="mt-14"><Experiences items={EXPERIENCES} /></div>
        </div>
      </section>

      {/* C — Signature menu on the navy ground */}
      <section className="relative overflow-hidden bg-navy py-section text-ivory">
        <div className="container-site">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <Reveal><SectionHeading tone="light" index="03" eyebrow="Signature menu" title={<>Loved by <em className="text-turquoise">regulars.</em></>} /></Reveal>
            <Reveal><Link href="/menu" className="btn btn-ghost-light">Explore the full menu</Link></Reveal>
          </div>
          <div className="mt-16"><SignatureMenu products={featured.map(toPublic)} orderingEnabled={ordering} sample={flags.samplePrices} /></div>
        </div>
      </section>

      {/* D — The café experience: three matching arches on the light-blue ground */}
      <section className="relative overflow-hidden bg-turquoise-soft py-section text-ink">
        <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-turquoise/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-48 -left-40 h-[26rem] w-[26rem] rounded-full bg-blush/40 blur-3xl" />
        <div className="container-site relative">
          <div className="grid gap-8 md:grid-cols-12 md:items-end">
            <Reveal className="md:col-span-7">
              <p className="eyebrow flex items-center gap-3 text-turquoise-deep"><span className="font-display text-sm italic normal-case tracking-normal text-pink">04</span><span className="h-px w-8 bg-turquoise-deep/60" />The café</p>
              <h2 className="mt-6 text-[clamp(3rem,1.2rem+6vw,7.5rem)] leading-[.98]">Stay <em className="text-turquoise-deep">a while</em><span className="text-pink">.</span></h2>
            </Reveal>
            <Reveal className="md:col-span-4 md:col-start-9" delay={0.1}>
              <p className="text-lg leading-relaxed text-ink/75">Indoors under the navy ceiling, out front at the white wicker tables, or upstairs in the party hall — ask us about celebrations and groups.</p>
            </Reveal>
          </div>
          <div className="mt-16 md:mt-20">
            <RoomStrip frames={[
              { media: MEDIA.diningRoom, caption: "Blush velvet and green sofas" },
              { media: MEDIA.counterParty, caption: "The counter and the party hall" },
              { media: MEDIA.storefrontCup, caption: "Coffee to go, out front" },
            ]} />
          </div>
        </div>
      </section>

      {/* E — Gallery */}
      <section className="container-site py-section">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <Reveal><SectionHeading index="05" eyebrow="Gallery" title={<>Moments, <em>poured.</em></>} /></Reveal>
          <div className="flex gap-6">
            {b.instagram_url && <a href={b.instagram_url} target="_blank" rel="noopener noreferrer" className="link-underline eyebrow">Instagram ↗</a>}
            <Link href="/gallery" className="link-underline eyebrow">View the gallery →</Link>
          </div>
        </div>
        <div className="mt-14"><HomeGallery images={gallery} /></div>
      </section>

      {/* F — Visit us */}
      <section className="bg-cream py-section">
        <div className="container-site grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal>
              <SectionHeading index="06" eyebrow="Visit us" title="Find Your Way to Us." />
              <div className="mt-10 space-y-7 text-[1.02rem]">
                <div className="flex gap-4">
                  <MapPin className="mt-1 shrink-0 text-turquoise-deep" size={18} />
                  <address className="not-italic leading-relaxed">{b.address_lines.join(", ")}<br />{b.city}, {b.region} {b.postal_code}</address>
                </div>
                <div className="flex gap-4">
                  <Phone className="mt-1 shrink-0 text-turquoise-deep" size={18} />
                  <PhoneLink e164={b.phone_e164} className="link-underline">{b.phone_display}</PhoneLink>
                </div>
                <div className="border-t border-ink/10 pt-6">
                  <p className="eyebrow text-muted">Opening hours</p>
                  <Hours business={b} className="mt-4 max-w-sm text-muted" />
                </div>
              </div>
              <div className="mt-10 flex flex-wrap gap-3">
                <a href={b.maps_place_url} target="_blank" rel="noopener noreferrer" className="btn btn-dark">Get directions <ArrowUpRight size={14} /></a>
                <PhoneLink e164={b.phone_e164} className="btn btn-outline"><Phone size={14} /> Call</PhoneLink>
              </div>
            </Reveal>
          </div>
          <Reveal className="lg:col-span-7">
            <div className="overflow-hidden rounded-[24px] border border-ink/10">
              <MapEmbed query={b.maps_query} className="aspect-[4/3] lg:aspect-auto lg:h-[520px]" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* G — Final CTA */}
      <section className="relative overflow-hidden bg-turquoise py-section text-ink">
        <div className="container-site relative grid items-center gap-12 md:grid-cols-12">
          <div className="md:col-span-8">
            <Reveal>
              <p className="eyebrow">{c.reservation_headline}</p>
              <h2 className="mt-6 text-[clamp(3.2rem,1rem+8vw,9rem)] leading-[.9]">See you <em>over</em> coffee<span className="text-pink">.</span></h2>
              <p className="mt-8 max-w-xl text-lg leading-relaxed">{c.reservation_body}</p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link href="/reserve" className="btn btn-dark">Reserve a Table</Link>
                <Link href={ordering ? "/menu" : "/book-order#order"} className="btn btn-outline">Order Online</Link>
                {waReserve && (
                  <a href={waReserve} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                    <WhatsAppIcon className="h-4 w-4" /> Enquire on WhatsApp
                  </a>
                )}
              </div>
              {waReserve && <p className="mt-5 text-sm text-ink/75">WhatsApp enquiries are confirmed by our team.</p>}
            </Reveal>
          </div>
          <Reveal className="hidden md:col-span-4 md:block" delay={0.15}>
            <Mascot className="mx-auto h-auto w-[78%] max-w-[300px] drop-shadow-[0_30px_30px_rgb(14_31_61/.25)]" />
          </Reveal>
        </div>
      </section>
    </>
  );
}
