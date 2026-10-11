import { defaultLocale } from "@/i18n/config";

/**
 * Where to send someone after sign-in: only a path on this site. Anything that
 * could leave it ("https://…", "//evil.com", "/\evil.com") falls back to the home page.
 */
export function safeNextPath(next: string | null): string {
  const fallback = `/${defaultLocale}`;
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
