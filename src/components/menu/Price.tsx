import { formatINR } from "@/lib/money";

export function Price({ value, sample, className }: { value: number | null; sample?: boolean; className?: string }) {
  if (value == null) return <span className={`text-sm text-muted ${className ?? ""}`}>Price on request</span>;
  return (
    <span className={`tabular-nums ${className ?? ""}`}>
      {formatINR(value)}
      {sample && <span className="ml-2 align-middle text-[9px] font-bold tracking-[.16em] text-terracotta-ink uppercase">Sample</span>}
    </span>
  );
}
