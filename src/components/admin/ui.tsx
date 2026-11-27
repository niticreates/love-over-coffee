import clsx from "clsx";
import type { ReactNode } from "react";

export function PageTitle({ title, eyebrow, children }: { title: string; eyebrow?: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow text-turquoise-deep">{eyebrow ?? "Love Over Coffee · Vijay Nagar"}</p>
        <h1 className="mt-2 text-4xl text-ink md:text-5xl">
          {title}
          <span className="text-pink">.</span>
        </h1>
      </div>
      {children}
    </div>
  );
}

export function Card({ title, children, className, action }: { title?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={clsx("admin-surface p-5 md:p-6", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="eyebrow flex items-center gap-2 font-sans text-turquoise-deep"><span className="h-1.5 w-1.5 rounded-full bg-pink" aria-hidden />{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/* Status colours drawn from the brand palette: turquoise = in progress, leaf = done, sun = waiting, pink/berry = stopped. */
const WAIT = "bg-sun/30 text-[#6b4a12]";
const GO = "bg-turquoise-soft text-turquoise-deep";
const DONE = "bg-leaf/15 text-leaf";
const STOP = "bg-blush text-berry";
const QUIET = "bg-oat/70 text-muted";
const TONE: Record<string, string> = {
  pending: WAIT, requested: WAIT, owner_to_confirm: WAIT,
  confirmed: GO, preparing: GO, ready_for_pickup: GO, out_for_delivery: GO, refunded: GO,
  completed: DONE, paid: DONE, verified: DONE,
  cancelled: STOP, rejected: STOP, no_show: STOP, failed: STOP,
  unpaid: QUIET, created: QUIET, hidden: QUIET,
};
export function Badge({ value }: { value: string }) {
  return <span className={clsx("inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 align-middle text-[11px] font-semibold capitalize", TONE[value] ?? QUIET)}>{value.replace(/_/g, " ")}</span>;
}

const STAT_TONE = {
  paper: { box: "admin-surface", label: "text-turquoise-deep", value: "text-ink", hint: "text-muted" },
  turquoise: { box: "rounded-[22px] bg-turquoise", label: "text-ink/75", value: "text-ink", hint: "text-ink/70" },
  navy: { box: "rounded-[22px] bg-navy", label: "text-turquoise", value: "text-ivory", hint: "text-ivory/65" },
  blush: { box: "rounded-[22px] bg-blush", label: "text-berry", value: "text-ink", hint: "text-ink/65" },
} as const;

export function Stat({ label, value, hint, tone = "paper" }: { label: string; value: ReactNode; hint?: string; tone?: keyof typeof STAT_TONE }) {
  const t = STAT_TONE[tone];
  return (
    <div className={clsx("p-5", t.box)}>
      <p className={clsx("eyebrow", t.label)}>{label}</p>
      <p className={clsx("mt-3 font-display text-4xl tabular-nums", t.value)}>{value}</p>
      {hint && <p className={clsx("mt-1 text-xs", t.hint)}>{hint}</p>}
    </div>
  );
}
