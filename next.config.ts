import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // the Supabase end-to-end tests build into their own folder (see playwright.supabase.config.ts)
  distDir: process.env.NEXT_DIST_DIR || ".next",
  cacheComponents: true,
  // Official scoring runs headless Chromium in the challenge page's server action.
  // On Vercel that's @sparticuz/chromium, whose browser files are loaded at
  // runtime, so file tracing can't see them: include them for that route only.
  outputFileTracingIncludes: {
    "/\\[lang\\]/challenges/\\[slug\\]": ["./node_modules/@sparticuz/chromium/bin/**/*"],
  },
  partialPrefetching: true,
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
