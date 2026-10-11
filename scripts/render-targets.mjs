/**
 * Renders every challenge's reference solution to its target image:
 *   public/targets/<slug>.png  +  src/data/targets.json (slug → version)
 *
 *   npm run targets
 *
 * Needs Node 22.18+ (it loads the TypeScript data file directly) and
 * Playwright's Chromium (`npx playwright install chromium`, once).
 * Set CHROMIUM_PATH to use a Chromium that's already installed.
 */
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { launchChallenges, targetVersion } from "../src/data/challenge-list.ts";
import { previewDocument } from "../src/lib/match/document.ts";

const root = new URL("../", import.meta.url);
const outDir = new URL("public/targets/", root);
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const versions = {};
try {
  for (const c of launchChallenges) {
    const page = await browser.newPage({ viewport: { width: c.width, height: c.height }, deviceScaleFactor: 1 });
    await page.setContent(previewDocument(c.reference));
    await writeFile(new URL(`${c.slug}.png`, outDir), await page.screenshot());
    await page.close();
    versions[c.slug] = targetVersion(c);
    console.log(`✓ ${c.slug}`);
  }
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

const sorted = Object.fromEntries(Object.entries(versions).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(new URL("src/data/targets.json", root), `${JSON.stringify(sorted, null, 2)}\n`);
console.log(`\n${launchChallenges.length} targets written.`);
