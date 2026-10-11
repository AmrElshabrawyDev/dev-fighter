import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "./config";

/** Supabase client for Server Components, Route Handlers and Server Actions */
export async function createClient() {
  if (!isSupabaseConfigured) return null;
  // The Supabase client reads the clock in the background (its auth listener).
  // Under partial prefetching that's only allowed at request time, so wait for it.
  await connection();
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(toSet) {
        try {
          for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
        } catch {
          // called from a Server Component — the proxy refreshes the session instead
        }
      },
    },
  });
}

export type CurrentUser = {
  id: string;
  name: string;
  avatarUrl?: string;
};

/** The signed-in user, or null. Reads cookies, so callers render inside <Suspense>. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    name: meta.user_name ?? meta.full_name ?? meta.name ?? user.email?.split("@")[0] ?? "player",
    avatarUrl: meta.avatar_url ?? meta.picture,
  };
}
