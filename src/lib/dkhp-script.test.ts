import { describe, it, expect } from "vitest";
import { extractListMaLop, getScriptDkhp, tokenizeJsLine } from "./dkhp-script";
import { Section } from "@/types/scheduler";

describe("dkhp-script utils", () => {
  it("extractListMaLop extracts deduplicated section codes", () => {
    const sections = [
      { section_code: "IT001.N11" },
      { section_code: "IT001.N11.1" },
      { section_code: "IT001.N11" },
    ];

    const result = extractListMaLop(sections as unknown as Section[]);
    expect(result).toEqual(["IT001.N11", "IT001.N11.1"]);
  });

  it("getScriptDkhp returns empty string when list is empty", () => {
    expect(getScriptDkhp([])).toBe("");
  });

  it("getScriptDkhp generates clean script without comments or icons", () => {
    const list = ["IT001.N11", "IT001.N11.1", "MA006.N21"];
    const script = getScriptDkhp(list);
    expect(script).toContain("IT001.N11");
    expect(script).toContain("IT001.N11.1");
    expect(script).toContain("MA006.N21");
    expect(script).toContain("document.querySelectorAll");
    expect(script).toContain("checkbox");
    // Ensure no comments or emojis
    expect(script).not.toContain("//");
    expect(script).not.toContain("/*");
    expect(script).not.toContain("⚠️");
    expect(script).not.toContain("✅");
    // Ensure accurate logging
    expect(script).toContain("Đã chọn:");
    expect(script).not.toContain("Đăng ký thành công:");
    expect(script).not.toContain("allText.includes");
  });

  it("tokenizeJsLine correctly parses keywords and strings", () => {
    const tokens = tokenizeJsLine('const listMaLop = ["IT001.N11"];');
    expect(tokens.some((t) => t.type === "keyword" && t.text === "const")).toBe(true);
    expect(tokens.some((t) => t.type === "string" && t.text === '"IT001.N11"')).toBe(true);
  });
});
