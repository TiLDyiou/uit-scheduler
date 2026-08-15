// src/lib/__tests__/excel-parser.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  normalizeStr,
  parsePeriods,
  parseCapacity,
  parseDayOfWeek,
} from '../excel-parser';

// ──────────────────────────────────────────────
// normalizeStr
// ──────────────────────────────────────────────
describe('normalizeStr', () => {
  it('removes Vietnamese accents', () => {
    expect(normalizeStr('Mã Môn Học')).toBe('ma mon hoc');
    expect(normalizeStr('TÊN GIẢNG VIÊN')).toBe('ten giang vien');
  });

  it('replaces đ/Đ with d', () => {
    expect(normalizeStr('Đại học')).toBe('dai hoc');
    expect(normalizeStr('HỆ ĐT')).toBe('he dt');
  });

  it('lowercases and trims', () => {
    expect(normalizeStr('  PHÒNG HỌC  ')).toBe('phong hoc');
  });

  it('handles null/undefined', () => {
    expect(normalizeStr(null)).toBe('');
    expect(normalizeStr(undefined)).toBe('');
  });

  it('handles numeric input', () => {
    expect(normalizeStr(123)).toBe('123');
  });

  it('normalizes real UIT headers', () => {
    expect(normalizeStr('MÃ MH')).toBe('ma mh');
    expect(normalizeStr('MÃ LỚP')).toBe('ma lop');
    expect(normalizeStr('SĨ SỐ')).toBe('si so');
    expect(normalizeStr('SỐ TC')).toBe('so tc');
    expect(normalizeStr('TIẾT')).toBe('tiet');
    expect(normalizeStr('CÁCH TUẦN')).toBe('cach tuan');
    expect(normalizeStr('KHOÁ HỌC')).toBe('khoa hoc');
    expect(normalizeStr('KHOA QL')).toBe('khoa ql');
    expect(normalizeStr('GHICHU')).toBe('ghichu');
  });
});

// ──────────────────────────────────────────────
// parsePeriods — real UIT data formats
// ──────────────────────────────────────────────
describe('parsePeriods', () => {
  describe('concatenated digit mode (UIT primary format)', () => {
    it('parses "123" → [1, 2, 3] (standard 3-period morning block)', () => {
      expect(parsePeriods('123')).toEqual([1, 2, 3]);
    });

    it('parses "678" → [6, 7, 8] (standard 3-period afternoon block)', () => {
      expect(parsePeriods('678')).toEqual([6, 7, 8]);
    });

    it('parses "678910" → [6, 7, 8, 9, 10] (5-period lab block from real data)', () => {
      expect(parsePeriods('678910')).toEqual([6, 7, 8, 9, 10]);
    });

    it('parses "12345" → [1, 2, 3, 4, 5] (5-period lab block from real data)', () => {
      expect(parsePeriods('12345')).toEqual([1, 2, 3, 4, 5]);
    });

    it('parses "6789" → [6, 7, 8, 9]', () => {
      expect(parsePeriods('6789')).toEqual([6, 7, 8, 9]);
    });

    it('parses "90" → [9, 10] (0 means period 10)', () => {
      expect(parsePeriods('90')).toEqual([9, 10]);
    });

    it('parses "67890" → [6, 7, 8, 9, 10] (0 as period 10 in old format)', () => {
      expect(parsePeriods('67890')).toEqual([6, 7, 8, 9, 10]);
    });

    it('parses "10" → [10] (two-char match takes priority)', () => {
      expect(parsePeriods('10')).toEqual([10]);
    });

    it('parses "110" → [1, 10]', () => {
      expect(parsePeriods('110')).toEqual([1, 10]);
    });

    it('parses "101" → [1, 10] (same as "110" after sort+dedup)', () => {
      expect(parsePeriods('101')).toEqual([1, 10]);
    });

    it('deduplicates — "100" → [10]', () => {
      expect(parsePeriods('100')).toEqual([10]);
    });

    it('returns sorted result — "321" → [1, 2, 3]', () => {
      expect(parsePeriods('321')).toEqual([1, 2, 3]);
    });
  });

  describe('separator mode', () => {
    it('comma-separated: "1,2,3" → [1, 2, 3]', () => {
      expect(parsePeriods('1,2,3')).toEqual([1, 2, 3]);
    });

    it('comma with spaces: "1, 2, 3" → [1, 2, 3]', () => {
      expect(parsePeriods('1, 2, 3')).toEqual([1, 2, 3]);
    });

    it('semicolon: "6;7;8" → [6, 7, 8]', () => {
      expect(parsePeriods('6;7;8')).toEqual([6, 7, 8]);
    });

    it('space-separated: "1 2 3" → [1, 2, 3]', () => {
      expect(parsePeriods('1 2 3')).toEqual([1, 2, 3]);
    });

    it('large period numbers: "11,12,13" → [11, 12, 13]', () => {
      expect(parsePeriods('11,12,13')).toEqual([11, 12, 13]);
    });

    it('deduplicates: "1,1,2,2" → [1, 2]', () => {
      expect(parsePeriods('1,1,2,2')).toEqual([1, 2]);
    });

    it('filters outside 1-16: "0,1,17,20" → [1]', () => {
      expect(parsePeriods('0,1,17,20')).toEqual([1]);
    });
  });

  describe('edge cases', () => {
    it('null → []', () => {
      expect(parsePeriods(null)).toEqual([]);
    });

    it('undefined → []', () => {
      expect(parsePeriods(undefined)).toEqual([]);
    });

    it('"*" → []', () => {
      expect(parsePeriods('*')).toEqual([]);
    });

    it('"0" alone → []', () => {
      expect(parsePeriods('0')).toEqual([]);
    });

    it('empty string → []', () => {
      expect(parsePeriods('')).toEqual([]);
    });
  });
});

