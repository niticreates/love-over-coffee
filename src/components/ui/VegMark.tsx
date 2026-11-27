/** FSSAI-style veg / non-veg mark. Renders nothing when unverified. */
export function VegMark({ veg }: { veg: boolean | null }) {
  if (veg == null) return null;
  const c = veg ? "var(--color-veg)" : "var(--color-nonveg)";
  return (
    <span title={veg ? "Vegetarian" : "Non-vegetarian"} className="inline-grid h-4 w-4 shrink-0 place-items-center border-[1.5px]" style={{ borderColor: c }}>
      <span className="sr-only">{veg ? "Vegetarian" : "Non-vegetarian"}</span>
      {veg ? <span className="h-2 w-2 rounded-full" style={{ background: c }} /> : <span className="h-0 w-0 border-x-[4px] border-b-[7px] border-x-transparent" style={{ borderBottomColor: c }} />}
    </span>
  );
}
