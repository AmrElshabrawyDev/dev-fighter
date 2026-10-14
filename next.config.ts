import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // the Supabase end-to-end tests build into their own folder (see playwright.supabase.config.ts)
  distDir: process.env.NEXT_DIST_DIR || ".next",
  cacheComponents: true,
  // Headless Chromium runs in two places: official scoring (the challenge page's
  // server action) and players' share cards. On Vercel that's @sparticuz/chromium,
  // whose browser files are loaded at runtime, so file tracing can't see them:
  // include them for those routes only — the cards also read fonts and targets.
  outputFileTracingIncludes: {
    "/\\[lang\\]/challenges/\\[slug\\]": ["./node_modules/@sparticuz/chromium/bin/**/*"],
    "/\\[lang\\]/u/\\[username\\]/card.png": [
      "./node_modules/@sparticuz/chromium/bin/**/*",
      "./node_modules/@fontsource-variable/cairo/files/cairo-{arabic,latin}-wght-normal.woff2",
      "./node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
      "./public/targets/*.png",
    ],
  },
  partialPrefetching: true,
  // target images and share cards only change with `npm run targets` (and a deploy):
  // browsers and CDNs may keep them for a day, then check back in the background
  async headers() {
    return ["/targets/:file*", "/og/:path*"].map((source) => ({
      source,
      headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
    }));
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
