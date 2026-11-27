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

export function PlatformCard({ p, cta, tone = "paper" }: { p: ExternalPlatform; cta: string; tone?: "paper" | "turquoise" }) {
  const blue = tone === "turquoise";
  return (
    <a
      href={p.platform_url!}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx("group flex h-full flex-col rounded-[22px] p-6 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 md:p-7", blue ? "bg-turquoise text-ink hover:shadow-[0_24px_50px_-24px_rgb(0_0_0/.6)]" : "border border-oat bg-paper hover:border-walnut/50 hover:shadow-soft")}
    >
      <div className="flex items-start justify-between gap-4">
        <PlatformLogo p={p} />
        <ArrowUpRight size={18} className={clsx("transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-espresso", blue ? "text-ink/70" : "text-muted")} aria-hidden />
      </div>
      <h3 className="mt-6 text-3xl text-ink">{p.platform_name}</h3>
      {p.description && <p className={clsx("mt-2 text-sm leading-relaxed", blue ? "text-ink/80" : "text-muted")}>{p.description}</p>}
      <span className="mt-auto pt-6">
        <span className={clsx("btn min-h-[42px] w-full", blue ? "btn-card" : "btn-outline text-ink group-hover:bg-ink group-hover:text-ivory")}>
          {cta} <span className="sr-only">on {p.platform_name} (opens in a new tab)</span>
        </span>
      </span>
    </a>
  );
}
