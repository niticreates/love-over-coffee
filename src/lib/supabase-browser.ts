import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * A short-lived browser Supabase client for the password-recovery page only. The session lives
 * in memory (never localStorage or cookies), is not refreshed, and is not read from the URL
 * automatically: the page hands the link's tokens over itself and wipes them from the address bar.
 * The rest of the app keeps signing in on the server.
 */
export function recoveryClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, flowType: "implicit" },
  });
}
