import clsx from "clsx";
import { ArrowUpRight } from "lucide-react";
import type { ExternalPlatform } from "@/lib/types";

/**
 * Logo tile. An uploaded official logo is used when present; otherwise a typographic
 * tile in the platform's colour (we don't embed third-party logo artwork ourselves).
 */
const TILE: Record<string, { bg: string; fg: string; text: string; font?: string }> = {
  district: { bg: "#1c1c1c", fg: "#ffffff", text: "district", font: "font-sans font-bold tracking-tight lowercase" },
  zomato: { bg: "#e23744", fg: "#ffffff", text: "zomato", font: "font-sans font-extrabold italic tracking-tight lowercase" },
  swiggy: { bg: "#fc8019", fg: "#ffffff", text: "Swiggy", font: "font-sans font-extrabold tracking-tight" },
  google_maps: { bg: "#ffffff", fg: "#1a73e8", text: "Maps", font: "font-sans font-semibold" },
};

export function PlatformLogo({ p, className }: { p: Pick<ExternalPlatform, "platform_logo" | "brand" | "platform_name">; className?: string }) {
  if (p.platform_logo)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={p.platform_logo} alt={`${p.platform_name} logo`} className={clsx("h-12 w-12 rounded-[12px] border border-oat bg-white object-contain p-1.5", className)} />;
  const t = TILE[p.brand] ?? { bg: "var(--color-espresso)", fg: "var(--color-ivory)", text: p.platform_name.slice(0, 2), font: "font-display text-lg" };
  return (
    <span aria-hidden className={clsx("grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-[12px] border border-oat text-[11px]", t.font, className)} style={{ background: t.bg, color: t.fg }}>
      {t.text}
    </span>
  );
}

export function PlatformCard({ p, cta }: { p: ExternalPlatform; cta: string }) {
  return (
    <a
      href={p.platform_url!}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col rounded-[22px] border border-oat bg-paper p-6 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-walnut/50 hover:shadow-soft md:p-7"
    >
      <div className="flex items-start justify-between gap-4">
        <PlatformLogo p={p} />
        <ArrowUpRight size={18} className="text-muted transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-espresso" aria-hidden />
      </div>
      <h3 className="mt-6 text-3xl">{p.platform_name}</h3>
      {p.description && <p className="mt-2 text-sm leading-relaxed text-muted">{p.description}</p>}
      <span className="mt-auto pt-6">
        <span className="btn btn-outline min-h-[42px] w-full group-hover:bg-espresso group-hover:text-ivory">
          {cta} <span className="sr-only">on {p.platform_name} (opens in a new tab)</span>
        </span>
      </span>
    </a>
  );
}
