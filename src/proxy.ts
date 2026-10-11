import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasLocale, LOCALE_COOKIE } from "./i18n/config";
import { pickLocale } from "./i18n/pick-locale";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "./lib/supabase/config";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1] ?? "";

  // every page lives under /ar or /en
  if (!hasLocale(first)) {
    const url = request.nextUrl.clone();
    const locale = pickLocale(request.cookies.get(LOCALE_COOKIE)?.value, request.headers.get("accept-language"));
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
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
