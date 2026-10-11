import "server-only";
import { supabaseUrl } from "./config";
import { restClient } from "./rest";

/**
 * Supabase with the secret (service-role) key: bypasses row level security.
 * Server only — it records official scores. The key is read from
 * SUPABASE_SECRET_KEY (or the classic SUPABASE_SERVICE_ROLE_KEY) and must
 * never get a NEXT_PUBLIC_ prefix.
 */
const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const isScoringConfigured = Boolean(supabaseUrl && secretKey);

export function createAdminClient() {
  return isScoringConfigured ? restClient(secretKey) : null;
}
