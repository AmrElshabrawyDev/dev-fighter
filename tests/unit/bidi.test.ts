import { describe, expect, it } from "vitest";
import { codeRuns } from "@/components/BidiText";

describe("code inside Arabic text", () => {
  it("keeps each CSS snippet in one left-to-right piece", () => {
    expect(codeRuns("border-radius:150px 0 يعطي استدارة")).toEqual(["border-radius:150px 0"]);
    expect(codeRuns("اجعل body بارتفاع 100vh ثم display:grid و place-items:center.")).toEqual(["body", "100vh", "display:grid", "place-items:center"]);
    expect(codeRuns("و i+i يختار")).toEqual(["i+i"]);
    expect(codeRuns("مربع 150×150 في المنتصف")).toEqual(["150×150"]);
  });

  it("leaves plain Arabic alone", () => {
    expect(codeRuns("نص عربي فقط.")).toEqual([]);
  });
});
