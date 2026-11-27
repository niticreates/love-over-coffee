import clsx from "clsx";
import type { ReactNode } from "react";

export function PageTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <h1 className="text-4xl md:text-5xl">{title}</h1>
      {children}
    </div>
  );
}

export function Card({ title, children, className, action }: { title?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={clsx("border border-oat bg-ivory p-5 md:p-6", className)}>
      {(title || action) && <div className="mb-4 flex items-center justify-between gap-3">{title && <h2 className="eyebrow text-walnut">{title}</h2>}{action}</div>}
      {children}
    </section>
  );
}

const TONE: Record<string, string> = {
  pending: "bg-[#f3e1c7] text-[#6b4a12]", requested: "bg-[#f3e1c7] text-[#6b4a12]", confirmed: "bg-[#dfe7d6] text-[#2f4a26]",
  preparing: "bg-[#e6dccf] text-[#5b412b]", ready_for_pickup: "bg-[#dfe7d6] text-[#2f4a26]", out_for_delivery: "bg-[#dbe3e8] text-[#24404f]",
  completed: "bg-oat text-espresso", cancelled: "bg-[#f1d9d2] text-[#7a2a17]", rejected: "bg-[#f1d9d2] text-[#7a2a17]", no_show: "bg-[#f1d9d2] text-[#7a2a17]",
  paid: "bg-[#dfe7d6] text-[#2f4a26]", unpaid: "bg-oat text-muted", created: "bg-oat text-muted", failed: "bg-[#f1d9d2] text-[#7a2a17]", refunded: "bg-[#dbe3e8] text-[#24404f]",
  owner_to_confirm: "bg-[#f3e1c7] text-[#6b4a12]", verified: "bg-[#dfe7d6] text-[#2f4a26]",
};
export function Badge({ value }: { value: string }) {
  return <span className={clsx("inline-block whitespace-nowrap px-2 py-0.5 text-[11px] font-semibold capitalize", TONE[value] ?? "bg-oat")}>{value.replace(/_/g, " ")}</span>;
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="border border-oat bg-ivory p-5">
      <p className="eyebrow text-walnut">{label}</p>
      <p className="mt-3 font-display text-4xl tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
