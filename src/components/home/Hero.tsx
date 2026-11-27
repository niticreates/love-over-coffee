"use client";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { Mascot } from "@/components/ui/Mascot";
import { MEDIA } from "@/lib/media";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Splits "Good Coffee. Great Company. A Little More Love." into lines; the last word of the last line is accented. */
function lines(headline: string) {
  return headline.split(/(?<=\.)\s+/).filter(Boolean);
}

export function Hero({ headline, subhead, image, orderingEnabled }: { headline: string; subhead: string; image: string | null; orderingEnabled: boolean }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const ringRotate = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const cupY = useTransform(scrollYProgress, [0, 1], ["0%", "-40%"]);
  const ls = lines(headline);
  const main = image ? { ...MEDIA.counterBooks, src: image } : MEDIA.counterBooks;

  const line = (i: number) =>
    reduce ? {} : { initial: { y: "105%" }, animate: { y: "0%" }, transition: { duration: 1, delay: 0.15 + i * 0.12, ease: EASE } };
  const fade = (d: number) => (reduce ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, delay: d, ease: EASE } });

  return (
    <section ref={ref} className="relative overflow-hidden bg-ivory pt-28 md:pt-32 lg:min-h-[100svh] lg:pt-0">
      <div className="container-site grid gap-10 lg:min-h-[calc(100svh-6rem)] lg:grid-cols-12 lg:items-center lg:gap-6">
        {/* Copy */}
        <div className="relative z-10 lg:col-span-6 lg:pt-28 lg:pb-10">
          <motion.p className="eyebrow flex items-center gap-3 text-turquoise-deep" {...fade(0.05)}>
            <span className="h-px w-8 bg-turquoise-deep/60" /> Café in Vijay Nagar · Indore
          </motion.p>
          <h1 className="mt-6 text-[clamp(2.9rem,1.1rem+5.4vw,6.4rem)] text-ink lg:text-[clamp(3.2rem,0.4rem+4.3vw,5.9rem)]">
            {ls.map((l, i) => {
              const last = i === ls.length - 1;
              const words = l.replace(/\.$/, "").split(" ");
              return (
                <span key={l} className="block overflow-hidden pb-[.22em] -mb-[.18em] lg:whitespace-nowrap">
                  <motion.span className="block" {...line(i)}>
                    {last ? (
                      <>
                        {words.slice(0, -1).join(" ")} <em className="text-turquoise-deep">{words.at(-1)}</em>
                        <span className="text-pink">.</span>
                      </>
                    ) : (
                      l
                    )}
                  </motion.span>
                </span>
              );
            })}
          </h1>
          <motion.p className="mt-8 max-w-md text-lg leading-relaxed text-muted md:text-xl" {...fade(0.65)}>{subhead}</motion.p>
          <motion.div className="mt-10 flex flex-col gap-3 sm:flex-row" {...fade(0.8)}>
            <Link href={orderingEnabled ? "/menu" : "/book-order#order"} className="btn btn-primary">Order Online</Link>
            <Link href="/reserve" className="btn btn-outline">Reserve a Table</Link>
          </motion.div>
        </div>

        {/* Art-directed collage */}
        <div className="relative lg:col-span-6 lg:col-start-7 lg:h-[calc(100svh-6rem)] lg:pt-24">
          <motion.div
            className="relative ml-auto aspect-[4/5] w-[88%] overflow-hidden rounded-t-[999px] rounded-b-[28px] bg-navy shadow-[var(--shadow-lift)] sm:w-[72%] lg:mt-2 lg:aspect-auto lg:h-[calc(100%-3.5rem)] lg:w-[86%]"
            {...(reduce ? {} : { initial: { clipPath: "inset(100% 0 0 0 round 28px)" }, animate: { clipPath: "inset(0% 0 0 0 round 0px)" }, transition: { duration: 1.4, delay: 0.2, ease: EASE } })}
          >
            <motion.div className="absolute inset-[-8%_0]" style={reduce ? undefined : { y: imgY }}>
              <Image src={main.src} alt={main.alt} fill priority sizes="(min-width:1024px) 45vw, 90vw" className="object-cover" style={{ objectPosition: main.position }} />
            </motion.div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/35 via-transparent to-transparent" />
          </motion.div>

          {/* Latte-art cut-out crossing the seam */}
          <motion.div
            className="absolute bottom-[-6%] left-0 z-10 aspect-square w-[42%] max-w-[260px] overflow-hidden rounded-full border-[6px] border-ivory shadow-[var(--shadow-lift)] sm:left-[6%] lg:bottom-[9%] lg:left-[-4%] lg:w-[34%]"
            style={reduce ? undefined : { y: cupY }}
            {...(reduce ? {} : { initial: { scale: 0.6, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { duration: 1, delay: 0.9, ease: EASE } })}
          >
            <Image src={MEDIA.latteArt.src} alt={MEDIA.latteArt.alt} fill sizes="260px" className="object-cover" style={{ objectPosition: MEDIA.latteArt.position }} />
          </motion.div>

          {/* Rotating seal around the mascot — turns with scroll, not on a loop */}
          <motion.div
            className="absolute right-[2%] top-[4%] z-10 grid aspect-square w-[30%] max-w-[170px] place-items-center rounded-full bg-turquoise text-ink shadow-[var(--shadow-soft)] lg:right-auto lg:left-[2%] lg:top-[16%] lg:w-[26%]"
            {...fade(1.1)}
          >
            <motion.svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" style={reduce ? undefined : { rotate: ringRotate }} aria-hidden>
              <defs><path id="seal" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" /></defs>
              <text className="font-brand" fontSize="14.5" fontWeight="700" letterSpacing="2.2" fill="currentColor">
                <textPath href="#seal">LOVE OVER COFFEE • VIJAY NAGAR • INDORE •</textPath>
              </text>
            </motion.svg>
            <Mascot className="relative h-auto w-[36%]" title={null} />
          </motion.div>
        </div>
      </div>
      <Ticker progress={scrollYProgress} reduce={!!reduce} />
    </section>
  );
}

const WORDS = ["Coffee", "Conversations", "Comfort food", "Cold coffees", "Books on the wall", "Good company"];

/** Scroll-linked ticker: moves only as you scroll, so nothing loops in the background. */
function Ticker({ progress, reduce }: { progress: ReturnType<typeof useScroll>["scrollYProgress"]; reduce: boolean }) {
  const x = useTransform(progress, [0, 1], ["0%", "-25%"]);
  const row = [...WORDS, ...WORDS, ...WORDS];
  return (
    <div className="relative z-10 mt-16 -mx-4 -rotate-[1.2deg] border-y border-ink bg-turquoise py-3.5 text-ink lg:mt-2" aria-hidden>
      <motion.div className="flex w-max gap-8 whitespace-nowrap font-display text-2xl italic md:text-3xl" style={reduce ? undefined : { x }}>
        {row.map((w, i) => (
          <span key={i} className="flex items-center gap-8">{w}<span className="not-italic text-pink">✱</span></span>
        ))}
      </motion.div>
    </div>
  );
}
