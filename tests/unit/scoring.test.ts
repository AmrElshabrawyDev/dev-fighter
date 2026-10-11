import { readFileSync } from "node:fs";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { afterAll, describe, expect, it } from "vitest";
import { launchChallenges } from "@/data/challenge-list";
import { MATCH_THRESHOLD } from "@/lib/match/settings";
import { officialAccuracy, renderPixels, shutdownBrowser } from "@/lib/scoring/render";
import { countChars, MAX_SCORE, scoreFor } from "@/lib/scoring/score";

describe("scoreFor", () => {
  it("gives up to 600 below a perfect match, falling steeply", () => {
    expect(scoreFor(0, 100, 100)).toBe(0);
    expect(scoreFor(0.5, 100, 100)).toBe(38);
    expect(scoreFor(0.9, 100, 100)).toBe(394);
    expect(scoreFor(0.99, 100, 100)).toBe(576);
    expect(scoreFor(0.99999, 100, 100)).toBe(600);
  });

  it("adds a length bonus only for a perfect match", () => {
    expect(scoreFor(1, 100, 100)).toBe(MAX_SCORE); // as short as par
    expect(scoreFor(1, 50, 100)).toBe(MAX_SCORE); // shorter than par: still the full bonus
    expect(scoreFor(1, 200, 100)).toBe(800); // twice par: half the bonus
    expect(scoreFor(1, 400, 100)).toBe(700);
  });

  it("never goes above the maximum or below zero", () => {
    expect(scoreFor(1, 0, 100)).toBe(MAX_SCORE);
    expect(scoreFor(-1, 10, 100)).toBe(0);
  });
});

describe("countChars", () => {
  it("counts characters the way people (and Postgres) do", () => {
    expect(countChars("<i>")).toBe(3);
    expect(countChars("مرحبا")).toBe(5);
    expect(countChars("🎯")).toBe(1);
  });
});

describe("official render (headless Chromium)", () => {
  afterAll(shutdownBrowser);

  it.each(launchChallenges.map((c) => [c.slug, c] as const))("%s: the reference solution scores 100%%", async (_slug, c) => {
    expect(await officialAccuracy(c, c.reference)).toBe(1);
  });

  // the live estimate compares against these PNGs; the server against its own render —
  // both must agree that the reference is a perfect match
  it.each(launchChallenges.map((c) => [c.slug, c] as const))("%s: agrees with the target image the browser compares against", async (_slug, c) => {
    const target = PNG.sync.read(readFileSync(new URL(`../../public/targets/${c.slug}.png`, import.meta.url))).data;
    const pixels = await renderPixels(c.reference, c.width, c.height);
    expect(pixelmatch(pixels, target, null, c.width, c.height, { threshold: MATCH_THRESHOLD })).toBe(0);
  });

  it("scores a partial solution in between, like the live estimate", async () => {
    const hexagon = launchChallenges.find((c) => c.slug === "the-hexagon")!;
    const accuracy = await officialAccuracy(
      hexagon,
      "<div></div><style>body{margin:0;height:100vh;display:grid;place-items:center;background:#1b1b29}div{width:180px;height:200px;background:#89b4fa}</style>",
    );
    expect(accuracy).toBeGreaterThan(0.6);
    expect(accuracy).toBeLessThan(0.95);
  });

  it("never runs the player's JavaScript", async () => {
    const square = launchChallenges[0];
    const plain = await renderPixels("", square.width, square.height);
    const script = await renderPixels("<script>document.documentElement.style.background='red'</script>", square.width, square.height);
    expect(Buffer.from(script).equals(Buffer.from(plain))).toBe(true);
  });
});
