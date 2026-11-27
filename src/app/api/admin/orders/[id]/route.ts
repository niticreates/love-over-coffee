import { adminRoute } from "@/lib/admin-api";
import { orderPatchSchema } from "@/lib/admin-schemas";
import { fail, json, parseBody } from "@/lib/http";
import { changeOrderStatus } from "@/lib/services/orders";

export const PATCH = adminRoute<{ params: Promise<{ id: string }> }>("staff", async (req, _a, { params }) => {
  const body = await parseBody(req, orderPatchSchema);
  if (!body.ok) return body.res;
  const r = await changeOrderStatus((await params).id, body.data.status);
  if (!r.ok) return fail(r.status, "invalid_transition", r.message);
  return json(r.order);
});
