import type { BusinessSettings, WhatsAppContext } from "./types";

/** wa.me deep link: opens the app on mobile, WhatsApp Web/desktop otherwise. null when no number is configured. */
export function whatsappLink(b: Pick<BusinessSettings, "whatsapp_e164" | "whatsapp_messages">, context: WhatsAppContext = "general"): string | null {
  const digits = b.whatsapp_e164?.replace(/\D/g, "");
  if (!digits) return null;
  const text = b.whatsapp_messages?.[context];
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
