import { z } from "zod";
import { adminRoute } from "@/lib/admin-api";
import { platformSchema } from "@/lib/admin-schemas";
import { json, parseBody } from "@/lib/http";
import { uuid } from "@/lib/ids";
import { getStore } from "@/lib/store";

export const GET = adminRoute("staff", async () => json(await getStore().listPlatforms()));

export const POST = adminRoute("manager", async (req) => {
  const body = await parseBody(req, platformSchema);
  if (!body.ok) return body.res;
  const d = body.data;
  // A platform can't be live without a link; keep it saved but hidden.
  return json(await getStore().upsertPlatform({ ...d, id: d.id ?? `plt_${uuid().slice(0, 8)}`, is_active: d.is_active && !!d.platform_url }));
});

export const PUT = adminRoute("manager", async (req) => {
  const body = await parseBody(req, z.object({ order: z.array(z.string().max(80)).max(200) }));
  if (!body.ok) return body.res;
  await getStore().reorderPlatforms(body.data.order);
  return json({ ok: true });
});
