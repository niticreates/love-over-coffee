import { groupHours } from "@/lib/hours";
import type { BusinessSettings } from "@/lib/types";

export function Hours({ business, className }: { business: BusinessSettings; className?: string }) {
  if (!business.hours) return <p className={className}>Opening hours are being confirmed with the café. Please call before visiting.</p>;
  return (
    <dl className={className}>
      {groupHours(business.hours).map((g) => (
        <div key={g.days} className="flex justify-between gap-6 py-1">
          <dt>{g.days}</dt>
          <dd className="tabular-nums">{g.time}</dd>
        </div>
      ))}
      {business.hours_verification !== "verified" && <p className="mt-2 text-xs opacity-70">Hours awaiting confirmation.</p>}
    </dl>
  );
}
