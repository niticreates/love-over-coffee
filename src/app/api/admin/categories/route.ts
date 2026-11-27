import { adminRoute } from "@/lib/admin-api";
import { categorySchema } from "@/lib/admin-schemas";
import { json, parseBody } from "@/lib/http";
import { getStore } from "@/lib/store";

export const POST = adminRoute("manager", async (req) => {
  const body = await parseBody(req, categorySchema);
  if (!body.ok) return body.res;
  return json(await getStore().upsertCategory({ ...body.data, id: body.data.id ?? `cat_${body.data.slug}` }));
});
