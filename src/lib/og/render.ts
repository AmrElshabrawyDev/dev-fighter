import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { renderHtml } from "@/lib/scoring/render";
import { CARD_FONTS, CARD_HEIGHT, CARD_WIDTH, cardFontCss, shareCardHtml } from "./card";
import { playerCard, type PlayerSummary } from "./cards";

// Player cards are drawn on request (their scores change), by the same headless
// Chromium that scores submissions. Fonts and target images are read from disk
// (see outputFileTracingIncludes in next.config.ts) and inlined.

const root = process.cwd();
let fontCss: Promise<string> | null = null;
const loadFonts = () =>
  (fontCss ??= Promise.all(CARD_FONTS.map(async (f) => (await readFile(join(/*turbopackIgnore: true*/ root, f.file))).toString("base64"))).then(cardFontCss));

const dataUrl = async (publicPath: string) =>
  `data:image/png;base64,${(await readFile(join(/*turbopackIgnore: true*/ root, "public", publicPath))).toString("base64")}`;

// only the avatar hosts sign-in uses; anything else just gets the initial
const AVATAR_HOSTS = new Set(["avatars.githubusercontent.com", "lh3.googleusercontent.com"]);
const AVATAR_MAX_BYTES = 512 * 1024;

/** The player's avatar as a data: URL (the card's browser may not load anything), or null */
export async function avatarDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || !AVATAR_HOSTS.has(parsed.hostname)) return null;
    const response = await fetch(parsed, { signal: AbortSignal.timeout(2_000), redirect: "error" });
    const type = response.headers.get("content-type") ?? "";
    if (!response.ok || !/^image\/(png|jpeg|gif|webp)$/.test(type)) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > AVATAR_MAX_BYTES) return null;
    return `data:${type};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

/** A player's share card as a PNG */
export async function renderPlayerCard(locale: Locale, dict: Dictionary, player: PlayerSummary): Promise<Buffer> {
  const card = playerCard(locale, dict, player, await avatarDataUrl(player.avatarUrl));
  const images = Object.fromEntries(await Promise.all(card.kind === "player" ? card.images.map(async (p) => [p, await dataUrl(p)]) : []));
  const html = shareCardHtml(card, { fontCss: await loadFonts(), resolveImage: (p) => images[p] ?? "" });
  return renderHtml(html, CARD_WIDTH, CARD_HEIGHT);
}
