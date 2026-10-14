import type { Page } from "@playwright/test";
import { challenges, expect, test } from "./fixtures";

const head = (page: Page, selector: string, attribute = "content") => page.locator(`head ${selector}`).first().getAttribute(attribute);
const pathOf = (url: string | null) => new URL(url!).pathname;

test("a challenge page has its own address in each language and its own share card", async ({ page, request }) => {
  const c = challenges.find((x) => x.slug === "twin-moons")!;
  await page.goto(`/ar/challenges/${c.slug}`);
  await expect(page).toHaveTitle(`${c.title.ar} · Dev Fighter`);

  expect(pathOf(await head(page, 'link[rel="canonical"]', "href"))).toBe(`/ar/challenges/${c.slug}`);
  expect(pathOf(await head(page, 'link[rel="alternate"][hreflang="en"]', "href"))).toBe(`/en/challenges/${c.slug}`);
  expect(pathOf(await head(page, 'link[rel="alternate"][hreflang="x-default"]', "href"))).toBe(`/ar/challenges/${c.slug}`);
  expect(await head(page, 'meta[property="og:title"]')).toBe(`${c.title.ar} · Dev Fighter`);
  expect(await head(page, 'meta[name="twitter:card"]')).toBe("summary_large_image");

  // the card is a real 1200×630 image
  const image = pathOf(await head(page, 'meta[property="og:image"]'));
  expect(image).toBe(`/og/ar/challenges/${c.slug}.png`);
  const png = await (await request.get(image)).body();
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);

  // structured data for search engines
  const data = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  expect(data).toMatchObject({ "@type": "LearningResource", name: c.title.ar, teaches: c.skill, inLanguage: "ar" });
});

test("the home page shares the site's card and describes the site", async ({ page }) => {
  await page.goto("/en");
  expect(pathOf(await head(page, 'meta[property="og:image"]'))).toBe("/og/en/site.png");
  expect(pathOf(await head(page, 'link[rel="canonical"]', "href"))).toBe("/en");
  const data = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  expect(data).toMatchObject({ "@type": "WebSite", name: "Dev Fighter", inLanguage: "en" });
});

test("every page in the sitemap is there, and calls itself by the same address", async ({ request }) => {
  test.setTimeout(120_000);
  const xml = await (await request.get("/sitemap.xml")).text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => pathOf(m[1]));
  expect(urls).toHaveLength(2 * (5 + 4 + challenges.length));
  for (const path of urls) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    const canonical = (await response.text()).match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    expect(pathOf(canonical ?? null), path).toBe(path);
  }
});

test("robots.txt keeps sign-in out of search and points at the sitemap", async ({ request }) => {
  const text = await (await request.get("/robots.txt")).text();
  expect(text).toContain("Disallow: /ar/login");
  expect(text).toContain("Disallow: /auth/");
  expect(text).toMatch(/Sitemap: https?:\/\/[^\s]+\/sitemap\.xml/);
});

test("the sign-in page isn't indexed", async ({ page }) => {
  await page.goto("/en/login");
  expect(await head(page, 'meta[name="robots"]')).toMatch(/noindex/);
});

test("sharing a challenge copies a message with its link", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => Object.defineProperty(navigator, "share", { value: undefined })); // no share sheet: copy
  const c = challenges.find((x) => x.slug === "leaf")!;
  await page.goto(`/en/challenges/${c.slug}`);
  const share = page.getByTestId("share").first();
  await share.getByRole("button", { name: "Share" }).click();
  await expect(share.getByRole("button", { name: "Link copied" })).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toMatch(new RegExp(`^“${c.title.en}” on Dev Fighter: can you draw it with the shortest CSS\\?\\nhttps?://[^/]+/en/challenges/${c.slug}$`));

  const whatsapp = new URL((await share.getByRole("link", { name: "WhatsApp" }).getAttribute("href"))!);
  expect(whatsapp.host).toBe("wa.me");
  expect(whatsapp.searchParams.get("text")).toBe(copied);
});
