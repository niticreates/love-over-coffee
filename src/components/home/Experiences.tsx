"use client";
import clsx from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import type { Media } from "@/lib/media";

export interface Experience { title: string; body: string; media: Media }

/**
 * Editorial index: big numbered titles on the left; the photograph for the hovered/focused
 * row cross-fades in a sticky frame on the right. On mobile each row carries its own photo.
 */
export function Experiences({ items }: { items: Experience[] }) {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const cur = items[active];
  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <ol className="lg:col-span-7">
        {items.map((e, i) => (
          <li key={e.title} className="border-t border-ink/15 last:border-b">
            <button
              type="button"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              aria-pressed={active === i}
              className="group grid w-full grid-cols-[auto_1fr] items-baseline gap-x-5 py-7 text-left md:gap-x-8 md:py-9"
            >
              <span className={clsx("font-display text-base italic transition-colors", active === i ? "text-pink" : "text-pink lg:text-muted")}>{String(i + 1).padStart(2, "0")}</span>
              <span>
                <span className={clsx("block font-display text-[clamp(2rem,1.2rem+3vw,3.75rem)] leading-none transition-[color,transform] duration-500", active === i ? "text-ink lg:translate-x-2" : "text-ink lg:text-ink/40 lg:group-hover:text-ink/80")}>
                  {e.title}
                </span>
                <span className={clsx("mt-3 block max-w-md leading-relaxed text-muted transition-opacity duration-500 lg:opacity-0", active === i && "lg:opacity-100")}>{e.body}</span>
              </span>
            </button>
            <div className="relative mb-7 aspect-[4/3] overflow-hidden rounded-[20px] lg:hidden">
              <Image src={e.media.src} alt={e.media.alt} fill sizes="90vw" className="object-cover" style={{ objectPosition: e.media.position }} />
            </div>
          </li>
        ))}
      </ol>
      <div className="hidden lg:col-span-5 lg:block">
        <div className="sticky top-28 aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-[28px] bg-navy">
          <AnimatePresence initial={false}>
            <motion.div
              key={cur.media.src}
              className="absolute inset-0"
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image src={cur.media.src} alt={cur.media.alt} fill sizes="40vw" className="object-cover" style={{ objectPosition: cur.media.position }} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
