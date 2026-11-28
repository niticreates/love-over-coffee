import { DEMO_FORM_NOTICE } from "@/lib/demo-copy";
import { demoMode } from "@/lib/config";

/** Shown above every public form on the demo deployment; renders nothing elsewhere. */
export function DemoFormNotice({ className = "" }: { className?: string }) {
  if (!demoMode()) return null;
  return (
    <p role="note" className={`rounded-2xl border border-terracotta-ink/30 bg-terracotta-ink/10 px-4 py-3 text-sm text-ink ${className}`}>
      <strong>Demo:</strong> {DEMO_FORM_NOTICE}
    </p>
  );
}
