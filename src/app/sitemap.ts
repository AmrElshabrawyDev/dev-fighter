import type { MetadataRoute } from "next";
import { challenges, tracks } from "@/data/challenges";
import { locales } from "@/i18n/config";
import { absoluteUrl } from "@/lib/site";

/** Every public page, in each language, with links to its other language */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "",
    "/challenges",
    "/tracks",
    "/tips",
    "/leaderboard",
    ...tracks.map((t) => `/tracks/${t.slug}`),
    ...challenges.map((c) => `/challenges/${c.slug}`),
  ];
  return paths.flatMap((path) =>
    locales.map((locale) => ({
      url: absoluteUrl(`/${locale}${path}`),
      changeFrequency: path === "/leaderboard" ? ("daily" as const) : ("weekly" as const),
      priority: path === "" ? 1 : path.startsWith("/challenges/") ? 0.8 : 0.6,
      alternates: { languages: Object.fromEntries(locales.map((l) => [l, absoluteUrl(`/${l}${path}`)])) },
    })),
  );
}
