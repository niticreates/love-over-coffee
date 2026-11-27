import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { AddToCart, type PublicProduct } from "@/components/menu/AddToCart";
import { Price } from "@/components/menu/Price";
import { Reveal } from "@/components/ui/Reveal";
import { VegMark } from "@/components/ui/VegMark";

const LAYOUT = ["lg:col-span-7", "lg:col-span-5 lg:mt-24", "lg:col-span-5 lg:col-start-2", "lg:col-span-5 lg:col-start-8 lg:-mt-16"];

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
      <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-12">
        {pictured.map((p, i) => (
          <li key={p.id} className={LAYOUT[i]}>
            <Reveal delay={(i % 2) * 0.1}>
              <article className="group">
                <Link href={`/menu/${p.slug}`} tabIndex={-1} aria-hidden className={clsx("relative block overflow-hidden rounded-[24px] bg-ink", i === 0 ? "aspect-[5/4]" : "aspect-[4/5]", i === 0 && "rounded-tl-[999px]")}>
                  <Image src={p.image_url!} alt="" fill sizes="(min-width:1024px) 45vw, (min-width:640px) 45vw, 90vw" className="object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.05]" />
                </Link>
                <div className="mt-5">
                  <p className="font-display text-sm italic text-turquoise">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-1 flex items-center gap-2 text-[clamp(1.7rem,1.2rem+1.4vw,2.5rem)] leading-tight text-ivory">
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
                <div className="flex items-baseline gap-4">
                  <span className="font-display text-sm italic text-ivory/45">{String(pictured.length + i + 1).padStart(2, "0")}</span>
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
