import { describe, expect, it } from "vitest";
import { defaultLocale, dir, hasLocale, locales } from "@/i18n/config";
import ar from "@/i18n/dictionaries/ar.json";
import en from "@/i18n/dictionaries/en.json";
import { pickLocale } from "@/i18n/pick-locale";

/** Every leaf of a dictionary as "path → value" */
function leaves(value: unknown, path = ""): Map<string, unknown> {
  const out = new Map<string, unknown>();
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      for (const [p, v] of leaves(child, path ? `${path}.${key}` : key)) out.set(p, v);
    }
  } else {
    out.set(path, value);
  }
  return out;
}

describe("dictionaries", () => {
  const arLeaves = leaves(ar);
  const enLeaves = leaves(en);

  it("have exactly the same keys in Arabic and English", () => {
    expect([...arLeaves.keys()].sort()).toEqual([...enLeaves.keys()].sort());
  });

  it("have no empty text", () => {
    for (const [path, value] of [...arLeaves, ...enLeaves]) {
      expect(typeof value, path).toBe("string");
      expect((value as string).trim(), path).not.toBe("");
    }
  });

  it("use the same {placeholders} in both languages", () => {
    const placeholders = (s: unknown) => String(s).match(/\{\w+\}/g)?.sort() ?? [];
    for (const [path, value] of arLeaves) {
      expect(placeholders(value), path).toEqual(placeholders(enLeaves.get(path)));
    }
  });

  it("Arabic text actually is Arabic", () => {
    expect(ar.home.titleStart).toMatch(/[؀-ۿ]/);
    expect(ar.play.match).toMatch(/[؀-ۿ]/);
  });
});

describe("locales", () => {
  it("are Arabic (default, right-to-left) and English", () => {
    expect(locales).toEqual(["ar", "en"]);
    expect(defaultLocale).toBe("ar");
    expect(dir("ar")).toBe("rtl");
    expect(dir("en")).toBe("ltr");
    expect(hasLocale("ar")).toBe(true);
    expect(hasLocale("fr")).toBe(false);
    expect(hasLocale("")).toBe(false);
  });
});

describe("pickLocale", () => {
  it("prefers the saved choice", () => {
    expect(pickLocale("en", "ar-EG,ar;q=0.9")).toBe("en");
    expect(pickLocale("ar", "en-US,en;q=0.9")).toBe("ar");
  });

  it("ignores an unknown saved value", () => {
    expect(pickLocale("fr", "en-US")).toBe("en");
  });

  it("takes the first of ar/en the browser lists", () => {
    expect(pickLocale(undefined, "ar-EG,ar;q=0.9,en;q=0.8")).toBe("ar");
    expect(pickLocale(undefined, "en-GB,en;q=0.9,ar;q=0.8")).toBe("en");
    expect(pickLocale(undefined, "fr-FR,fr;q=0.9,en;q=0.8")).toBe("en");
    expect(pickLocale(undefined, "EN-us")).toBe("en");
  });

  it("falls back to Arabic", () => {
    expect(pickLocale(undefined, null)).toBe("ar");
    expect(pickLocale(undefined, "")).toBe("ar");
    expect(pickLocale(undefined, "fr-FR,de;q=0.5")).toBe("ar");
  });
});
