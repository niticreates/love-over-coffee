import type { ReactNode } from "react";
import { CONTACT_DISABLED } from "@/lib/demo-copy";

/**
 * A tel: link, or, when no number is given (the public demo blanks it at the data source),
 * plain text saying contact is off. No href is rendered in that case, so there is nothing to tap.
 */
export function PhoneLink({ e164, className, children, disabledLabel = CONTACT_DISABLED }: { e164: string | null | undefined; className?: string; children: ReactNode; disabledLabel?: string }) {
  const digits = e164?.replace(/\s/g, "");
  if (!digits) return <span className={className} aria-disabled="true" data-contact-disabled="">{disabledLabel}</span>;
  return <a href={`tel:${digits}`} className={className}>{children}</a>;
}
