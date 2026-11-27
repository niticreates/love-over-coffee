import { adminRoute } from "@/lib/admin-api";
import { productSchema } from "@/lib/admin-schemas";
import { json, parseBody } from "@/lib/http";
import { uuid } from "@/lib/ids";
import { getStore } from "@/lib/store";
import type { Product } from "@/lib/types";

export const GET = adminRoute("staff", async () => json(await getStore().listProducts({ includeUnavailable: true })));

export const POST = adminRoute("manager", async (req) => {
  const body = await parseBody(req, productSchema);
  if (!body.ok) return body.res;
  const { price_rupees, ...d } = body.data;
  const p: Product = { ...d, id: d.id ?? `prd_${uuid().slice(0, 8)}`, price: price_rupees };
  return json(await getStore().upsertProduct(p));
});
