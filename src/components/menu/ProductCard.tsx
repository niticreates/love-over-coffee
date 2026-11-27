import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { VegMark } from "@/components/ui/VegMark";
import { toneForCategory } from "@/lib/tones";
import { AddToCart, type PublicProduct } from "./AddToCart";
import { Price } from "./Price";

export function ProductCard({ product, orderingEnabled, sample, index }: { product: PublicProduct; orderingEnabled: boolean; sample?: boolean; index?: number }) {
  return (
    <article className="group flex flex-col">
      <Link href={`/menu/${product.slug}`} className="block overflow-hidden" aria-label={product.name} tabIndex={-1}>
        <div className="transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.03]">
          <Photo src={product.image_url} alt={product.name} label={product.name} tone={toneForCategory(product.category_id)} className="aspect-[4/5]" sizes="(min-width:1024px) 25vw, (min-width:640px) 45vw, 90vw" />
        </div>
      </Link>
      <div className="mt-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {index != null && <p className="font-display text-sm italic text-terracotta-ink">{String(index + 1).padStart(2, "0")}</p>}
          <h3 className="mt-1 flex items-center gap-2 text-[1.65rem] leading-tight">
            <Link href={`/menu/${product.slug}`} className="link-underline">{product.name}</Link>
            <VegMark veg={product.is_veg} />
          </h3>
        </div>
      </div>
      {product.description && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{product.description}</p>}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-oat pt-4">
        <Price value={product.price} sample={sample} className="font-semibold" />
        <AddToCart product={product} orderingEnabled={orderingEnabled} />
      </div>
    </article>
  );
}
