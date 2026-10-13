import { afterAll, describe, expect, it } from "vitest";
import { launchChallenges, tracks } from "@/data/challenge-list";
import { revealHint, revealSolution } from "@/lib/actions/learning";
import { shutdownBrowser } from "@/lib/scoring/render";

const rank = { easy: 0, medium: 1, hard: 2 };

describe("tracks", () => {
  it.each(tracks.map((t) => [t.slug, t] as const))("%s has challenges, from easiest to hardest", (_slug, track) => {
    const list = launchChallenges.filter((c) => c.track === track.slug);
    expect(list.length).toBeGreaterThanOrEqual(3);
    const levels = list.map((c) => rank[c.difficulty]);
    expect(levels).toEqual([...levels].sort());
  });

  it("every challenge belongs to a track and has hints, an explanation and a skill", () => {
    for (const c of launchChallenges) {
      expect(tracks.map((t) => t.slug)).toContain(c.track);
      expect(c.hints.length).toBeGreaterThanOrEqual(1);
      expect(c.hints.length).toBeLessThanOrEqual(3);
      expect(c.explanation.ar.length).toBeGreaterThan(40);
      expect(c.explanation.en.length).toBeGreaterThan(40);
      expect(c.skill.trim()).not.toBe("");
    }
  });

  it("challenges have no text in them (fonts differ between systems)", () => {
    for (const c of launchChallenges) {
      const html = c.reference.replace(/<style>[\s\S]*?(<\/style>|$)/g, "");
      expect(html.replace(/<[^>]*>/g, "").trim(), c.slug).toBe("");
    }
  });
});

// without Supabase (as in these tests): hints are free, the solution needs a real 100% match
describe("hints and solutions (server actions)", () => {
  afterAll(shutdownBrowser);
  const leaf = launchChallenges.find((c) => c.slug === "leaf")!;

  it("hands out a hint in the asked language", async () => {
    expect(await revealHint("leaf", 0, "ar")).toEqual({ ok: true, text: leaf.hints[0].ar, opened: 1 });
    expect(await revealHint("leaf", 1, "en")).toEqual({ ok: true, text: leaf.hints[1].en, opened: 2 });
  });

  it("refuses hints that don't exist", async () => {
    expect(await revealHint("leaf", leaf.hints.length, "ar")).toEqual({ ok: false, error: "unknown" });
    expect(await revealHint("leaf", -1, "ar")).toEqual({ ok: false, error: "unknown" });
    expect(await revealHint("no-such-challenge", 0, "ar")).toEqual({ ok: false, error: "unknown" });
  });

  it("keeps the solution locked until the code really matches", async () => {
    expect(await revealSolution("leaf", "<div></div>", "ar")).toEqual({ ok: false, error: "not-solved" });
    const almost = leaf.reference.replace("border-radius:150px 0", "border-radius:140px 0");
    expect(await revealSolution("leaf", almost, "ar")).toEqual({ ok: false, error: "not-solved" });
  });

  it("opens it for a 100% match — any code that draws the same picture", async () => {
    expect(await revealSolution("leaf", leaf.reference, "en")).toEqual({ ok: true, reference: leaf.reference, explanation: leaf.explanation.en });
    const shorter = "<p><style>body{margin:0;height:100vh;display:grid;place-items:center;background:#1b1b29}p{margin:0;width:150px;height:150px;border-radius:150px 0;background:#a6e3a1}";
    expect((await revealSolution("leaf", shorter, "ar")).ok).toBe(true);
  });
});
