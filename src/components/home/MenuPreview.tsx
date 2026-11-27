"use client";
import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import { Price } from "@/components/menu/Price";
import { VegMark } from "@/components/ui/VegMark";
import type { PublicProduct } from "@/components/menu/AddToCart";
import type { Category } from "@/lib/types";

export function MenuPreview({ categories, products, sample }: { categories: Category[]; products: PublicProduct[]; sample: boolean }) {
  const withItems = categories.filter((c) => products.some((p) => p.category_id === c.id));
  const [active, setActive] = useState(withItems[0]?.id);
  const items = products.filter((p) => p.category_id === active).slice(0, 6);
  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div role="tablist" aria-label="Menu categories" className="-mx-[var(--spacing-gutter)] flex gap-2 overflow-x-auto px-[var(--spacing-gutter)] pb-2 lg:col-span-4 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0">
        {withItems.map((c) => (
          <button
            key={c.id} role="tab" aria-selected={active === c.id} aria-controls="menu-preview-panel" onClick={() => setActive(c.id)}
            className={clsx(
              "shrink-0 whitespace-nowrap border px-4 py-2.5 text-sm transition-colors lg:border-0 lg:border-b lg:border-oat lg:px-0 lg:py-4 lg:text-left lg:font-display lg:text-3xl",
              active === c.id ? "border-espresso bg-espresso text-ivory lg:bg-transparent lg:text-espresso lg:italic" : "border-oat text-muted hover:text-espresso",
            )}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div id="menu-preview-panel" role="tabpanel" className="lg:col-span-8">
        <ul className="divide-y divide-oat border-y border-oat">
          {items.map((p) => (
            <li key={p.id}>
              <Link href={`/menu/${p.slug}`} className="group flex items-baseline gap-4 py-5">
                <span className="flex items-center gap-2 font-display text-2xl group-hover:italic">{p.name} <VegMark veg={p.is_veg} /></span>
                <span className="mb-1 flex-1 border-b border-dotted border-walnut/30" aria-hidden />
                <Price value={p.price} sample={sample} className="text-sm font-semibold" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
