import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { VegMark } from "@/components/ui/VegMark";
import { toneForCategory } from "@/lib/tones";
import { AddToCart, type PublicProduct } from "./AddToCart";
import { Price } from "./Price";

export function ProductRow({ product: p, orderingEnabled, sample }: { product: PublicProduct; orderingEnabled: boolean; sample: boolean }) {
  return (
    <li className={`group flex gap-5 border-b border-oat py-6 ${p.is_available ? "" : "opacity-60"}`}>
      {p.image_url && <Link href={`/menu/${p.slug}`} className="w-24 shrink-0 sm:w-28" tabIndex={-1} aria-hidden>
        <div className="overflow-hidden rounded-[18px]">
          <div className="transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.06]">
            <Photo src={p.image_url} alt={p.name} label=" " tone={toneForCategory(p.category_id)} className="aspect-square rounded-[18px]" sizes="112px" />
          </div>
        </div>
      </Link>}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-4">
          <h3 className="flex items-center gap-2 font-display text-[1.6rem] leading-tight transition-colors group-hover:text-turquoise-deep">
            <Link href={`/menu/${p.slug}`} className="link-underline">{p.name}</Link>
            <VegMark veg={p.is_veg} />
          </h3>
          <Price value={p.price} sample={sample} className="shrink-0 pt-1 text-sm font-semibold" />
        </div>
        {p.description && <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.description}</p>}
        <div className="mt-auto flex justify-end pt-3">
          <AddToCart product={p} orderingEnabled={orderingEnabled} />
        </div>
      </div>
    </li>
  );
}
