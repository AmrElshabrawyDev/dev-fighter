import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { launchChallenges, targetVersion, type Challenge } from "@/data/challenge-list";
import { challenges, getChallenge, targetSrc, toPublic, validateChallenges } from "@/data/challenges";
import targets from "@/data/targets.json";

const targetsDir = new URL("../../public/targets/", import.meta.url);

/** Width and height from a PNG's IHDR header */
function pngSize(file: URL): { width: number; height: number } {
  const bytes = readFileSync(file);
  expect(bytes.subarray(1, 4).toString("ascii")).toBe("PNG");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

const square: Challenge = {
  slug: "test-square",
  type: "shape",
  difficulty: "easy",
  width: 400,
  height: 300,
  title: { ar: "مربع", en: "Square" },
  colors: ["#1b1b29", "#89b4fa"],
  reference: "<div></div><style>body{background:#1b1b29}div{background:#89b4fa}</style>",
  track: "basics",
  skill: "width / height",
  hints: [{ ar: "تلميح", en: "A hint" }],
  explanation: { ar: "شرح", en: "An explanation" },
};
const versionsFor = (c: Challenge) => ({ [c.slug]: targetVersion(c) });

describe("launch challenges", () => {
  it("load and pass the build-time checks", () => {
    expect(challenges.length).toBeGreaterThan(0);
  });

  it.each(launchChallenges.map((c) => [c.slug, c] as const))("%s is well formed", (_slug, c) => {
    expect(c.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(c.title.ar.trim()).not.toBe("");
    expect(c.title.en.trim()).not.toBe("");
    expect(["easy", "medium", "hard"]).toContain(c.difficulty);
    // shapes are 400×300, components are bigger
    if (c.type === "shape") expect([c.width, c.height]).toEqual([400, 300]);
    else expect(c.width).toBeGreaterThan(400);
    for (const color of c.colors) expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(c.reference).toContain("<style>");
  });

  it.each(launchChallenges.map((c) => [c.slug, c] as const))("%s has an up-to-date target image of the right size", (_slug, c) => {
    const file = new URL(`${c.slug}.png`, targetsDir);
    expect(existsSync(file)).toBe(true);
    expect(pngSize(file)).toEqual({ width: c.width, height: c.height });
    expect((targets as Record<string, string>)[c.slug]).toBe(targetVersion(c));
  });

  it("has no leftover target images or versions", () => {
    const slugs = launchChallenges.map((c) => c.slug).sort();
    const pngs = readdirSync(targetsDir).filter((f) => f.endsWith(".png")).map((f) => f.slice(0, -4)).sort();
    expect(pngs).toEqual(slugs);
    expect(Object.keys(targets).sort()).toEqual(slugs);
  });
});

describe("validateChallenges", () => {
  it("accepts a valid challenge", () => {
    expect(validateChallenges([square], versionsFor(square))).toEqual([square]);
  });

  it("rejects a colour listed twice, in any letter case", () => {
    const c = { ...square, colors: ["#1b1b29", "#89b4fa", "#89B4FA"] };
    expect(() => validateChallenges([c], versionsFor(c))).toThrow(/listed twice/);
  });

  it("rejects a colour the reference uses but doesn't list", () => {
    const c = { ...square, reference: `${square.reference}<style>p{color:#f38ba8}</style>` };
    expect(() => validateChallenges([c], versionsFor(c))).toThrow(/#f38ba8 is used but not in its colours/);
  });

  it("ignores 8-digit colours (alpha variations of a listed colour)", () => {
    const c = { ...square, reference: `${square.reference}<style>div{box-shadow:0 0 9px #89b4fa40}</style>` };
    expect(() => validateChallenges([c], versionsFor(c))).not.toThrow();
  });

  it("rejects a missing or outdated target image", () => {
    expect(() => validateChallenges([square], {})).toThrow(/npm run targets/);
    const changed = { ...square, reference: square.reference.replace("div{", "div{margin:0;") };
    expect(() => validateChallenges([changed], versionsFor(square))).toThrow(/outdated/);
  });

  it("rejects two challenges with the same slug", () => {
    expect(() => validateChallenges([square, square], versionsFor(square))).toThrow(/share a slug/);
  });
});

describe("targetVersion", () => {
  it("is stable and 8 hex digits", () => {
    expect(targetVersion(square)).toMatch(/^[0-9a-f]{8}$/);
    expect(targetVersion(square)).toBe(targetVersion({ ...square }));
  });

  it("changes when the reference or the size changes", () => {
    const base = targetVersion(square);
    expect(targetVersion({ ...square, reference: `${square.reference} ` })).not.toBe(base);
    expect(targetVersion({ ...square, width: 401 })).not.toBe(base);
    expect(targetVersion({ ...square, height: 301 })).not.toBe(base);
  });
});

describe("what the browser gets", () => {
  it("never includes the reference solution, the hints or the explanation", () => {
    for (const c of challenges) {
      const shown = toPublic(c);
      expect(shown).not.toHaveProperty("reference");
      expect(shown).not.toHaveProperty("hints");
      expect(shown).not.toHaveProperty("explanation");
      const json = JSON.stringify(shown);
      expect(json).not.toContain(c.reference);
      for (const text of [c.explanation, ...c.hints]) {
        expect(json).not.toContain(text.ar);
        expect(json).not.toContain(text.en);
      }
      expect(shown.hintCount).toBe(c.hints.length);
    }
  });

  it("numbers challenges from 1 and points at the versioned target", () => {
    challenges.forEach((c, i) => {
      const shown = toPublic(c);
      expect(shown.number).toBe(i + 1);
      expect(shown.target).toBe(`/targets/${c.slug}.png?v=${targetVersion(c)}`);
      expect(targetSrc(c)).toBe(shown.target);
    });
  });

  it("finds challenges by slug", () => {
    expect(getChallenge(challenges[0].slug)).toBe(challenges[0]);
    expect(getChallenge("no-such-challenge")).toBeUndefined();
  });
});
