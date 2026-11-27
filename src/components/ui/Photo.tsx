import Image from "next/image";
import clsx from "clsx";

const TONES = {
  interiors: "bg-[#c9cdb8] text-[#3f4a37]",
  beverages: "bg-[#b89a80] text-[#3b2a1f]",
  food: "bg-[#c98f72] text-[#4a2617]",
  desserts: "bg-[#e3d3bd] text-[#5d4a36]",
  experiences: "bg-[#56636a] text-[#eae3d3]",
} as const;
export type Tone = keyof typeof TONES;

/**
 * Renders a real photograph when one exists; otherwise an art-directed, clearly labelled
 * placeholder. We never substitute stock imagery for the café's own food or interiors.
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
}: {
  src?: string | null;
  alt: string;
  tone?: Tone;
  label?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  shape?: "rect" | "arch";
  style?: React.CSSProperties;
}) {
  const radius = shape === "arch" ? "rounded-t-[999px] rounded-b-[4px]" : "rounded-[2px]";
  if (src) {
    return (
      <div style={style} className={clsx("relative overflow-hidden bg-oat", radius, className)}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" unoptimized={src.startsWith("data:")} />
      </div>
    );
  }
  return (
    <div style={style} role="img" aria-label={`${alt} — photograph coming soon`} className={clsx("grain relative isolate overflow-hidden", radius, TONES[tone], className)}>
      <svg aria-hidden className="absolute inset-0 h-full w-full opacity-[.22]" preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <radialGradient id="g" cx="30%" cy="25%" r="80%">
            <stop offset="0" stopColor="#fff" stopOpacity=".9" />
            <stop offset="1" stopColor="#000" stopOpacity=".5" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill="url(#g)" />
      </svg>
      <span className="absolute right-3 top-3 whitespace-nowrap text-[9px] font-semibold tracking-[.2em] uppercase opacity-55 sm:right-4 sm:top-4">Photo to come</span>
      {label?.trim() && <span className="eyebrow absolute inset-x-0 bottom-0 p-4 opacity-80 sm:p-5">{label}</span>}
    </div>
  );
}
