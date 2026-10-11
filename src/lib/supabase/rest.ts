import "server-only";
import { PostgrestClient } from "@supabase/postgrest-js";
import { supabaseUrl } from "./config";

/**
 * Just Supabase's REST API with a fixed key — no auth client, so nothing keeps
 * running in the background after a request (safe in cached functions).
 */
export function restClient(key: string) {
  // new keys (sb_publishable_…, sb_secret_…) go in `apikey`; classic JWT keys also as a bearer token
  const headers: Record<string, string> = { apikey: key };
  if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
  return new PostgrestClient(`${supabaseUrl}/rest/v1`, { headers });
}