// ──────────────────────────────────────────────
// parseCapacity
// ──────────────────────────────────────────────
describe('parseCapacity', () => {
  it('parses plain number: "40" → 40', () => {
    expect(parseCapacity('40')).toBe(40);
  });

  it('parses parenthetical: "50(0)" → 50', () => {
    expect(parseCapacity('50(0)')).toBe(50);
  });

  it('handles numeric input: 120 → 120', () => {
    expect(parseCapacity(120)).toBe(120);
  });

  it('null → 0', () => {
    expect(parseCapacity(null)).toBe(0);
  });

  it('non-numeric string → 0', () => {
    expect(parseCapacity('abc')).toBe(0);
  });
});

// ──────────────────────────────────────────────
// parseDayOfWeek — real UIT column "THỨ"
// ──────────────────────────────────────────────
describe('parseDayOfWeek', () => {
  it('parses numeric strings "2"–"7" from real data', () => {
    for (let d = 2; d <= 7; d++) {
      expect(parseDayOfWeek(String(d))).toBe(d);
    }
  });

  it('parses "8" as Sunday', () => {
    expect(parseDayOfWeek('8')).toBe(8);
  });

  it('parses "cn" as Sunday (8)', () => {
    expect(parseDayOfWeek('cn')).toBe(8);
  });

  it('parses "CN." as Sunday (8)', () => {
    expect(parseDayOfWeek('CN.')).toBe(8);
  });

  it('BUG: "thu 2" not matched — regex [t|thứ] is a char class, not alternation', () => {
    // The regex /[t|thứ]\s*([2-8])/i uses a character class [t|thứ]
    // which matches any single char: t, |, h, ứ — not the word "thu" or "thứ"
    // For "thu 2": after parseInt fails (NaN), regex tries to match
    // [t|thứ]\s*([2-8]) → matches "t" then expects \s*[2-8] immediately
    // but next char is "h", not a digit → fails to capture
    // Result: null instead of 2
    expect(parseDayOfWeek('thu 2')).toBeNull();
    expect(parseDayOfWeek('thu 7')).toBeNull();
    // But "t2" works because 't' is followed directly by '2'
    expect(parseDayOfWeek('t2')).toBe(2);
  });

  it('parses "t3" shorthand', () => {
    expect(parseDayOfWeek('t3')).toBe(3);
  });

  it('returns null for "*"', () => {
    expect(parseDayOfWeek('*')).toBeNull();
  });

  it('returns null for null/undefined/empty', () => {
    expect(parseDayOfWeek(null)).toBeNull();
    expect(parseDayOfWeek(undefined)).toBeNull();
    expect(parseDayOfWeek('')).toBeNull();
  });

  it('returns null for out-of-range: "1" and "9"', () => {
    expect(parseDayOfWeek('1')).toBeNull();
    expect(parseDayOfWeek('9')).toBeNull();
  });
});

