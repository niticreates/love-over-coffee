import "server-only";
import { assertDemoSafe, dataMode, memoryStoreAllowed } from "../config";
import { memoryStore } from "./memory";
import { supabaseStore } from "./supabase";
import type { Store } from "./types";

export function getStore(): Store {
  assertDemoSafe();
  if (dataMode() === "supabase") return supabaseStore;
  if (!memoryStoreAllowed())
    throw new Error(
      "Database not configured: set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY. " +
        "(For a local production preview only, set ALLOW_MEMORY_STORE=true.)",
    );
  return memoryStore;
}
export * from "./types";
