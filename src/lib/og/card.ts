/**
 * Share cards: the 1200×630 images shown when a link to Dev Fighter is shared
 * (Open Graph / X). Each card is an HTML page drawn by headless Chromium, which
 * lays out Arabic properly (joined letters, right-to-left word order, mixed
 * Arabic and Latin) — the SVG renderers behind next/og don't yet.
 *
 * Plain data in, HTML out, no imports: `npm run targets` uses this file
 * directly to draw the site and challenge cards, and the server uses it for
 * player cards.
 */

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

type Tone = "primary" | "secondary" | "accent" | "warning" | "success" | "info" | "gold" | "muted";

export type CardChip = { text: string; tone?: Tone; mono?: boolean };
export type CardStat = { label: string; value: string; tone?: Tone };

export type ShareCard = {
  locale: "ar" | "en";
  /** small line next to the logo */
  kicker: string;
} & (
  | {
      kind: "site";
      lines: [string, string];
      text: string;
      /** target images (paths under public/) */
      images: string[];
    }
  | {
      kind: "challenge";
      number: number;
      title: string;
      chips: CardChip[];
      prompt: string;
      image: string;
      size: string;
    }
  | {
      kind: "player";
      name: string;
      username: string;
      /** an image URL (a data: URL when rendering), or null for the initial */
      avatar: string | null;
      stats: CardStat[];
      /** targets of challenges they solved */
      images: string[];
      /** shown instead of the images when they haven't solved any yet */
      empty: string;
    }
);

const colors: Record<Tone, string> = {
  primary: "#89b4fa",
  secondary: "#94e2d5",
  accent: "#f38ba8",
  warning: "#fab387",
  success: "#a6e3a1",
  info: "#cba6f7",
  gold: "#f9e2af",
  muted: "#a6adc8",
};

const escape = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const LOGO = `<svg viewBox="0 0 64 64" width="56" height="56"><path d="M32 3 57 17.5v29L32 61 7 46.5v-29z" fill="#11111b" stroke="#89b4fa" stroke-width="4" stroke-linejoin="round"/><path d="m26 22-10 10 10 10" fill="none" stroke="#94e2d5" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="m38 22 10 10-10 10" fill="none" stroke="#f38ba8" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

type Options = {
  /** @font-face rules for "Cairo" and "Mono" (with the fonts inlined) */
  fontCss: string;
  /** turns an image path into something the page can load (a data: URL) */
  resolveImage: (path: string) => string;
};

/** The card as a standalone HTML page, CARD_WIDTH × CARD_HEIGHT */
export function shareCardHtml(card: ShareCard, { fontCss, resolveImage }: Options): string {
  const rtl = card.locale === "ar";
  const img = (path: string, cls: string) => `<img class="${cls}" src="${escape(resolveImage(path))}" alt="">`;

  let body = "";
  if (card.kind === "site") {
    body = `
      <div class="site">
        <div class="col">
          <h1 class="headline">${escape(card.lines[0])}<br><span class="glow">${escape(card.lines[1])}</span></h1>
          <p class="lead">${escape(card.text)}</p>
        </div>
        <div class="fan">${card.images.slice(0, 4).map((p, i) => img(p, `fan-${i}`)).join("")}</div>
      </div>`;
  } else if (card.kind === "challenge") {
    body = `
      <div class="challenge">
        <div class="col">
          <p class="number">#${String(card.number).padStart(2, "0")}</p>
          <h1 class="title">${escape(card.title)}</h1>
          <p class="chips">${card.chips
            .map((c) => `<span class="chip${c.mono ? " mono" : ""}" style="color:${colors[c.tone ?? "muted"]}">${escape(c.text)}</span>`)
            .join("")}</p>
          <p class="prompt">${escape(card.prompt)}</p>
        </div>
        <figure class="frame">${img(card.image, "target")}<figcaption class="mono">${escape(card.size)}</figcaption></figure>
      </div>`;
  } else {
    const avatar = card.avatar
      ? `<img class="avatar" src="${escape(card.avatar)}" alt="">`
      : `<span class="avatar initial">${escape([...card.name][0] ?? "?")}</span>`;
    body = `
      <div class="player">
        <div class="col">
          <div class="who">${avatar}<div><h1 class="name"><bdi>${escape(card.name)}</bdi></h1><p class="handle mono"><bdi>@${escape(card.username)}</bdi></p></div></div>
          <div class="stats">${card.stats
            .map((s) => `<div class="stat"><b class="mono" style="color:${colors[s.tone ?? "muted"]}">${escape(s.value)}</b><span>${escape(s.label)}</span></div>`)
            .join("")}</div>
        </div>
        ${
          card.images.length
            ? `<div class="solved">${card.images.slice(0, 6).map((p) => img(p, "thumb")).join("")}</div>`
            : `<p class="empty">${escape(card.empty)}</p>`
        }
      </div>`;
  }

  return `<!doctype html>
