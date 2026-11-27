"use client";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";

export function Hero({ headline, subhead, image }: { headline: string; subhead: string; image: string | null }) {
  const reduce = useReducedMotion();
  const rise = (d: number) => (reduce ? {} : { initial: { opacity: 0, y: 28 }, animate: { opacity: 1, y: 0 }, transition: { duration: 1.1, delay: d, ease: [0.22, 1, 0.36, 1] as const } });
  const words = headline.split(/(?<=\.)\s+/);
  return (
    <section className="relative isolate flex min-h-[100svh] items-end overflow-hidden bg-charcoal text-ivory">
      {image ? (
        <motion.div className="absolute inset-0 -z-10" {...(reduce ? {} : { initial: { scale: 1.08 }, animate: { scale: 1 }, transition: { duration: 2.4, ease: [0.22, 1, 0.36, 1] } })}>
          <Image src={image} alt="Inside Love Over Coffee, Vijay Nagar" fill priority sizes="100vw" className="object-cover" />
        </motion.div>
      ) : (
        <div className="grain absolute inset-0 -z-10" aria-hidden>
          <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_75%_20%,#79543d_0%,#3a3530_45%,#29343a_100%)]" />
          {/* Architectural arches — a quiet nod to café windows; replaced by the hero photograph once supplied. */}
          <svg className="absolute right-[-10%] top-[8%] h-[85%] opacity-[.14] md:right-[4%]" viewBox="0 0 400 520" fill="none" stroke="#F2EBDD" strokeWidth="1">
            <path d="M20 520V200a180 180 0 0 1 360 0v320" />
            <path d="M60 520V210a140 140 0 0 1 280 0v310" />
            <path d="M100 520V220a100 100 0 0 1 200 0v300" />
          </svg>
        </div>
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-espresso/85 via-espresso/30 to-espresso/10" />
      <div className="container-site pb-28 pt-40 md:pb-24">
        <motion.p className="eyebrow text-sage" {...rise(0.1)}>Vijay Nagar · Indore</motion.p>
        <h1 className="mt-6 max-w-5xl text-display-lg">
          {words.map((w, i) => (
            <motion.span key={w} className={`block ${i === 1 ? "italic text-[#e9d9c3]" : ""}`} {...rise(0.25 + i * 0.15)}>{w}</motion.span>
          ))}
        </h1>
        <motion.p className="mt-8 max-w-xl text-lg leading-relaxed text-ivory/80" {...rise(0.6)}>{subhead}</motion.p>
        <motion.div className="mt-10 flex flex-col gap-3 sm:flex-row" {...rise(0.75)}>
          <Link href="/menu" className="btn btn-primary">Order Online</Link>
          <Link href="/reserve" className="btn btn-ghost-light">Reserve a Table</Link>
        </motion.div>
      </div>
      <div className="pointer-events-none absolute bottom-8 right-[var(--spacing-gutter)] hidden items-center gap-3 text-[10px] tracking-[.3em] uppercase text-ivory/60 md:flex">
        <span className="h-10 w-px bg-ivory/40" /> Scroll
      </div>
    </section>
  );
}
