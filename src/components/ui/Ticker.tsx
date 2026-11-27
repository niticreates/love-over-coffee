"use client";
import clsx from "clsx";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

/**
 * Tilted turquoise band of words. It moves only as the page scrolls (never loops on its
 * own) and stays still under reduced motion. Decorative, so hidden from assistive tech.
 */
export function Ticker({ words, className, tone = "turquoise" }: { words: string[]; className?: string; tone?: "turquoise" | "blush" | "navy" }) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const x = useTransform(scrollY, (v) => `${-(v * 0.12) % 1200}px`);
  const row = [...words, ...words, ...words, ...words];
  return (
    <div aria-hidden className="overflow-hidden py-3">
    <div
      className={clsx(
        "relative z-10 -mx-4 -rotate-[1.2deg] overflow-hidden border-y py-3.5",
        tone === "turquoise" && "border-ink bg-turquoise text-ink",
        tone === "blush" && "border-ink bg-blush text-ink",
        tone === "navy" && "border-turquoise/40 bg-navy text-ivory",
        className,
      )}
    >
      <motion.div className="flex w-max gap-8 whitespace-nowrap font-display text-2xl italic md:text-3xl" style={reduce ? undefined : { x }}>
        {row.map((w, i) => (
          <span key={i} className="flex items-center gap-8">{w}<span className={clsx("not-italic", tone === "navy" ? "text-turquoise" : "text-pink")}>✱</span></span>
        ))}
      </motion.div>
    </div>
    </div>
  );
}