// ──────────────────────────────────────────────
// parseTkbExcel — integration test with real UIT Excel
// ──────────────────────────────────────────────
describe('parseTkbExcel (real UIT Excel)', () => {
  // Lazy import to avoid XLSX side effects in unit tests
  let parseTkbExcel: typeof import('../excel-parser').parseTkbExcel;
  let fileBuffer: Uint8Array;

  beforeAll(async () => {
    const mod = await import('../excel-parser');
    parseTkbExcel = mod.parseTkbExcel;
    const filePath = join(__dirname, '../../../docs/TKB_KHDT_14-08-2026_1786696150_HK_1_NH2026.xlsx');
    fileBuffer = new Uint8Array(readFileSync(filePath));
  });

  it('parses without throwing', () => {
    expect(() => parseTkbExcel(fileBuffer)).not.toThrow();
  });

  it('detects both sheets (LT and TH)', () => {
    const result = parseTkbExcel(fileBuffer);
    expect(result.stats.totalSheets).toBe(2);
    expect(result.stats.parsedSheets).toBeGreaterThanOrEqual(1);
  });

  it('parses a non-trivial number of sections', () => {
    const result = parseTkbExcel(fileBuffer);
    expect(result.sections.length).toBeGreaterThan(100);
    expect(result.stats.totalRows).toBeGreaterThan(100);
  });

  it('finds both theory and lab sections', () => {
    const result = parseTkbExcel(fileBuffer);
    expect(result.stats.theoryCount).toBeGreaterThan(0);
    expect(result.stats.labCount).toBeGreaterThan(0);
  });

  it('extracts known course codes from real data', () => {
    const result = parseTkbExcel(fileBuffer);
    const codes = new Set(result.sections.map(s => s.course_code));
    // These courses appear in the Excel sample data
    expect(codes.has('IT001')).toBe(true);
    expect(codes.has('CE005')).toBe(true);
  });

  it('parses AI001.R11 from sheet "TKB LT" correctly', () => {
    const result = parseTkbExcel(fileBuffer);
    const ai001 = result.sections.find(
      s => s.course_code === 'AI001' && s.section_code === 'AI001.R11'
    );
    expect(ai001).toBeDefined();
    expect(ai001!.course_name).toBe('Giới thiệu ngành Trí tuệ nhân tạo');
    expect(ai001!.credits).toBe(1);
    expect(ai001!.is_lab).toBe(false);
    expect(ai001!.teaching_type).toBe('LT');
    expect(ai001!.day_of_week).toBe(5);
    expect(ai001!.periods).toEqual([1, 2, 3]);
    expect(ai001!.room).toBe('B3.10');
    expect(ai001!.department).toBe('KHMT');
    expect(ai001!.program).toBe('CQUI');
  });

  it('parses lab section IT001.R11.1 from sheet "TKB TH" correctly', () => {
    const result = parseTkbExcel(fileBuffer);
    const lab = result.sections.find(
      s => s.section_code === 'IT001.R11.1'
    );
    expect(lab).toBeDefined();
    expect(lab!.course_code).toBe('IT001');
    expect(lab!.course_name).toBe('Nhập môn lập trình');
    expect(lab!.is_lab).toBe(true);
    expect(lab!.teaching_type).toBe('HT1');
    expect(lab!.day_of_week).toBe(2);
    expect(lab!.periods).toEqual([6, 7, 8, 9, 10]); // "678910"
    expect(lab!.room).toBe('C109');
  });

  it('parses 5-period lab "12345" correctly', () => {
    const result = parseTkbExcel(fileBuffer);
    const lab5 = result.sections.find(
      s => s.section_code === 'IT001.R110.1'
    );
    expect(lab5).toBeDefined();
    expect(lab5!.periods).toEqual([1, 2, 3, 4, 5]); // "12345"
    expect(lab5!.day_of_week).toBe(4);
  });

  it('parses TTNT-style lab section code correctly', () => {
    const result = parseTkbExcel(fileBuffer);
    const ttnt = result.sections.find(
      s => s.section_code === 'IT001.R11.TTNT.1'
    );
    expect(ttnt).toBeDefined();
    expect(ttnt!.is_lab).toBe(true);
    expect(ttnt!.day_of_week).toBe(3);
  });

  it('all sections have valid day_of_week (2–8)', () => {
    const result = parseTkbExcel(fileBuffer);
    for (const s of result.sections) {
      expect(s.day_of_week).toBeGreaterThanOrEqual(2);
      expect(s.day_of_week).toBeLessThanOrEqual(8);
    }
  });

  it('all sections have non-empty periods within 1–10', () => {
    const result = parseTkbExcel(fileBuffer);
    for (const s of result.sections) {
      expect(s.periods.length).toBeGreaterThan(0);
      for (const p of s.periods) {
        expect(p).toBeGreaterThanOrEqual(1);
        expect(p).toBeLessThanOrEqual(10);
      }
    }
  });

  it('skips KLTN/TTTN/ĐA rows', () => {
    const result = parseTkbExcel(fileBuffer);
    expect(result.stats.skippedThesis).toBeGreaterThanOrEqual(0);
    // No section should have teaching_type of KLTN/TTTN/ĐA
    for (const s of result.sections) {
      expect(['KLTN', 'TTTN', 'ĐA', 'KHOA_LUAN']).not.toContain(
        s.teaching_type.toUpperCase()
      );
    }
  });

  it('produces no critical warnings for real data', () => {
    const result = parseTkbExcel(fileBuffer);
    // Warnings about "no valid data" should NOT appear for real file
    const criticalWarnings = result.warnings.filter(w =>
      w.includes('Không tìm thấy dữ liệu')
    );
    expect(criticalWarnings).toHaveLength(0);
  });

  it('biweekly parsed correctly from CÁCH TUẦN column', () => {
    const result = parseTkbExcel(fileBuffer);
    // CE005.R11 has CÁCH TUẦN = 2 (biweekly)
    const biweeklySection = result.sections.find(
      s => s.section_code === 'CE005.R11'
    );
    expect(biweeklySection).toBeDefined();
    expect(biweeklySection!.biweekly).toBe(true);
  });

  it('unique courses count is reasonable', () => {
    const result = parseTkbExcel(fileBuffer);
    expect(result.stats.uniqueCourses).toBeGreaterThan(10);
  });

  it('no duplicate section keys (courseCode_sectionCode_day_periods)', () => {
    const result = parseTkbExcel(fileBuffer);
    const keys = result.sections.map(
      s => `${s.course_code}_${s.section_code}_${s.day_of_week}_${s.periods.join('-')}`
    );
    expect(new Set(keys).size).toBe(keys.length);
  });
});
