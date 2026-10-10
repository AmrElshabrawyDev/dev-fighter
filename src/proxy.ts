import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, hasLocale, LOCALE_COOKIE, type Locale } from "./i18n/config";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "./lib/supabase/config";

/** The visitor's language: their saved choice, then the browser's preference, then Arabic */
function pickLocale(request: NextRequest): Locale {
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  if (saved && hasLocale(saved)) return saved;
  // "ar-EG,ar;q=0.9,en;q=0.8" → the first of ar/en the browser lists wins
  const tags = (request.headers.get("accept-language") ?? "").toLowerCase().split(",");
  for (const tag of tags) {
    const primary = tag.trim().split(/[-;]/)[0];
    if (hasLocale(primary)) return primary;
  }
  return defaultLocale;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1] ?? "";

  // every page lives under /ar or /en
  if (!hasLocale(first)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${pickLocale(request)}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next({ request });
  if (!isSupabaseConfigured) return response;

  // keep the Supabase session fresh (rotates the auth cookies when needed)
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(toSet) {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  // pages only: skip Next internals, auth routes and files with an extension
  matcher: ["/((?!_next|auth|api|.*\\..*).*)"],
};
