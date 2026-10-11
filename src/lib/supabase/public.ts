import "server-only";
import { isSupabaseConfigured, supabaseKey } from "./config";
import { restClient } from "./rest";

/** Public data, read as an anonymous visitor (row level security applies) */
export function createPublicClient() {
  return isSupabaseConfigured ? restClient(supabaseKey) : null;
}
