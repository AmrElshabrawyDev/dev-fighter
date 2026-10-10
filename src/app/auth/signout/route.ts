import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, hasLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  const form = await request.formData();
  const locale = String(form.get("locale") ?? "");
  return NextResponse.redirect(new URL(`/${hasLocale(locale) ? locale : defaultLocale}`, request.url), { status: 303 });
}
