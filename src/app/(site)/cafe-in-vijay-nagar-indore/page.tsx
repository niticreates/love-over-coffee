import { ArrowUpRight, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ClosingCTA } from "@/components/ui/ClosingCTA";
import { PageHero } from "@/components/ui/PageHero";
import { ImageReveal, Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Ticker } from "@/components/ui/Ticker";
import { WhatsAppIcon } from "@/components/ui/icons";
import { MEDIA, type Media } from "@/lib/media";
import { breadcrumbJsonLd, JsonLd, pageMeta } from "@/lib/seo";
import { getSiteData } from "@/lib/site";
import { whatsappLink } from "@/lib/whatsapp";
import { PhoneLink } from "@/components/ui/PhoneLink";

export const revalidate = 300;
export const metadata = pageMeta(
  "Café in Vijay Nagar, Indore | Love Over Coffee, Scheme 113",
  "Looking for a café in Vijay Nagar, Indore? Love Over Coffee, Scheme 113 serves cold coffee, frappes, nachos and pasta — for dates, friends and birthdays.",
  "/cafe-in-vijay-nagar-indore",
);

/**
 * Local landing page for "café in Vijay Nagar, Indore" and its close variants.
 * Every statement here repeats something the rest of the site already says; nothing new is claimed.
 */
export default async function CafeInVijayNagarPage() {
  const { settings, categories, products, featured, platforms } = await getSiteData();
  const b = settings.business;
  const address = `${b.address_lines.join(", ")}, ${b.city}, ${b.region} ${b.postal_code}`;
  const waGroup = whatsappLink(b, "group");
  const waReserve = whatsappLink(b, "reservation");
  const delivery = platforms.filter((p) => p.platform_type === "ordering" && p.platform_url);
  const cats = categories.filter((c) => products.some((p) => p.category_id === c.id));
  const mapsLink = platforms.find((p) => p.platform_type === "location")?.platform_url ?? b.maps_place_url;

  const reasons: { title: string; body: string; media: Media; href: string; cta: string }[] = [
    { title: "Coffee & cold coffee", body: "Cappuccinos with latte art, cold coffees and Biscoff, tiramisu and dark-chocolate frappes.", media: MEDIA.coldCoffees, href: "/menu#cold-coffee", cta: "See the coffee menu" },
    { title: "Comfort food to share", body: "Loaded nachos, masala pull-apart garlic bread, penne in rich sauces and desserts.", media: MEDIA.nachos, href: "/menu", cta: "Browse the full menu" },
    { title: "Coffee dates & catch-ups", body: "A navy ceiling, blush velvet chairs and green sofas — a room made for long conversations with friends or a date.", media: MEDIA.diningRoom, href: "/reserve", cta: "Reserve a table" },
    { title: "Birthdays & small celebrations", body: "Upstairs is the party hall. Message the café to ask about dates, group size and arrangements.", media: MEDIA.counterParty, href: waGroup ?? "/contact", cta: "Ask about a celebration" },
  ];

  const faqs = [
    { q: "Where is Love Over Coffee in Vijay Nagar, Indore?", a: `At ${address}. It is the Love Over Coffee café on Scheme 113 in Vijay Nagar.${b.phone_display ? ` Call ${b.phone_display} if you need directions.` : ""}` },
    { q: "What can I order at this café in Vijay Nagar?", a: `The menu covers ${cats.map((c) => c.name.toLowerCase()).join(", ")}. Each dish has its own page on the menu.` },
    { q: "Is it a good café in Vijay Nagar for a coffee date or friends?", a: "The dining room has sofas, velvet chairs, books and board games, and tables are made for lingering. You can reserve a table in advance." },
    { q: "Can I celebrate a birthday at Love Over Coffee, Vijay Nagar?", a: "There is a party hall upstairs. Message the café on WhatsApp or call to ask about availability and arrangements for your group." },
    ...(delivery.length ? [{ q: "Does Love Over Coffee Vijay Nagar deliver in Indore?", a: `Delivery is available through ${delivery.map((p) => p.platform_name).join(" and ")}. You can also order on this website for pickup.` }] : []),
    { q: "What are the opening hours?", a: b.hours_verification === "verified" ? "See the contact page for today's hours." : b.phone_display ? `Please call ${b.phone_display} to check today's hours before you visit.` : "Hours shown on this demo are samples." },
    { q: "Is this the same as other Love Over Coffee outlets?", a: "Love Over Coffee has outlets in several cities and areas. This website is for the café at Plot No. 11, Scheme 113, Vijay Nagar, Indore; menus, prices and hours at other outlets may differ." },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([["Café in Vijay Nagar, Indore", "/cafe-in-vijay-nagar-indore"]])} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />
      <PageHero
        eyebrow="Café in Vijay Nagar, Indore"
        title={<>Your café in Vijay Nagar, <em className="text-turquoise-deep">Indore</em><span className="text-pink">.</span></>}
        media={MEDIA.storefront}
        accent={MEDIA.latteArt}
        intro={<p>Love Over Coffee is on Scheme 113 in Vijay Nagar — for cold coffee and frappes, comfort food, coffee dates, catch-ups and small celebrations.</p>}
      >
        <div className="flex flex-wrap gap-3">
          <Link href="/reserve" className="btn btn-primary">Reserve a table</Link>
          <Link href="/menu" className="btn btn-outline">See the menu</Link>
        </div>
      </PageHero>
      <Ticker words={["Cold coffee", "Frappes", "Nachos", "Garlic bread", "Pasta", "Coffee dates", "Birthdays"]} />

      {/* Why people come */}
      <section className="container-site py-section">
        <Reveal><SectionHeading index="01" eyebrow="Why Vijay Nagar comes here" title={<>Four good reasons <em className="text-turquoise-deep">to pull up a chair.</em></>} /></Reveal>
        <ul className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map((r, i) => {
            const external = r.href.startsWith("http");
            return (
              <li key={r.title} data-aos="fade-up" data-aos-delay={String(i * 90)} className="group flex flex-col">
                <ImageReveal>
                  <div className="relative aspect-[3/4] overflow-hidden rounded-b-[24px] rounded-t-[999px] bg-navy">
                    <Image src={r.media.src} alt={r.media.alt} fill sizes="(min-width:1024px) 22vw, (min-width:640px) 45vw, 90vw" className="object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.05]" style={{ objectPosition: r.media.position }} />
                  </div>
                </ImageReveal>
                <h2 className="mt-6 text-2xl text-ink">{r.title}</h2>
                <p className="mt-2 flex-1 leading-relaxed text-muted">{r.body}</p>
                {external ? (
                  <a href={r.href} target="_blank" rel="noopener noreferrer" className="link-underline mt-4 inline-flex items-center gap-1.5 self-start font-semibold text-turquoise-deep">{r.cta} <ArrowUpRight size={15} /></a>
                ) : (
                  <Link href={r.href} className="link-underline mt-4 inline-flex items-center gap-1.5 self-start font-semibold text-turquoise-deep">{r.cta} <ArrowUpRight size={15} /></Link>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Popular dishes */}
      <section className="bg-turquoise-soft py-section">
        <div className="container-site">
          <Reveal><SectionHeading index="02" eyebrow="Popular on the menu" title={<>What to order <em className="text-turquoise-deep">first.</em></>} /></Reveal>
          <ul className="mt-12 grid gap-x-10 border-t border-ink/10 sm:grid-cols-2 lg:grid-cols-3">
            {featured.slice(0, 9).map((p, i) => (
              <li key={p.id} data-aos="fade-up" data-aos-delay={String((i % 3) * 80)} className="border-b border-ink/10">
                <Link href={`/menu/${p.slug}`} className="group flex items-baseline justify-between gap-4 py-5">
                  <span>
                    <span className="block font-display text-2xl text-ink transition-colors group-hover:text-turquoise-deep">{p.name}</span>
                    {p.description && <span className="mt-1 block text-sm text-muted">{p.description}</span>}
                  </span>
                  <ArrowUpRight size={18} className="shrink-0 text-turquoise-deep transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Find us */}
      <section className="container-site py-section">
        <div className="grid items-center gap-12 md:grid-cols-12">
          <Reveal className="md:col-span-6">
            <SectionHeading index="03" eyebrow="Find us" title={<>On Scheme 113, <em className="text-turquoise-deep">Vijay Nagar.</em></>} />
            <address className="mt-8 flex gap-3 text-lg not-italic leading-relaxed text-ink"><MapPin className="mt-1 shrink-0 text-turquoise-deep" size={20} aria-hidden />{address}</address>
            <PhoneLink e164={b.phone_e164} className="mt-4 flex items-center gap-3 text-lg text-ink"><Phone className="text-turquoise-deep" size={20} aria-hidden />{b.phone_display}</PhoneLink>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="btn btn-dark">Get directions <ArrowUpRight size={16} /></a>
              {waReserve && <a href={waReserve} target="_blank" rel="noopener noreferrer" className="btn btn-outline"><WhatsAppIcon className="h-4 w-4" /> WhatsApp us</a>}
            </div>
          </Reveal>
          <ImageReveal className="md:col-span-5 md:col-start-8">
            <div className="relative aspect-[4/5] overflow-hidden rounded-b-[24px] rounded-t-[999px]">
              <Image src={MEDIA.storefrontCup.src} alt={MEDIA.storefrontCup.alt} fill sizes="(min-width:768px) 40vw, 90vw" className="object-cover" style={{ objectPosition: MEDIA.storefrontCup.position }} />
            </div>
          </ImageReveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-cream py-section">
        <div className="container-site">
          <Reveal><SectionHeading index="04" eyebrow="Questions" title={<>Before you <em className="text-turquoise-deep">visit.</em></>} /></Reveal>
          <div className="mt-10 max-w-4xl divide-y divide-oat border-y border-oat">
            {faqs.map((f, i) => (
              <details key={f.q} data-aos="fade-up" data-aos-delay={String(i * 60)} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-2xl text-ink">
                  {f.q}
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-turquoise text-ink transition-transform duration-300 group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <p className="mt-3 max-w-prose leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <ClosingCTA eyebrow="See you in Vijay Nagar" title={<>Come for a cup, <em>stay a while</em><span className="text-pink">.</span></>} />
    </>
  );
}
