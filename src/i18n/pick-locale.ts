import { defaultLocale, hasLocale, type Locale } from "./config";

/**
 * The visitor's language: their saved choice, then the browser's preference, then Arabic.
 * "ar-EG,ar;q=0.9,en;q=0.8" → the first of ar/en the browser lists wins.
 */
export function pickLocale(saved: string | undefined, acceptLanguage: string | null): Locale {
  if (saved && hasLocale(saved)) return saved;
  for (const tag of (acceptLanguage ?? "").toLowerCase().split(",")) {
    const primary = tag.trim().split(/[-;]/)[0];
    if (hasLocale(primary)) return primary;
  }
  return defaultLocale;
}
