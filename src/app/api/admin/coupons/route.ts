import { adminRoute } from "@/lib/admin-api";
import { couponSchema } from "@/lib/admin-schemas";
import { json, parseBody } from "@/lib/http";
import { getStore } from "@/lib/store";

export const GET = adminRoute("staff", async () => json(await getStore().listCoupons()));
export const POST = adminRoute("manager", async (req) => {
  const body = await parseBody(req, couponSchema);
  if (!body.ok) return body.res;
  return json(await getStore().upsertCoupon(body.data));
});
