/**
 * Supabase settings come from environment variables only (see .env.example).
 * Until they're set, the site works fully — sign-in just shows as unavailable.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
// Supabase's new "publishable" key, or the classic "anon" key — both are safe to expose
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);
