import { adminRoute } from "@/lib/admin-api";
import { json } from "@/lib/http";
import { getStore } from "@/lib/store";

export const DELETE = adminRoute<{ params: Promise<{ id: string }> }>("manager", async (_r, _a, { params }) => {
  await getStore().deletePlatform((await params).id);
  return json({ ok: true });
});
