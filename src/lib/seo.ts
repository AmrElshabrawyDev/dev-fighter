import "server-only";
import type { Metadata } from "next";
import { locales, type Locale } from "@/i18n/config";
import { cardImage } from "@/lib/og/cards";

type Page = {
  locale: Locale;
  /** the path after the locale: "" for the home page, "/challenges", … */
  path: string;
  /** without the " · Dev Fighter" suffix; leave out for the site's own title */
  title?: string;
  description: string;
  /** the share image (1200×630), by default the site's card */
  image?: { url: string; alt: string };
  /** shown when the title is left out */
  siteTitle: string;
  type?: "website" | "profile";
};

const ogLocale = { ar: "ar_AR", en: "en_US" } as const;

/**
 * A page's metadata: title, description, its address in each language
 * (canonical + hreflang), and how it looks when shared (Open Graph, X).
 */
export function pageMetadata({ locale, path, title, description, image, siteTitle, type = "website" }: Page): Metadata {
  const url = `/${locale}${path}`;
  const shareTitle = title ? `${title} · Dev Fighter` : siteTitle;
  const images = [{ url: image?.url ?? cardImage.site(locale), width: 1200, height: 630, alt: image?.alt ?? siteTitle }];
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: { ...Object.fromEntries(locales.map((l) => [l, `/${l}${path}`])), "x-default": `/ar${path}` },
    },
    openGraph: {
      type,
      siteName: "Dev Fighter",
      title: shareTitle,
      description,
      url,
      locale: ogLocale[locale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => ogLocale[l]),
      images,
    },
    twitter: { card: "summary_large_image", title: shareTitle, description, images },
  };
}
