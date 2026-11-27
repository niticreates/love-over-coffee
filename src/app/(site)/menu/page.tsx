import Link from "next/link";
import Image from "next/image";
import { MenuBrowser } from "@/components/menu/MenuBrowser";
import { pageMeta } from "@/lib/seo";
import { toPublic } from "@/lib/public";
import { getSiteData } from "@/lib/site";
import { MEDIA } from "@/lib/media";

export const revalidate = 60;
export const metadata = pageMeta("Menu — Coffee, Frappes, Pasta & Desserts", "Browse the Love Over Coffee menu: coffee, frappes and shakes, nachos, garlic bread, pasta and desserts in Vijay Nagar, Indore. Order online for pickup.", "/menu");

export default async function MenuPage() {
  const { categories, products, settings, flags, platforms } = await getSiteData();
  const partners = platforms.filter((p) => p.platform_type === "ordering");
  const c = settings.commerce;
  return (
    <div className="container-site pt-32 pb-section md:pt-40">
      <header className="grid gap-10 md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <p className="eyebrow text-terracotta-ink">The menu</p>
          <h1 className="mt-5 text-display-lg">Coffee, comfort <em className="text-turquoise-deep">&amp; everything after<span className="text-pink">.</span></em></h1>
          <div className="mt-10 flex items-end gap-3" aria-hidden>
            {[MEDIA.latteArt, MEDIA.nachos, MEDIA.coldCoffees, MEDIA.pizza].map((m, i) => (
              <div key={m.src} className={`relative shrink-0 overflow-hidden ${i === 3 ? "hidden sm:block " : ""}${i % 2 ? "h-24 w-24 rounded-full md:h-28 md:w-28" : "h-32 w-24 rounded-t-full rounded-b-[18px] md:h-40 md:w-28"}`}>
                <Image src={m.src} alt="" fill sizes="112px" className="object-cover" style={{ objectPosition: m.position }} />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3 text-sm leading-relaxed text-muted md:col-span-4 md:col-start-9">
          <p>{c.ordering_enabled ? (c.delivery_enabled ? "Order online for pickup or delivery." : "Order online for pickup from the café.") : "Online ordering opens soon — call us to order in the meantime."}</p>
          {partners.length > 0 && (
            <p>
              {c.ordering_enabled ? "Delivery also on " : "Order now on "}
              {partners.map((p, i) => (
                <span key={p.id}>{i > 0 && (i === partners.length - 1 ? " or " : ", ")}<a href={p.platform_url!} target="_blank" rel="noopener noreferrer" className="link-underline text-espresso">{p.platform_name}</a></span>
              ))}
              . <Link href="/book-order#order" className="link-underline">All options</Link>
            </p>
          )}
          {flags.samplePrices ? <p className="text-terracotta-ink">Preview: prices marked “Sample” are placeholders, not the café’s real prices.</p> : <p>Taxes are added at checkout. Items marked “Price on request” are being updated.</p>}
        </div>
      </header>
      <div className="mt-12">
        <MenuBrowser categories={categories} products={products.map(toPublic)} orderingEnabled={c.ordering_enabled} sample={flags.samplePrices} />
      </div>
    </div>
  );
}
