export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];

/** Arabic first */
export const defaultLocale: Locale = "ar";

export const hasLocale = (value: string): value is Locale => (locales as readonly string[]).includes(value);

export const dir = (locale: Locale) => (locale === "ar" ? "rtl" : "ltr");

/** Cookie that remembers the language a visitor picked */
export const LOCALE_COOKIE = "NEXT_LOCALE";
