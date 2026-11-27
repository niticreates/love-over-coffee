import { z } from "zod";
import { adminRoute } from "@/lib/admin-api";
import { hasRole } from "@/lib/session";
import { fail, json, parseBody } from "@/lib/http";
import { getStore } from "@/lib/store";

type Ctx = { params: Promise<{ id: string }> };

/** Quick toggles. Staff may change availability (e.g. sold out); managers may also feature. */
export const PATCH = adminRoute<Ctx>("staff", async (req, admin, { params }) => {
  const { id } = await params;
  const body = await parseBody(req, z.object({ is_available: z.boolean().optional(), is_featured: z.boolean().optional() }));
  if (!body.ok) return body.res;
  if (body.data.is_featured !== undefined && !hasRole(admin.role, "manager")) return fail(403, "forbidden", "Managers only.");
  const store = getStore();
  const p = (await store.listProducts({ includeUnavailable: true })).find((x) => x.id === id);
  if (!p) return fail(404, "not_found", "Product not found.");
  return json(await store.upsertProduct({ ...p, ...body.data }));
});

export const DELETE = adminRoute<Ctx>("manager", async (_req, _a, { params }) => {
  const { id } = await params;
  await getStore().deleteProduct(id);
  return json({ ok: true });
});
