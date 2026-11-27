import clsx from "clsx";

/** Typographic wordmark. Replace with the café's official logo file once supplied (public/brand/logo.svg). */
export function Wordmark({ className, stacked }: { className?: string; stacked?: boolean }) {
  return (
    <span className={clsx("font-display inline-flex items-baseline gap-[.35em] leading-none whitespace-nowrap", stacked && "flex-col items-start gap-0", className)}>
      <span className="tracking-[.28em] text-[1em] font-semibold">LOVE</span>
      <span className="italic text-[1.05em] font-normal tracking-normal">over</span>
      <span className="tracking-[.28em] text-[1em] font-semibold">COFFEE</span>
    </span>
  );
}
