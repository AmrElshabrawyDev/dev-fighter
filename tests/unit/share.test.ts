import { readdirSync, readFileSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { launchChallenges, tracks } from "@/data/challenge-list";
import og from "@/data/og.json";
import targets from "@/data/targets.json";
import ar from "@/i18n/dictionaries/ar.json";
import en from "@/i18n/dictionaries/en.json";
import { CARD_HEIGHT, CARD_WIDTH, cardVersion, shareCardHtml } from "@/lib/og/card";
import { cardImage, playerCard, staticCards, type PlayerSummary } from "@/lib/og/cards";
import { avatarDataUrl, renderPlayerCard } from "@/lib/og/render";
import { shutdownBrowser } from "@/lib/scoring/render";

const publicDir = new URL("../../public/", import.meta.url);

function pngSize(bytes: Buffer) {
  expect(bytes.subarray(1, 4).toString("ascii")).toBe("PNG");
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

const cards = staticCards({ ar, en }, launchChallenges, tracks);
const imageVersions = Object.fromEntries(Object.entries(targets).map(([slug, v]) => [`/targets/${slug}.png`, v]));

describe("pre-drawn share cards", () => {
  it("exist for the site and every challenge, in both languages", () => {
    expect(cards).toHaveLength(2 * (1 + launchChallenges.length));
    expect(cards.map((c) => c.path)).toContain(cardImage.site("ar"));
    expect(cards.map((c) => c.path)).toContain(cardImage.challenge("en", launchChallenges[0].slug));
    // and nothing else is lying around in public/og
    const files = ["ar", "en"].flatMap((l) => [
      ...readdirSync(new URL(`og/${l}/`, publicDir)).filter((f) => f.endsWith(".png")).map((f) => `/og/${l}/${f}`),
      ...readdirSync(new URL(`og/${l}/challenges/`, publicDir)).map((f) => `/og/${l}/challenges/${f}`),
    ]);
    expect(files.sort()).toEqual(cards.map((c) => c.path).sort());
  });

  it.each(cards.map((c) => [c.path, c] as const))("%s is up to date and 1200×630", (path, { card }) => {
    // a title, a label or the card design changed without `npm run targets`
    expect(og[path as keyof typeof og], `${path} is stale: run npm run targets`).toBe(cardVersion(card, imageVersions));
    expect(pngSize(readFileSync(new URL(path.slice(1), publicDir)))).toEqual([CARD_WIDTH, CARD_HEIGHT]);
  });

  it("show each challenge's title, track, difficulty and skill in the card's language", () => {
    const leaf = launchChallenges.find((c) => c.slug === "leaf")!;
    const { card } = cards.find((c) => c.path === cardImage.challenge("ar", "leaf"))!;
    expect(card).toMatchObject({ kind: "challenge", locale: "ar", title: leaf.title.ar, image: "/targets/leaf.png", size: "400×300" });
    const html = shareCardHtml(card, { fontCss: "", resolveImage: (p) => p });
    for (const text of [leaf.title.ar, tracks.find((t) => t.slug === leaf.track)!.title.ar, ar.challenges.difficulty[leaf.difficulty], leaf.skill]) {
      expect(html).toContain(text);
    }
    expect(html).toContain('<html lang="ar" dir="rtl">');
  });
});

const player: PlayerSummary = {
  username: "amr-dev",
  displayName: "عمرو",
  avatarUrl: null,
  totalScore: 12345,
  rank: 7,
  perfect: 9,
  played: 11,
  solved: launchChallenges.slice(0, 8).map((c) => c.slug),
};

describe("player cards", () => {
  it("show the player's numbers, and at most six of their solved targets", () => {
    const card = playerCard("en", en, player, null);
    expect(card).toMatchObject({ kind: "player", name: "عمرو", username: "amr-dev", avatar: null });
    if (card.kind !== "player") throw new Error();
    expect(card.stats.map((s) => s.value)).toEqual(["12,345", "#7", "9", "11"]);
    expect(card.images).toHaveLength(6);
  });

  it("say so when nothing is solved yet, and have no rank before playing", () => {
    const card = playerCard("ar", ar, { ...player, rank: null, solved: [], played: 0, perfect: 0, totalScore: 0 }, null);
    const html = shareCardHtml(card, { fontCss: "", resolveImage: (p) => p });
    expect(html).toContain(ar.share.empty);
    expect(html).toContain("—");
  });

  it("can't be broken by a player's name", () => {
    const html = shareCardHtml(playerCard("en", en, { ...player, displayName: '<img src=x onerror="alert(1)">' }, null), {
      fontCss: "",
      resolveImage: (p) => p,
    });
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  });

  it("only fetch avatars from the sign-in providers, over https", async () => {
    for (const url of [null, "http://avatars.githubusercontent.com/u/1", "https://example.com/a.png", "https://127.0.0.1/a.png", "not a url"]) {
      expect(await avatarDataUrl(url)).toBeNull();
    }
  });

  describe("drawn in the official renderer", () => {
    afterAll(shutdownBrowser);

    it("come out as a 1200×630 PNG", async () => {
      const png = await renderPlayerCard("ar", ar, player);
      expect(pngSize(png)).toEqual([CARD_WIDTH, CARD_HEIGHT]);
      expect(png.length).toBeGreaterThan(20_000); // a real picture, not an empty page
    });
  });
});
