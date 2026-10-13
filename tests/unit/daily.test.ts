import { describe, expect, it } from "vitest";
import { launchChallenges } from "@/data/challenge-list";
import { dailySlug, dayNumber } from "@/data/daily";

const slugs = launchChallenges.map((c) => c.slug);
const at = (iso: string) => new Date(iso);

describe("the daily challenge", () => {
  it("is a real challenge, the same all day", () => {
    const morning = dailySlug(at("2026-10-13T06:00:00+03:00"), slugs);
    expect(slugs).toContain(morning);
    expect(dailySlug(at("2026-10-13T00:00:00+03:00"), slugs)).toBe(morning);
    expect(dailySlug(at("2026-10-13T23:59:59+03:00"), slugs)).toBe(morning);
  });

  it("changes at midnight Mecca time (UTC+3)", () => {
    expect(dayNumber(at("2026-10-13T23:59:59+03:00")) + 1).toBe(dayNumber(at("2026-10-14T00:00:00+03:00")));
    expect(dailySlug(at("2026-10-13T23:59:59+03:00"), slugs)).not.toBe(dailySlug(at("2026-10-14T00:00:00+03:00"), slugs));
  });

  it("goes through every challenge before repeating one", () => {
    const start = at("2026-10-13T12:00:00+03:00").getTime();
    const run = Array.from({ length: slugs.length }, (_, i) => dailySlug(new Date(start + i * 86_400_000), slugs));
    expect(new Set(run).size).toBe(slugs.length);
  });

  it("doesn't depend on the order challenges are listed in", () => {
    const day = at("2026-10-13T12:00:00+03:00");
    expect(dailySlug(day, [...slugs].reverse())).toBe(dailySlug(day, slugs));
  });
});
