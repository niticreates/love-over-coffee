import "server-only";
import { dataMode } from "../config";
import { memoryStore } from "./memory";
import { supabaseStore } from "./supabase";
import type { Store } from "./types";

export function getStore(): Store {
  return dataMode() === "supabase" ? supabaseStore : memoryStore;
}
export * from "./types";
