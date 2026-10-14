import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { launchChallenges, tracks } from "@/data/challenge-list";
import { pageMetadata } from "@/lib/seo";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("page metadata", () => {
  const meta = pageMetadata({ locale: "en", path: "/tips", title: "Tips", description: "Shorter code", siteTitle: "Dev Fighter — CSS" });

  it("points at the page in each language, Arabic by default", () => {
    expect(meta.alternates).toEqual({
      canonical: "/en/tips",
      languages: { ar: "/ar/tips", en: "/en/tips", "x-default": "/ar/tips" },
    });
  });

  it("shares with the site's card unless the page has its own", () => {
    expect(meta.openGraph).toMatchObject({
      title: "Tips · Dev Fighter",
      url: "/en/tips",
      locale: "en_US",
      alternateLocale: ["ar_AR"],
      images: [{ url: "/og/en/site.png", width: 1200, height: 630 }],
    });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });

    const own = pageMetadata({ locale: "ar", path: "/challenges/leaf", title: "ورقة", description: "…", siteTitle: "x", image: { url: "/og/ar/challenges/leaf.png", alt: "ورقة" } });
    expect(own.openGraph?.images).toEqual([{ url: "/og/ar/challenges/leaf.png", width: 1200, height: 630, alt: "ورقة" }]);
  });
});

describe("sitemap", () => {
  const entries = sitemap();

  it("lists every public page in both languages", () => {
    const pages = 5 + tracks.length + launchChallenges.length;
    expect(entries).toHaveLength(pages * 2);
    const urls = entries.map((e) => new URL(e.url).pathname);
    for (const path of ["/ar", "/en/challenges", "/ar/tips", "/en/leaderboard", "/ar/tracks/shapes", `/en/challenges/${launchChallenges[0].slug}`]) {
      expect(urls).toContain(path);
    }
    expect(urls.some((u) => u.includes("/login") || u.includes("/daily"))).toBe(false);
  });

  it("links each page to its other language, with absolute URLs", () => {
    for (const entry of entries) {
      expect(entry.url).toMatch(/^https?:\/\//);
      const languages = entry.alternates!.languages as Record<string, string>;
      expect(new URL(languages.ar).pathname.replace(/^\/ar/, "")).toBe(new URL(languages.en).pathname.replace(/^\/en/, ""));
    }
  });
});

describe("robots.txt", () => {
  it("keeps sign-in pages out of search and points at the sitemap", () => {
    const rules = robots();
    expect(rules.rules).toMatchObject({ userAgent: "*", allow: "/", disallow: ["/auth/", "/ar/login", "/en/login"] });
    expect(rules.sitemap).toMatch(/^https?:\/\/[^/]+\/sitemap\.xml$/);
  });
});

describe("site address", () => {
  it("is the configured domain, then Vercel's production domain, then localhost", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://devfighter.example");
    expect((await import("@/lib/site")).absoluteUrl("/ar")).toBe("https://devfighter.example/ar");

    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "dev-fighter.vercel.app");
    expect((await import("@/lib/site")).siteUrl.origin).toBe("https://dev-fighter.vercel.app");

    vi.resetModules();
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    expect((await import("@/lib/site")).siteUrl.origin).toBe("http://localhost:3000");
  });
});
