import { NextResponse, type NextRequest } from "next/server";
import { challenges } from "@/data/challenges";
import { dailySlug } from "@/data/daily";
import { hasLocale } from "@/i18n/config";

/** /ar/daily (or /en/daily) always leads to today's challenge — a link to share or bookmark */
export async function GET(request: NextRequest, { params }: RouteContext<"/[lang]/daily">) {
  const { lang } = await params;
  const locale = hasLocale(lang) ? lang : "ar";
  const slug = dailySlug(new Date(), challenges.map((c) => c.slug));
  const response = NextResponse.redirect(new URL(`/${locale}/challenges/${slug}`, request.url), 307);
  response.headers.set("Cache-Control", "no-store"); // tomorrow it points elsewhere
  return response;
}
