import clsx from "clsx";
import { Mascot } from "./Mascot";

/**
 * Wordmark set to echo the storefront lettering — rounded lowercase with the turquoise
 * "l", "O" and "C" — beside the cup mascot. Replace with the official logo file when supplied.
 */
export function Wordmark({ className, mascot = true, tone = "dark" }: { className?: string; mascot?: boolean; stacked?: boolean; tone?: "dark" | "light" }) {
  const accent = tone === "dark" ? "text-turquoise-deep" : "text-turquoise";
  return (
    <span className={clsx("font-brand inline-flex items-center gap-[.45em] leading-none whitespace-nowrap tracking-[-.01em]", className)}>
      {mascot && <Mascot className="h-[1.9em] w-auto shrink-0" title={null} />}
      <span className="text-[1.35em] font-bold">
        <span className={accent}>l</span>ove<span className={accent}>O</span>ver<span className={accent}>C</span>offee<span className="text-pink">.</span>
      </span>
    </span>
  );
}
