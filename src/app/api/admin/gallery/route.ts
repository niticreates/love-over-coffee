import { z } from "zod";
import { adminRoute } from "@/lib/admin-api";
import { gallerySchema } from "@/lib/admin-schemas";
import { json, parseBody } from "@/lib/http";
import { uuid } from "@/lib/ids";
import { getStore } from "@/lib/store";

export const POST = adminRoute("manager", async (req) => {
  const body = await parseBody(req, gallerySchema);
  if (!body.ok) return body.res;
  return json(await getStore().upsertGalleryImage({ ...body.data, id: body.data.id ?? `gal_${uuid().slice(0, 8)}` }));
});

export const PUT = adminRoute("manager", async (req) => {
  const body = await parseBody(req, z.object({ order: z.array(z.string().max(80)).max(500) }));
  if (!body.ok) return body.res;
  await getStore().reorderGallery(body.data.order);
  return json({ ok: true });
});
