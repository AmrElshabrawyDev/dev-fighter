/**
 * The site's public address, for links that must be absolute: share images,
 * canonical URLs, the sitemap. Set NEXT_PUBLIC_SITE_URL to your domain; on
 * Vercel it falls back to the project's production domain.
 */
function pickSiteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return new URL(configured);
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return new URL(`https://${vercel}`);
  return new URL("http://localhost:3000");
}

export const siteUrl = pickSiteUrl();

/** An absolute URL on this site */
export const absoluteUrl = (path: string) => new URL(path, siteUrl).toString();
