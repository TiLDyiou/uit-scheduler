import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { parseTkbExcel } from "./excel-parser";

describe("excel-parser", () => {
  it("successfully parses DanhSachLop_1171_lop(dự kiến).xlsx", () => {
    const filePath = path.resolve(__dirname, "../../docs/DanhSachLop_1171_lop(dự kiến).xlsx");
    const buf = fs.readFileSync(filePath);
    const result = parseTkbExcel(buf);

    console.log("DanhSachLop parse result:", {
      sectionsCount: result.sections.length,
      stats: result.stats,
      warnings: result.warnings,
    });

    expect(result.warnings.length).toBe(0);
    expect(result.sections.length).toBeGreaterThan(500);
    expect(result.stats.parsedSheets).toBe(2);
    expect(result.stats.theoryCount).toBeGreaterThan(0);
    expect(result.stats.labCount).toBeGreaterThan(0);

    // Verify a sample course
    const sample = result.sections.find((s) => s.section_code === "CE118.R11.1");
    expect(sample).toBeDefined();
    expect(sample?.is_lab).toBe(true);
    expect(sample?.course_code).toBe("CE118");
    expect(sample?.day_of_week).toBe(4);
    expect(sample?.periods).toEqual([1, 2, 3, 4, 5]);
    expect(sample?.room).toBe("B4.02");
    expect(sample?.biweekly).toBe(true);
  });

  it("successfully parses TKB_KHDT_14-08-2026_1786696150_HK_1_NH2026.xlsx", () => {
    const filePath = path.resolve(__dirname, "../../docs/TKB_KHDT_14-08-2026_1786696150_HK_1_NH2026.xlsx");
    if (!fs.existsSync(filePath)) return;
    const buf = fs.readFileSync(filePath);
    const result = parseTkbExcel(buf);

    console.log("TKB_KHDT parse result:", {
      sectionsCount: result.sections.length,
      stats: result.stats,
    });

    expect(result.warnings.length).toBe(0);
    expect(result.sections.length).toBe(1032);
    expect(result.stats.parsedSheets).toBe(2);
  });
});
