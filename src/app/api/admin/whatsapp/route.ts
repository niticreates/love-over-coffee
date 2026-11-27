import { z } from "zod";
import { adminRoute } from "@/lib/admin-api";
import { fail, json, parseBody } from "@/lib/http";
import { getStore } from "@/lib/store";

const msg = z.string().trim().min(1).max(300);
const schema = z.object({
  whatsapp_e164: z.string().regex(/^\+\d{10,15}$/, "Use the international format, e.g. +919329697769").nullable(),
  whatsapp_messages: z.object({ general: msg, reservation: msg, ordering: msg, group: msg }),
});

/** Managers can change the public WhatsApp number and prefilled messages without touching other business settings. */
export const PATCH = adminRoute("manager", async (req) => {
  const body = await parseBody(req, schema);
  if (!body.ok) return body.res;
  const store = getStore();
  const s = await store.getSettings();
  if (!s.business) return fail(500, "error", "Settings unavailable.");
  return json(await store.updateSettings({ business: { ...s.business, ...body.data } }));
});
