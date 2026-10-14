/**
 * Renders every challenge's reference solution to its target image, then the
 * share cards (the images shown when a link is shared) for the site and every
 * challenge, in both languages:
 *   public/targets/<slug>.png              + src/data/targets.json (slug → version)
 *   public/og/<locale>/site.png
 *   public/og/<locale>/challenges/<slug>.png + src/data/og.json (path → version)
 *
 *   npm run targets
 *
 * Needs Node 22.18+ (it loads the TypeScript data file directly) and
 * Playwright's Chromium (`npx playwright install chromium`, once).
 * Set CHROMIUM_PATH to use a Chromium that's already installed.
 */
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { launchChallenges, targetVersion, tracks } from "../src/data/challenge-list.ts";
import ar from "../src/i18n/dictionaries/ar.json" with { type: "json" };
import en from "../src/i18n/dictionaries/en.json" with { type: "json" };
import { previewDocument } from "../src/lib/match/document.ts";
import { CARD_FONTS, CARD_HEIGHT, CARD_WIDTH, cardFontCss, cardVersion, shareCardHtml } from "../src/lib/og/card.ts";
import { staticCards } from "../src/lib/og/cards.ts";

const root = new URL("../", import.meta.url);
const publicDir = new URL("public/", root);
const outDir = new URL("targets/", publicDir);
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const versions = {};
const cardVersions = {};
try {
  for (const c of launchChallenges) {
    const page = await browser.newPage({ viewport: { width: c.width, height: c.height }, deviceScaleFactor: 1 });
    await page.setContent(previewDocument(c.reference));
    await writeFile(new URL(`${c.slug}.png`, outDir), await page.screenshot());
    await page.close();
    versions[c.slug] = targetVersion(c);
    console.log(`✓ ${c.slug}`);
  }

  // share cards (they show the targets, so they come second)
  const fontCss = cardFontCss(await Promise.all(CARD_FONTS.map(async (f) => (await readFile(new URL(f.file, root))).toString("base64"))));
  const imageVersions = Object.fromEntries(Object.entries(versions).map(([slug, v]) => [`/targets/${slug}.png`, v]));
  const dataUrl = async (path) => `data:image/png;base64,${(await readFile(new URL(path.slice(1), publicDir))).toString("base64")}`;
  await rm(new URL("og/", publicDir), { recursive: true, force: true });

  const page = await browser.newPage({ viewport: { width: CARD_WIDTH, height: CARD_HEIGHT }, deviceScaleFactor: 1 });
  for (const { path, card } of staticCards({ ar, en }, launchChallenges, tracks)) {
    const images = {};
    for (const p of [card.image, ...(card.images ?? [])].filter(Boolean)) images[p] = await dataUrl(p);
    await page.setContent(shareCardHtml(card, { fontCss, resolveImage: (p) => images[p] }));
    await page.evaluate(() => document.fonts.ready);
    const file = new URL(path.slice(1), publicDir);
    await mkdir(new URL("./", file), { recursive: true });
    await writeFile(file, await page.screenshot());
    cardVersions[path] = cardVersion(card, imageVersions);
  }
  console.log(`✓ ${Object.keys(cardVersions).length} share cards`);
} finally {
  await browser.close();
}

// drop images of challenges that no longer exist
for (const file of await readdir(outDir)) {
  if (file.endsWith(".png") && !(file.slice(0, -4) in versions)) {
    await rm(new URL(file, outDir));
    console.log(`✗ removed ${file}`);
  }
}

const sorted = (o) => `${JSON.stringify(Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b))), null, 2)}\n`;
await writeFile(new URL("src/data/targets.json", root), sorted(versions));
await writeFile(new URL("src/data/og.json", root), sorted(cardVersions));
console.log(`\n${launchChallenges.length} targets written.`);
