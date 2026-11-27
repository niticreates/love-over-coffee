import Image from "next/image";
import clsx from "clsx";
import { Mascot } from "./Mascot";

/** Placeholder palettes drawn from the café interior. */
const TONES = {
  interiors: "bg-navy text-ivory",
  beverages: "bg-turquoise-soft text-ink",
  food: "bg-blush text-berry",
  desserts: "bg-cream text-berry",
  experiences: "bg-leaf text-ivory",
} as const;
export type Tone = keyof typeof TONES;

/**
 * Renders the café's own photograph when one exists. Otherwise an art-directed, clearly
 * labelled typographic tile — never a stock photo standing in for the café's food or rooms.
 */
export function Photo({
  src,
  alt,
  tone = "interiors",
  label,
  className,
  sizes = "100vw",
  priority,
  shape = "rect",
  style,
  position,
}: {
  src?: string | null;
  alt: string;
  tone?: Tone;
  label?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  shape?: "rect" | "arch" | "round";
  style?: React.CSSProperties;
  position?: string;
}) {
  const radius = shape === "arch" ? "rounded-t-[999px] rounded-b-[20px]" : shape === "round" ? "rounded-full" : "rounded-[20px]";
  if (src) {
    return (
      <div style={style} className={clsx("relative overflow-hidden bg-oat", radius, className)}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" style={position ? { objectPosition: position } : undefined} unoptimized={src.startsWith("data:")} />
      </div>
    );
  }
  return (
    <div style={style} role="img" aria-label={`${alt} — photograph coming soon`} className={clsx("relative isolate flex flex-col justify-between overflow-hidden p-4 sm:p-5", radius, TONES[tone], className)}>
      <Mascot className="absolute -bottom-[8%] -right-[6%] -z-10 h-[62%] w-auto opacity-[.13] grayscale" title={null} animated={false} />
      <span className="self-end whitespace-nowrap text-[9px] font-bold tracking-[.2em] uppercase opacity-60">Photo to come</span>
      {label?.trim() && <span className="font-display text-[clamp(1.25rem,1rem+1.2vw,2rem)] italic leading-[1.05] text-balance">{label}</span>}
    </div>
  );
}
