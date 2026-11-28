"use client";
import { useEffect } from "react";
import { isRecoveryFragment, RESET_PATH } from "@/lib/recovery";

/**
 * Supabase sends recovery links to the Site URL (the homepage) unless the reset page is on the
 * allowed redirect list. If a recovery fragment lands on any other page, move it to the reset
 * page. location.replace keeps the token out of history; the fragment is never sent to a server.
 */
export function RecoveryRedirect() {
  useEffect(() => {
    if (window.location.pathname === RESET_PATH) return;
    if (isRecoveryFragment(window.location.hash)) window.location.replace(RESET_PATH + window.location.hash);
  }, []);
  return null;
}
