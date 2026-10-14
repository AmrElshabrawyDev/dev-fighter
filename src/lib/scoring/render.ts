import "server-only";
import pixelmatch from "pixelmatch";
import { chromium, type Browser, type BrowserContext } from "playwright-core";
import { PNG } from "pngjs";
import type { Challenge } from "@/data/challenge-list";
import { previewDocument } from "@/lib/match/document";
import { MATCH_THRESHOLD } from "@/lib/match/settings";

/**
 * The official render: the player's code in headless Chromium with JavaScript
 * off and the network cut, compared pixel by pixel with the reference solution
 * rendered by the same browser.
 *
 * Browser: @sparticuz/chromium on Vercel/AWS Lambda; elsewhere Playwright's
 * Chromium (`npx playwright install chromium`) or CHROMIUM_PATH.
 */

// Vercel's Chromium runs as a single process: closing its last context closes
// the browser. So each browser gets one shared context, and every render its own page.
type Renderer = { browser: Browser; context: BrowserContext };
let renderer: Promise<Renderer> | null = null;

// flags the serverless Chromium sets that would loosen web security; never needed here
const UNSAFE_FLAGS = new Set(["--disable-web-security", "--allow-running-insecure-content"]);

async function launch(): Promise<Renderer> {
  let browser: Browser;
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const lambda = (await import("@sparticuz/chromium")).default;
    browser = await chromium.launch({
      executablePath: await lambda.executablePath(),
      args: lambda.args.filter((flag) => !UNSAFE_FLAGS.has(flag)),
      headless: true,
    });
  } else {
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  }
  const context = await browser.newContext({ deviceScaleFactor: 1, javaScriptEnabled: false, offline: true });
  await context.route("**/*", (route) => route.abort()); // nothing may load, not even same-page URLs
  return { browser, context };
}

/** One browser per server process, relaunched if it crashes */
function getRenderer(): Promise<Renderer> {
  if (!renderer) {
    renderer = launch().then(
      (r) => {
        r.browser.on("disconnected", () => (renderer = null));
        return r;
      },
      (error) => {
        renderer = null;
        throw error;
      },
    );
  }
  return renderer;
}

/** Close the shared browser (tests, or a server shutting down) */
export async function shutdownBrowser(): Promise<void> {
  const open = renderer;
  renderer = null;
  targets.clear();
  if (open) await (await open).browser.close();
}

const RENDER_TIMEOUT = 5_000;

/** Render code at width×height and return its RGBA pixels */
export async function renderPixels(code: string, width: number, height: number): Promise<Uint8Array> {
  const { context } = await getRenderer();
  const page = await context.newPage();
  try {
    await page.setViewportSize({ width, height });
    await page.setContent(previewDocument(code), { waitUntil: "load", timeout: RENDER_TIMEOUT });
    const png = await page.screenshot({ type: "png", timeout: RENDER_TIMEOUT });
    return PNG.sync.read(png).data;
  } finally {
    await page.close();
  }
}

/** Screenshot a whole HTML page (share cards) as a PNG */
export async function renderHtml(html: string, width: number, height: number): Promise<Buffer> {
  const { context } = await getRenderer();
  const page = await context.newPage();
  try {
    await page.setViewportSize({ width, height });
    await page.setContent(html, { waitUntil: "load", timeout: RENDER_TIMEOUT });
    return await page.screenshot({ type: "png", timeout: RENDER_TIMEOUT });
  } finally {
    await page.close();
  }
}

// reference renders, kept per process (they only change with a new deploy)
const targets = new Map<string, Promise<Uint8Array>>();

function targetPixels(challenge: Challenge): Promise<Uint8Array> {
  let pixels = targets.get(challenge.slug);
  if (!pixels) {
    pixels = renderPixels(challenge.reference, challenge.width, challenge.height);
    pixels.catch(() => targets.delete(challenge.slug));
    targets.set(challenge.slug, pixels);
  }
  return pixels;
}

/** The official accuracy, 0…1 */
export async function officialAccuracy(challenge: Challenge, code: string): Promise<number> {
  const { width, height } = challenge;
  const [output, target] = await Promise.all([renderPixels(code, width, height), targetPixels(challenge)]);
  const mismatched = pixelmatch(output, target, null, width, height, { threshold: MATCH_THRESHOLD });
  return 1 - mismatched / (width * height);
}
