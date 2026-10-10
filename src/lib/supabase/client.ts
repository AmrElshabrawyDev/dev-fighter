"use client";

import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "./config";

/** Supabase client for Client Components (null until Supabase is configured) */
export function createClient() {
  return isSupabaseConfigured ? createBrowserClient(supabaseUrl, supabaseKey) : null;
}
