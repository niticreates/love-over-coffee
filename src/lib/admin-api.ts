import "server-only";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { AuthError, requireAdmin } from "./auth";
import { fail, sameOrigin } from "./http";
import type { Role, SessionPayload } from "./session";
import { StoreError } from "./store";

/** Wraps an admin route: same-origin check, role check, and uniform error mapping. */
export function adminRoute<C>(need: Role, handler: (req: Request, admin: SessionPayload, ctx: C) => Promise<NextResponse>) {
  return async (req: Request, ctx: C) => {
    if (req.method !== "GET" && !sameOrigin(req)) return fail(403, "bad_origin", "Cross-site request blocked.");
    try {
      const admin = await requireAdmin(need);
      const res = await handler(req, admin, ctx);
      // Public pages are statically cached; refresh them after any successful admin write.
      if (req.method !== "GET" && res.ok) revalidatePath("/", "layout");
      return res;
    } catch (e) {
      if (e instanceof AuthError) return fail(e.status, e.status === 401 ? "unauthenticated" : "forbidden", e.message);
      if (e instanceof StoreError) return fail(e.code === "not_found" ? 404 : e.code === "conflict" ? 409 : 503, e.code, e.message);
      console.error("admin route error", e);
      return fail(500, "error", "Something went wrong.");
    }
  };
}
