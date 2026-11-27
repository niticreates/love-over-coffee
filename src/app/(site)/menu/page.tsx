import Link from "next/link";
import { MenuBrowser } from "@/components/menu/MenuBrowser";
import { ClosingCTA } from "@/components/ui/ClosingCTA";
import { PageHero } from "@/components/ui/PageHero";
import { Ticker } from "@/components/ui/Ticker";
import { MEDIA } from "@/lib/media";
import { toPublic } from "@/lib/public";
import { breadcrumbJsonLd, JsonLd, pageMeta, SITE_URL } from "@/lib/seo";
import { getSiteData } from "@/lib/site";

export const revalidate = 60;
export const metadata = pageMeta("Menu — Coffee, Frappes, Pasta & Desserts", "Browse the Love Over Coffee menu: coffee, frappes and shakes, nachos, garlic bread, pasta and desserts in Vijay Nagar, Indore. Order online for pickup.", "/menu");

export default async function MenuPage() {
  const { categories, products, settings, flags, platforms } = await getSiteData();
  const partners = platforms.filter((p) => p.platform_type === "ordering");
  const c = settings.commerce;
  const withItems = categories.filter((cat) => products.some((p) => p.category_id === cat.id));
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([["Menu", "/menu"]])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Menu",
          "@id": `${SITE_URL}/menu#menu`,
          name: "Love Over Coffee menu — Vijay Nagar, Indore",
          url: `${SITE_URL}/menu`,
          inLanguage: "en-IN",
          hasMenuSection: withItems.map((cat) => ({
            "@type": "MenuSection",
            name: cat.name,
            hasMenuItem: products
              .filter((p) => p.category_id === cat.id)
              .map((p) => ({
                "@type": "MenuItem",
                name: p.name,
                url: `${SITE_URL}/menu/${p.slug}`,
                ...(p.description ? { description: p.description } : {}),
                // Prices only once the café has confirmed them — never sample prices.
                ...(p.price != null && !flags.samplePrices ? { offers: { "@type": "Offer", price: (p.price / 100).toFixed(2), priceCurrency: "INR" } } : {}),
              })),
          })),
        }}
      />
      <PageHero
        eyebrow="The menu"
        title={<>Coffee, comfort <em className="text-turquoise-deep">&amp; everything after</em><span className="text-pink">.</span></>}
        media={MEDIA.coldCoffees}
        accent={MEDIA.nachos}
        intro={<p>{c.ordering_enabled ? (c.delivery_enabled ? "Order online for pickup or delivery." : "Order online for pickup from the café.") : "Online ordering opens soon — call us to order in the meantime."}</p>}
      >
        <div className="space-y-2 text-sm leading-relaxed text-muted">
          {partners.length > 0 && (
            <p>
              {c.ordering_enabled ? "Delivery also on " : "Order now on "}
              {partners.map((p, i) => (
                <span key={p.id}>{i > 0 && (i === partners.length - 1 ? " or " : ", ")}<a href={p.platform_url!} target="_blank" rel="noopener noreferrer" className="link-underline font-semibold text-ink">{p.platform_name}</a></span>
              ))}
              . <Link href="/book-order#order" className="link-underline">All options</Link>
            </p>
          )}
          {flags.samplePrices ? <p className="text-terracotta-ink">Preview: prices marked “Sample” are placeholders, not the café’s real prices.</p> : <p>Taxes are added at checkout. Items marked “Price on request” are being updated.</p>}
        </div>
      </PageHero>
      <Ticker words={withItems.map((cat) => cat.name)} />
      <div className="container-site pt-10 pb-section">
        <MenuBrowser categories={categories} products={products.map(toPublic)} orderingEnabled={c.ordering_enabled} sample={flags.samplePrices} />
      </div>
      <ClosingCTA eyebrow="Hungry already?" title={<>Pull up a <em>chair</em><span className="text-pink">.</span></>} body={<p>Eat in under the navy ceiling, or order ahead and collect.</p>} />
    </>
  );
}
