import { describe, expect, it } from "vitest";
import { tips } from "@/data/tips";

describe("tips", () => {
  it("have unique, URL-safe slugs (they're the page anchors)", () => {
    const slugs = tips.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it.each(tips.map((t) => [t.slug, t] as const))("%s has Arabic and English text", (_slug, tip) => {
    for (const field of [tip.title, tip.text, ...(tip.note ? [tip.note] : [])]) {
      expect(field.ar.trim()).not.toBe("");
      expect(field.en.trim()).not.toBe("");
      expect(field.ar).toMatch(/[؀-ۿ]/);
    }
  });

  it.each(tips.map((t) => [t.slug, t] as const))("%s really makes the code shorter", (_slug, tip) => {
    expect(tip.after.length).toBeLessThan(tip.before.length);
  });
});
