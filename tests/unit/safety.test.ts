import { describe, expect, it } from "vitest";
import { formatAccuracy } from "@/lib/match/engine";
import { PREVIEW_CSP, previewDocument } from "@/lib/match/document";
import { safeNextPath } from "@/lib/safe-next";

describe("safeNextPath (where to go after sign-in)", () => {
  it("keeps paths on this site", () => {
    expect(safeNextPath("/en/challenges")).toBe("/en/challenges");
    expect(safeNextPath("/ar/challenges/twin-moons?x=1")).toBe("/ar/challenges/twin-moons?x=1");
  });

  it("refuses anything that could leave the site", () => {
    for (const next of ["https://evil.com", "//evil.com", "/\\evil.com", "evil.com", "javascript:alert(1)", ""]) {
      expect(safeNextPath(next), next).toBe("/ar");
    }
    expect(safeNextPath(null)).toBe("/ar");
  });
});

describe("previewDocument (the sandbox player code runs in)", () => {
  const doc = previewDocument("<div></div><style>div{width:10px}</style>");

  it("renders in standards mode, like the target images", () => {
    expect(doc.startsWith("<!doctype html>")).toBe(true);
  });

  it("blocks scripts and every network request", () => {
    expect(doc).toContain(`<meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP}">`);
    expect(PREVIEW_CSP).toContain("default-src 'none'");
    expect(PREVIEW_CSP).not.toMatch(/script-src|unsafe-eval|connect-src|https?:/);
  });

  it("puts the player's code after the policy", () => {
    expect(doc.indexOf("Content-Security-Policy")).toBeLessThan(doc.indexOf("<div></div>"));
  });
});

describe("formatAccuracy", () => {
  it("shows one decimal", () => {
    expect(formatAccuracy(0)).toBe("0.0");
    expect(formatAccuracy(0.5)).toBe("50.0");
    expect(formatAccuracy(0.832)).toBe("83.2");
    expect(formatAccuracy(1)).toBe("100.0");
  });

  it("rounds down, so only an exact match shows 100", () => {
    expect(formatAccuracy(0.99999)).toBe("99.9");
    expect(formatAccuracy(0.12345)).toBe("12.3");
  });
});
