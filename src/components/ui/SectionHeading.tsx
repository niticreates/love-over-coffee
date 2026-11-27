import clsx from "clsx";
import type { ReactNode } from "react";

export function SectionHeading({ index, eyebrow, title, children, align = "left", className, tone = "dark" }: {
  index?: string; eyebrow: string; title: ReactNode; children?: ReactNode; align?: "left" | "center"; className?: string; tone?: "dark" | "light";
}) {
  return (
    <header className={clsx("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      <p className={clsx("eyebrow flex items-center gap-3", align === "center" && "justify-center", tone === "dark" ? "text-terracotta-ink" : "text-sage")}>
        {index && <span className="font-display text-sm italic tracking-normal normal-case">{index}</span>}
        <span className={clsx("h-px w-8", tone === "dark" ? "bg-terracotta-ink/50" : "bg-sage/60")} />
        {eyebrow}
      </p>
      <h2 className="mt-5 text-[length:var(--text-display-md)]">{title}</h2>
      {children && <div className={clsx("mt-6 max-w-prose text-[1.05rem] leading-relaxed", tone === "dark" ? "text-muted" : "text-ivory/75", align === "center" && "mx-auto")}>{children}</div>}
    </header>
  );
}
