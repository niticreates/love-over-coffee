import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { AddToCart, type PublicProduct } from "@/components/menu/AddToCart";
import { Price } from "@/components/menu/Price";
import { Reveal } from "@/components/ui/Reveal";
import { VegMark } from "@/components/ui/VegMark";
import { Mascot } from "@/components/ui/Mascot";
import { CATEGORY_MEDIA } from "@/lib/media";

const COLS: Record<number, string> = { 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" };

/**
 * Signature dishes on the navy "after hours" ground. Dishes with the café's own photograph
 * get editorial frames; the rest are set as a typographic list until they're photographed —
 * no empty placeholder tiles.
 */
export function SignatureMenu({ products, orderingEnabled, sample }: { products: PublicProduct[]; orderingEnabled: boolean; sample: boolean }) {
  const pictured = products.filter((p) => p.image_url).slice(0, 4);
  const listed = products.filter((p) => !pictured.includes(p));
  const meta = "flex items-center justify-between gap-3 text-ivory [&_.text-muted]:text-ivory/60 [&_.text-terracotta-ink]:text-turquoise [&_.btn-outline]:border-ivory/40";
  return (
    <>
      <ul className={clsx("grid gap-x-8 gap-y-14 sm:grid-cols-2", COLS[pictured.length])}>
        {pictured.map((p, i) => (
          <li key={p.id} className={clsx("h-full", pictured.length === 3 && i === 2 && "sm:col-span-2 lg:col-span-1")}>
            <Reveal className="h-full" delay={(i % 2) * 0.1}>
              <article className="group flex h-full flex-col">
                <Link href={`/menu/${p.slug}`} tabIndex={-1} aria-hidden className={clsx("relative block aspect-[4/5] overflow-hidden rounded-b-[24px] rounded-t-[999px] bg-ink", pictured.length === 3 && i === 2 && "sm:aspect-[16/9] lg:aspect-[4/5]")}>
                  <Image src={p.image_url!} alt="" fill sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 90vw" className="object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.05]" />
                </Link>
                <div className="mt-6 flex-1">
                  <p className="font-display text-sm italic text-turquoise">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-1 flex items-center gap-2 text-[clamp(1.7rem,1.3rem+1vw,2.3rem)] leading-tight text-ivory">
                    <Link href={`/menu/${p.slug}`} className="link-underline">{p.name}</Link>
                    <VegMark veg={p.is_veg} />
                  </h3>
                  {p.description && <p className="mt-2 max-w-sm text-sm leading-relaxed text-ivory/65">{p.description}</p>}
                </div>
                <div className={clsx("mt-4 border-t border-ivory/15 pt-4", meta)}>
                  <Price value={p.price} sample={sample} className="font-semibold" />
                  <AddToCart product={p} orderingEnabled={orderingEnabled} />
                </div>
              </article>
            </Reveal>
          </li>
        ))}
      </ul>
      {listed.length > 0 && (
        <Reveal className="mt-24">
          <p className="eyebrow text-turquoise">Also on the regulars&apos; list</p>
          <ul className="mt-6 grid gap-x-14 border-t border-ivory/15 md:grid-cols-2">
            {listed.map((p, i) => (
              <li key={p.id} className="group border-b border-ivory/15 py-5">
                <div className="flex items-start gap-5">
                  <Thumb categoryId={p.category_id} />
                  <span className="mt-2 font-display text-sm italic text-ivory/45">{String(pictured.length + i + 1).padStart(2, "0")}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="flex items-center gap-2 text-2xl text-ivory transition-colors group-hover:text-turquoise md:text-[1.75rem]">
                      <Link href={`/menu/${p.slug}`}>{p.name}</Link>
                      <VegMark veg={p.is_veg} />
                    </h3>
                    {p.description && <p className="mt-1 text-sm text-ivory/60">{p.description}</p>}
                    <div className={clsx("mt-3", meta)}>
                      <Price value={p.price} sample={sample} className="text-sm font-semibold" />
                      <AddToCart product={p} orderingEnabled={orderingEnabled} />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      )}
    </>
  );
}

/** The café's own photograph of the dish's category; a mascot tile where there isn't one yet. */
function Thumb({ categoryId }: { categoryId: string }) {
  const m = CATEGORY_MEDIA[categoryId];
  return (
    <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-full bg-turquoise/15 ring-1 ring-ivory/15 sm:w-24" aria-hidden>
      {m ? (
        <Image src={m.src} alt="" fill sizes="96px" className="object-cover transition-transform duration-700 group-hover:scale-110" style={{ objectPosition: m.position }} />
      ) : (
        <span className="grid h-full place-items-center"><Mascot className="w-[46%]" title={null} /></span>
      )}
    </div>
  );
}
