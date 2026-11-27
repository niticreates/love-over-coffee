"use client";
import { Minus, Plus } from "lucide-react";

export function QtyStepper({ value, onChange, min = 0, label }: { value: number; onChange: (v: number) => void; min?: number; label: string }) {
  return (
    <div className="inline-flex h-10 items-center border border-oat bg-paper" role="group" aria-label={`Quantity for ${label}`}>
      <button type="button" className="grid h-10 w-10 place-items-center hover:bg-oat disabled:opacity-40" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Decrease ${label}`}>
        <Minus size={14} />
      </button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">{value}</span>
      <button type="button" className="grid h-10 w-10 place-items-center hover:bg-oat disabled:opacity-40" onClick={() => onChange(value + 1)} disabled={value >= 20} aria-label={`Increase ${label}`}>
        <Plus size={14} />
      </button>
    </div>
  );
}
