import type { MetadataRoute } from "next";
import { absoluteUrl, siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // sign-in pages and the OAuth round trip aren't content
      disallow: ["/auth/", "/ar/login", "/en/login"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl.origin,
  };
}
