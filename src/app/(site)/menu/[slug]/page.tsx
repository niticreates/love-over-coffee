import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/menu/AddToCart";
import { Price } from "@/components/menu/Price";
import { ProductCard } from "@/components/menu/ProductCard";
import { Photo } from "@/components/ui/Photo";
import { VegMark } from "@/components/ui/VegMark";
import { JsonLd, pageMeta, SITE_URL } from "@/lib/seo";
import { toPublic } from "@/lib/public";
import { getSiteData } from "@/lib/site";
import { toneForCategory } from "@/lib/tones";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { products } = await getSiteData();
  const p = products.find((x) => x.slug === slug);
  if (!p) return {};
  return pageMeta(p.name, `${p.description ?? p.name} — at Love Over Coffee, Vijay Nagar, Indore.`, `/menu/${p.slug}`);
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { products, categories, settings, flags } = await getSiteData();
  const p = products.find((x) => x.slug === slug);
  if (!p) notFound();
  const cat = categories.find((c) => c.id === p.category_id);
  const recommended = [
    ...products.filter((x) => x.category_id === p.category_id && x.id !== p.id),
    ...products.filter((x) => x.is_featured && x.category_id !== p.category_id),
  ].slice(0, 4);
  const ld: Record<string, unknown> = { "@context": "https://schema.org", "@type": "MenuItem", name: p.name, description: p.description, url: `${SITE_URL}/menu/${p.slug}` };
  if (p.price != null && !flags.samplePrices) ld.offers = { "@type": "Offer", price: (p.price / 100).toFixed(2), priceCurrency: "INR" };
  return (
    <div className="container-site pt-28 pb-section md:pt-36">
      <nav aria-label="Breadcrumb" className="eyebrow text-muted">
        <Link href="/menu" className="link-underline">Menu</Link> <span className="mx-2">/</span>
        {cat && <><Link href={`/menu#${cat.slug}`} className="link-underline">{cat.name}</Link> <span className="mx-2">/</span></>}
        <span aria-current="page" className="text-espresso">{p.name}</span>
      </nav>
      <div className="mt-10 grid gap-12 md:grid-cols-12">
        <Photo src={p.image_url} alt={p.image_alt ?? p.name} label={p.name} tone={toneForCategory(p.category_id)} priority shape="arch" className="aspect-[4/5] md:col-span-6" sizes="(min-width:768px) 50vw, 100vw" />
        <div className="md:col-span-5 md:col-start-8 md:self-center">
          <p className="eyebrow text-terracotta-ink">{cat?.name}</p>
          <h1 className="mt-4 flex items-center gap-3 text-display-md">{p.name} <VegMark veg={p.is_veg} /></h1>
          {p.description && <p className="mt-6 text-lg leading-relaxed text-muted">{p.description}</p>}
          <div className="mt-8 flex items-center justify-between border-y border-oat py-5">
            <Price value={p.price} sample={flags.samplePrices} className="font-display text-3xl" />
            {!p.is_available && <span className="eyebrow text-danger">Unavailable today</span>}
          </div>
          <AddToCart product={toPublic(p)} orderingEnabled={settings.commerce.ordering_enabled} variant="full" className="mt-8 w-full" />
        </div>
      </div>
      {recommended.length > 0 && (
        <section className="mt-section">
          <h2 className="text-display-sm">You might also like</h2>
          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
            {recommended.map((r) => <ProductCard key={r.id} product={toPublic(r)} orderingEnabled={settings.commerce.ordering_enabled} sample={flags.samplePrices} />)}
          </div>
        </section>
      )}
      <JsonLd data={ld} />
    </div>
  );
}