<html lang="${card.locale}" dir="${rtl ? "rtl" : "ltr"}">
<meta charset="utf-8">
<style>
${fontCss}
* { box-sizing: border-box; margin: 0; }
html, body { width: ${CARD_WIDTH}px; height: ${CARD_HEIGHT}px; overflow: hidden; }
body {
  font-family: "Cairo", sans-serif; color: #cdd6f4; background: #11111b;
  background-image:
    radial-gradient(600px 400px at ${rtl ? "100%" : "0%"} 0%, #89b4fa22, transparent 70%),
    radial-gradient(500px 360px at ${rtl ? "0%" : "100%"} 100%, #f38ba81c, transparent 70%),
    linear-gradient(#ffffff08 1px, transparent 1px), linear-gradient(90deg, #ffffff08 1px, transparent 1px);
  background-size: auto, auto, 40px 40px, 40px 40px;
  padding: 44px 64px 48px; display: flex; flex-direction: column;
}
.mono { font-family: "Mono", monospace; }
header { display: flex; align-items: center; gap: 16px; }
.brand { font-family: "Mono", monospace; font-size: 30px; font-weight: 700; letter-spacing: -0.5px; direction: ltr; }
.brand span { color: #89b4fa; }
.kicker { margin-inline-start: auto; font-size: 22px; color: #a6adc8; border: 1px solid #45475a; border-radius: 999px; padding: 4px 18px; background: #1b1b29; }
main { flex: 1; display: flex; align-items: center; }
main > div { width: 100%; display: flex; align-items: center; gap: 56px; }
.col { flex: 1; min-width: 0; }

.headline { font-size: 60px; font-weight: 900; line-height: 1.25; }
.glow { color: #89b4fa; }
.lead { margin-top: 20px; font-size: 24px; line-height: 1.6; color: #a6adc8; }
.fan { flex: none; display: grid; grid-template-columns: repeat(2, 220px); gap: 18px; }
.fan img { width: 220px; height: 165px; border-radius: 14px; border: 2px solid #45475a; box-shadow: 0 18px 40px #0008; }
.fan-0 { transform: rotate(-3deg); }
.fan-1 { transform: rotate(2deg) translateY(14px); }
.fan-2 { transform: rotate(2deg); }
.fan-3 { transform: rotate(-2deg) translateY(14px); }

.number { font-family: "Mono", monospace; font-size: 28px; color: #7f849c; }
.title { margin-top: 4px; font-size: 76px; font-weight: 900; line-height: 1.15; }
.chips { margin-top: 22px; display: flex; flex-wrap: wrap; gap: 10px; }
.chip { font-size: 22px; background: #232336; border-radius: 8px; padding: 2px 14px; }
.chip.mono { font-family: "Mono", monospace; font-size: 19px; padding: 6px 14px; direction: ltr; unicode-bidi: isolate; }
.prompt { margin-top: 30px; font-size: 30px; font-weight: 700; color: #94e2d5; }
.frame { flex: none; position: relative; padding: 14px; border-radius: 22px; background: #1b1b29; border: 1px solid #45475a; box-shadow: 0 30px 60px #0009; }
.target { display: block; width: 480px; height: 360px; border-radius: 10px; }
.frame figcaption { position: absolute; bottom: -16px; inset-inline-end: 24px; font-size: 18px; color: #a6adc8; background: #232336; border: 1px solid #45475a; border-radius: 8px; padding: 2px 10px; direction: ltr; }

.who { display: flex; align-items: center; gap: 24px; }
.avatar { width: 112px; height: 112px; border-radius: 50%; border: 3px solid #89b4fa; object-fit: cover; flex: none; }
.initial { display: grid; place-items: center; background: #232336; font-size: 52px; font-weight: 900; color: #89b4fa; }
.name { font-size: 56px; font-weight: 900; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 560px; }
.handle { font-size: 24px; color: #7f849c; }
.stats { margin-top: 40px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; max-width: 560px; }
.stat { background: #1b1b29cc; border: 1px solid #45475a; border-radius: 16px; padding: 12px 20px; display: flex; flex-direction: column; }
.stat b { font-size: 40px; line-height: 1.2; }
.stat span { font-size: 20px; color: #a6adc8; }
.solved { flex: none; display: grid; grid-template-columns: repeat(2, 184px); gap: 14px; }
.thumb { width: 184px; height: 138px; border-radius: 12px; border: 2px solid #45475a; }
.empty { flex: none; width: 380px; font-size: 26px; color: #a6adc8; text-align: center; border: 2px dashed #45475a; border-radius: 20px; padding: 60px 28px; }
</style>
<body>
<header>${LOGO}<p class="brand">Dev<span>Fighter</span></p><p class="kicker">${escape(card.kicker)}</p></header>
<main>${body}</main>
</body>
</html>`;
}

// The site's own fonts, inlined into each card (the card's browser may not load anything)
const CAIRO = "node_modules/@fontsource-variable/cairo/files";
const MONO = "node_modules/@fontsource-variable/jetbrains-mono/files";
export const CARD_FONTS = [
  { family: "Cairo", file: `${CAIRO}/cairo-arabic-wght-normal.woff2`, range: "U+0600-06FF,U+0750-077F,U+08A0-08FF,U+200C-200F,U+FB50-FDFF,U+FE70-FEFF" },
  { family: "Cairo", file: `${CAIRO}/cairo-latin-wght-normal.woff2`, range: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2212,U+2215,U+00D7" },
  { family: "Mono", file: `${MONO}/jetbrains-mono-latin-wght-normal.woff2`, range: "U+0000-00FF,U+2000-206F,U+2212,U+00D7" },
] as const;

/** @font-face rules for CARD_FONTS, given each file's contents in base64 (same order) */
export function cardFontCss(base64: string[]): string {
  return CARD_FONTS.map(
    (font, i) =>
      `@font-face { font-family: "${font.family}"; font-weight: 200 1000; src: url(data:font/woff2;base64,${base64[i]}) format("woff2"); unicode-range: ${font.range}; }`,
  ).join("\n");
}

/** A short fingerprint of a card (FNV-1a), so stale card images are caught by the tests */
export function cardVersion(card: ShareCard, imageVersions: Record<string, string>): string {
  const html = shareCardHtml(card, { fontCss: "", resolveImage: (path) => `${path}?v=${imageVersions[path] ?? ""}` });
  let hash = 0x811c9dc5;
  for (const char of html) {
    hash ^= char.codePointAt(0)!;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
