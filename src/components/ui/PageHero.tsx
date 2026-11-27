"use client";
import clsx from "clsx";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useRef, type ReactNode } from "react";
import { Mascot } from "@/components/ui/Mascot";
import type { Media } from "@/lib/media";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The homepage's art direction, reusable on every page: eyebrow, display headline,
 * intro and actions on the left; an arch photograph with a circular cut-out and the
 * turning mascot seal on the right. `size="compact"` drops the photographs for utility
 * pages (checkout, status pages) and keeps only the seal.
 */
export function PageHero({
  eyebrow,
  title,
  intro,
  children,
  media,
  accent,
  seal = true,
  size = "full",
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
  media?: Media;
  accent?: Media;
  seal?: boolean;
  size?: "full" | "compact";
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);
  const accentY = useTransform(scrollYProgress, [0, 1], ["0%", "-45%"]);
  const ringRotate = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const fade = (d: number) => (reduce ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.85, delay: d, ease: EASE } });
  const full = size === "full" && media;

  return (
    <header ref={ref} className={clsx("relative overflow-hidden bg-ivory pt-28 md:pt-36", full ? "pb-14 lg:pb-20" : "pb-12 md:pb-16", className)}>
      <div className={clsx("container-site grid gap-12", full && "lg:grid-cols-12 lg:items-center lg:gap-8")}>
        <div className={clsx("relative z-10", full ? "lg:col-span-6" : "max-w-4xl")}>
          <motion.p className="eyebrow flex items-center gap-3 text-turquoise-deep" {...fade(0.05)}>
            <span className="h-px w-8 bg-turquoise-deep/60" /> {eyebrow}
          </motion.p>
          <span className="mt-6 block overflow-hidden pb-[.1em]">
            <motion.h1
              className={clsx("text-ink text-balance", full ? "text-[clamp(2.8rem,1.2rem+5vw,6rem)]" : "text-[clamp(2.6rem,1.4rem+4vw,5rem)]")}
              {...(reduce ? {} : { initial: { y: "60%", opacity: 0 }, animate: { y: "0%", opacity: 1 }, transition: { duration: 1, delay: 0.12, ease: EASE } })}
            >
              {title}
            </motion.h1>
          </span>
          {intro && <motion.div className="mt-7 max-w-lg text-lg leading-relaxed text-muted md:text-xl" {...fade(0.45)}>{intro}</motion.div>}
          {children && <motion.div className="mt-9" {...fade(0.6)}>{children}</motion.div>}
        </div>

        {full ? (
          <div className="relative lg:col-span-6">
            <motion.div
              className="relative ml-auto aspect-[4/5] w-[86%] overflow-hidden rounded-t-[999px] rounded-b-[28px] bg-navy shadow-[var(--shadow-lift)] sm:w-[66%] lg:aspect-[5/6] lg:w-[82%]"
              {...(reduce ? {} : { initial: { clipPath: "inset(100% 0 0 0 round 28px)" }, animate: { clipPath: "inset(0% 0 0 0 round 0px)" }, transition: { duration: 1.3, delay: 0.15, ease: EASE } })}
            >
              <motion.div className="absolute inset-[-8%_0]" style={reduce ? undefined : { y: imgY }}>
                <Image src={media.src} alt={media.alt} fill priority sizes="(min-width:1024px) 42vw, 86vw" className="object-cover" style={{ objectPosition: media.position }} />
              </motion.div>
            </motion.div>
            {accent && (
              <motion.div
                className="absolute bottom-[-5%] left-0 z-10 aspect-square w-[40%] max-w-[240px] overflow-hidden rounded-full border-[6px] border-ivory shadow-[var(--shadow-lift)] sm:left-[10%] lg:bottom-[6%] lg:left-0 lg:w-[34%]"
                style={reduce ? undefined : { y: accentY }}
                {...(reduce ? {} : { initial: { scale: 0.6, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { duration: 1, delay: 0.75, ease: EASE } })}
              >
                <Image src={accent.src} alt={accent.alt} fill sizes="240px" className="object-cover" style={{ objectPosition: accent.position }} />
              </motion.div>
            )}
            {seal && <Seal rotate={reduce ? undefined : ringRotate} className="right-[2%] top-[2%] w-[28%] max-w-[150px] lg:left-[4%] lg:right-auto lg:top-[8%] lg:w-[24%]" />}
          </div>
        ) : (
          seal && <Seal rotate={reduce ? undefined : ringRotate} className="right-[var(--spacing-gutter)] top-24 hidden w-32 md:grid lg:w-40" />
        )}
      </div>
    </header>
  );
}

function Seal({ rotate, className }: { rotate?: ReturnType<typeof useTransform<number, number>>; className?: string }) {
  return (
    <div className={clsx("absolute z-10 grid aspect-square place-items-center rounded-full bg-turquoise text-ink shadow-[var(--shadow-soft)]", className)} aria-hidden>
      <motion.svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" style={rotate ? { rotate } : undefined}>
        <defs><path id="page-seal" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" /></defs>
        <text className="font-brand" fontSize="14.5" fontWeight="700" letterSpacing="2.2" fill="currentColor">
          <textPath href="#page-seal">LOVE OVER COFFEE • VIJAY NAGAR • INDORE •</textPath>
        </text>
      </motion.svg>
      <Mascot className="relative h-auto w-[36%]" title={null} />
    </div>
  );
}
