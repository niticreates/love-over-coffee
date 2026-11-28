import { adminRoute } from "@/lib/admin-api";
import { settingsSchema } from "@/lib/admin-schemas";
import { demoMode } from "@/lib/config";
import { CONTACT_DISABLED } from "@/lib/demo-copy";
import { hasRole } from "@/lib/session";
import { fail, json, parseBody } from "@/lib/http";
import { getStore } from "@/lib/store";
import type { WebsiteSettings } from "@/lib/types";

export const GET = adminRoute("manager", async () => json(await getStore().getSettings()));

/** Managers edit content + reservation capacity; business, commerce and notifications are owner-only. */
export const PATCH = adminRoute("manager", async (req, admin) => {
  const body = await parseBody(req, settingsSchema);
  if (!body.ok) return body.res;
  const ownerOnly = ["business", "commerce", "notifications"] as const;
  if (!hasRole(admin.role, "owner") && ownerOnly.some((k) => body.data[k])) return fail(403, "forbidden", "Only the owner can change business, payment and notification settings.");
  // Public demo: business details (phone, WhatsApp, email, links) can't be changed by anyone.
  if (demoMode() && body.data.business) return fail(403, "demo_locked", `${CONTACT_DISABLED} Business details can't be changed here.`);
  return json(await getStore().updateSettings(body.data as Partial<WebsiteSettings>));
});
