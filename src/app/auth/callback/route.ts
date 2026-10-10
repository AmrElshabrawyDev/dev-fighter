import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

/** OAuth (GitHub / Google) lands here with ?code=…&next=/ar/… */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  // only same-site paths, never an open redirect
  const next = searchParams.get("next") ?? `/${defaultLocale}`;
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : `/${defaultLocale}`;

  const supabase = await createClient();
  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`);
  }
  const locale = safeNext.split("/")[1] || defaultLocale;
  return NextResponse.redirect(`${origin}/${locale}/login?error=1`);
}
