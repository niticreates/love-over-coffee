import type { DayHours } from "./types";

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  const hh = h % 24;
  return `${((hh + 11) % 12) + 1}${m ? `:${String(m).padStart(2, "0")}` : ""} ${hh < 12 ? "am" : "pm"}`;
}

/** Collapses identical consecutive days: "Mon – Sun · 11 am – 11 pm". */
export function groupHours(hours: DayHours[]): { days: string; time: string }[] {
  const order = [1, 2, 3, 4, 5, 6, 0];
  const label = (d: DayHours) => (d.open && d.close ? `${fmt12(d.open)} – ${fmt12(d.close)}` : "Closed");
  const groups: { start: number; end: number; time: string }[] = [];
  for (const day of order) {
    const h = hours.find((x) => x.day === day) ?? { day, open: null, close: null };
    const t = label(h);
    const last = groups.at(-1);
    if (last && last.time === t) last.end = day;
    else groups.push({ start: day, end: day, time: t });
  }
  const short = (d: number) => DAY_NAMES[d].slice(0, 3);
  return groups.map((g) => ({ days: g.start === g.end ? short(g.start) : `${short(g.start)} – ${short(g.end)}`, time: g.time }));
}
