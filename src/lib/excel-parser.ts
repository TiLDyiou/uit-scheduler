import * as XLSX from "xlsx";
import { Section, ParseExcelResult } from "@/types/scheduler";

const SKIP_HTGD = new Set(["KLTN", "TTTN", "ĐA", "KHOA_LUAN"]);

/**
 * Remove Vietnamese accents and special characters for fuzzy matching column names
 */
export function normalizeStr(s: unknown): string {
  if (s === null || s === undefined) return "";
  return String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim();
}

/**
 * Parse periods string into sorted array of period numbers.
 * Examples:
 *  "123"      -> [1, 2, 3]
 *  "6789"     -> [6, 7, 8, 9]
 *  "67890"    -> [6, 7, 8, 9, 10] (0 means period 10)
 *  "90"       -> [9, 10]
 *  "11,12,13" -> [11, 12, 13]
 *  "1, 2, 3"  -> [1, 2, 3]
 */
export function parsePeriods(raw: unknown): number[] {
  if (raw === null || raw === undefined) return [];
  const s = String(raw).trim();
  if (s === "*" || !s || s === "0") return [];

  // Comma or semicolon or whitespace separated (e.g. "1, 2, 3" or "6,7,8,9,10")
  if (s.includes(",") || s.includes(";") || s.includes(" ")) {
    return Array.from(
      new Set(
        s
          .split(/[,;\s]+/)
          .map((x) => parseInt(x.trim(), 10))
          .filter((n) => !isNaN(n) && n >= 1 && n <= 16),
      ),
    ).sort((a, b) => a - b);
  }

  // Concatenated format (e.g. "123", "678910", "67890")
  const periods: number[] = [];
  let i = 0;
  while (i < s.length) {
    if (s.slice(i, i + 2) === "10") {
      periods.push(10);
      i += 2;
    } else {
      const ch = s[i];
      if (ch >= "1" && ch <= "9") {
        periods.push(parseInt(ch, 10));
      } else if (ch === "0") {
        // standalone '0' in old format e.g. "67890" represents period 10
        periods.push(10);
      }
      i++;
    }
  }

  return Array.from(new Set(periods)).sort((a, b) => a - b);
}

/**
 * Parse capacity from string formatted like "50(0)" or "40"
 */
export function parseCapacity(raw: unknown): number {
  if (raw === null || raw === undefined) return 0;
  const match = String(raw).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Parse day of week (2=Mon ... 7=Sat, 8=Sun)
 */
export function parseDayOfWeek(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim().toLowerCase();
  if (s === "*" || !s) return null;

  if (s === "cn" || s.includes("chu nhat") || s === "8" || s === "cn.") {
    return 8;
  }

  const num = parseInt(s, 10);
  if (!isNaN(num) && num >= 2 && num <= 8) {
    return num;
  }

  // Check strings like "thu 2", "t2"
  const m = s.match(/[t|thứ]\s*([2-8])/i);
  if (m) {
    return parseInt(m[1], 10);
  }

  return null;
}

/**
 * Robust date formatting for Excel date serials, Date objects, or string dates
 */
export function formatExcelDate(val: unknown): string {
  if (!val) return "";
  if (val instanceof Date && !isNaN(val.getTime())) {
    const d = String(val.getDate()).padStart(2, "0");
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const y = val.getFullYear();
    return `${d}/${m}/${y}`;
  }
  if (typeof val === "number" && val > 20000 && val < 60000) {
    const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(jsDate.getTime())) {
      const d = String(jsDate.getDate()).padStart(2, "0");
      const m = String(jsDate.getMonth() + 1).padStart(2, "0");
      const y = jsDate.getFullYear();
      return `${d}/${m}/${y}`;
    }
  }
  const s = String(val).trim();
  if (!s || s === "*") return "";
  const ymdMatch = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
  }
  return s;
}

interface ColumnMapping {
  courseCode?: number;
  sectionCode?: number;
  courseName?: number;
  instructor?: number;
  capacity?: number;
  credits?: number;
  isLab?: number;
  teachingType?: number;
  dayOfWeek?: number;
  periods?: number;
  biweekly?: number;
  room?: number;
  cohort?: number;
  department?: number;
  program?: number;
  startDate?: number;
  endDate?: number;
  note?: number;
}

/**
 * Detect column indices by inspecting header rows
 */
function detectColumnMapping(headers: unknown[]): ColumnMapping | null {
  const colMap: ColumnMapping = {};
  // Normalize header text by stripping accents, lowercase, and removing all non-alphanumeric chars
  const normHeaders = headers.map((h) =>
    normalizeStr(h).replace(/[^a-z0-9]/g, ""),
  );

  const hasCourseCode = normHeaders.some(
    (c) =>
      c === "mamh" ||
      c === "mamon" ||
      c === "mamonhoc" ||
      c.startsWith("mamh") ||
      c.startsWith("mamon") ||
      c.includes("monhoc"),
  );
  const hasSectionCode = normHeaders.some(
    (c) =>
      (c === "malop" ||
        c === "manhom" ||
        c === "manhomlop" ||
        c.startsWith("malop") ||
        c.startsWith("manhom")) &&
      !c.includes("lt"),
  );

  if (!hasCourseCode && !hasSectionCode) {
    return null;
  }

  normHeaders.forEach((c, idx) => {
    if (
      c === "mamh" ||
      c === "mamon" ||
      c === "mamonhoc" ||
      c.startsWith("mamh") ||
      c.startsWith("mamon")
    ) {
      colMap.courseCode = idx;
    } else if (
      (c === "malop" ||
        c === "manhom" ||
        c === "manhomlop" ||
        c.startsWith("malop") ||
        c.startsWith("manhom")) &&
      !c.includes("lt")
    ) {
      colMap.sectionCode = idx;
    } else if (
      c === "tenmh" ||
      c === "tenmon" ||
      c === "tenmonhoc" ||
      c.startsWith("tenmh") ||
      c.startsWith("tenmon")
    ) {
      colMap.courseName = idx;
    } else if (
      c === "tengv" ||
      c === "tengiangvien" ||
      c.includes("tengv") ||
      c.includes("tengiangvien") ||
      c.includes("trogiang") ||
      ((c.includes("giangvien") || c.includes("gv")) && !c.includes("ma"))
    ) {
      colMap.instructor = idx;
    } else if (
      c === "siso" ||
      c === "slsv" ||
      c.includes("siso") ||
      c.includes("slsv")
    ) {
      colMap.capacity = idx;
    } else if (
      c === "sotc" ||
      c === "stc" ||
      c === "tinchi" ||
      c.includes("sotc") ||
      c.includes("totc") ||
      c.includes("tinchi")
    ) {
      colMap.credits = idx;
    } else if (
      c === "thuchanh" ||
      c === "lab" ||
      c.includes("thuchanh") ||
      c.includes("lab")
    ) {
      colMap.isLab = idx;
    } else if (
      c === "htgd" ||
      c.includes("htgd") ||
      c.includes("hinhthuc")
    ) {
      colMap.teachingType = idx;
    } else if (
      c === "thu" ||
      (c.includes("thu") && !c.includes("thuchanh") && !c.includes("hinhthuc"))
    ) {
      colMap.dayOfWeek = idx;
    } else if (c === "tiet" || c.includes("tiet")) {
      colMap.periods = idx;
    } else if (c === "cachtuan" || c.includes("cachtuan")) {
      colMap.biweekly = idx;
    } else if (c === "phong" || c === "phonghoc" || c.includes("phong")) {
      colMap.room = idx;
    } else if (
      (c === "khoahoc" || c === "khoa" || c.includes("khoahoc")) &&
      !c.includes("dkhp") &&
      !c.includes("khoaql") &&
      !c.includes("quanly")
    ) {
      colMap.cohort = idx;
    } else if (
      c === "khoaql" ||
      c.includes("khoaql") ||
      c.includes("khoaquanly")
    ) {
      colMap.department = idx;
    } else if (
      (c === "hedt" ||
        c.includes("hedt") ||
        c.includes("chuongtrinh") ||
        c.includes("hedaotao")) &&
      !c.includes("dkhp")
    ) {
      colMap.program = idx;
    } else if (
      c === "nbd" ||
      c.includes("nbd") ||
      c.includes("batdau") ||
      c.includes("ngaybd")
    ) {
      colMap.startDate = idx;
    } else if (
      c === "nkt" ||
      c.includes("nkt") ||
      c.includes("ketthuc") ||
      c.includes("ngaykt")
    ) {
      colMap.endDate = idx;
    } else if (c === "ghichu" || c.includes("ghichu")) {
      colMap.note = idx;
    }
  });

  return colMap.courseCode !== undefined ? colMap : null;
}

/**
 * Pure client-side parser supporting 1-sheet (legacy) & 2-sheet (new UIT format) Excel files.
 */
export function parseTkbExcel(
  fileBuffer: ArrayBuffer | Uint8Array,
): ParseExcelResult {
  const wb = XLSX.read(fileBuffer, { type: "array", cellDates: true });
  const allSections: Section[] = [];
  const warnings: string[] = [];

  const stats = {
    totalSheets: wb.SheetNames.length,
    parsedSheets: 0,
    sheetNames: wb.SheetNames,
    totalRows: 0,
    uniqueCourses: 0,
    theoryCount: 0,
    labCount: 0,
    skippedUnscheduled: 0,
    skippedThesis: 0,
  };

  const seenSectionKeys = new Set<string>();

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;

    const rawRows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      defval: "",
    });
    if (!rawRows || rawRows.length === 0) continue;

    // Scan top 15 rows to find header row
    let headerRowIdx = -1;
    let colMap: ColumnMapping | null = null;

    for (let r = 0; r < Math.min(15, rawRows.length); r++) {
      const row = rawRows[r];
      if (!Array.isArray(row)) continue;

      const detected = detectColumnMapping(row);
      if (detected) {
        headerRowIdx = r;
        colMap = detected;
        break;
      }
    }

    if (headerRowIdx === -1 || !colMap || colMap.courseCode === undefined) {
      // Not a course schedule sheet, skip quietly
      continue;
    }

    stats.parsedSheets++;

    for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!Array.isArray(row) || row.length === 0) continue;

      const courseCode = String(row[colMap.courseCode] || "").trim();
      if (!courseCode) continue;

      const teachingType = String(
        colMap.teachingType !== undefined ? row[colMap.teachingType] || "" : "",
      ).trim();

      if (SKIP_HTGD.has(teachingType.toUpperCase())) {
        stats.skippedThesis++;
        continue;
      }

      const dayVal =
        colMap.dayOfWeek !== undefined ? row[colMap.dayOfWeek] : "";
      const dayOfWeek = parseDayOfWeek(dayVal);
      if (!dayOfWeek) {
        stats.skippedUnscheduled++;
        continue;
      }

      const periodsVal =
        colMap.periods !== undefined ? row[colMap.periods] : "";
      const periods = parsePeriods(periodsVal);
      if (periods.length === 0) {
        stats.skippedUnscheduled++;
        continue;
      }

      const sectionCode = String(
        colMap.sectionCode !== undefined ? row[colMap.sectionCode] || "" : "",
      ).trim();

      const key = `${courseCode}_${sectionCode}_${dayOfWeek}_${periods.join("-")}`;
      if (seenSectionKeys.has(key)) {
        continue; // duplicate row
      }
      seenSectionKeys.add(key);

      const courseName = String(
        colMap.courseName !== undefined ? row[colMap.courseName] || "" : "",
      ).trim();

      const creditsRaw = colMap.credits !== undefined ? row[colMap.credits] : 0;
      let credits = parseInt(String(creditsRaw || 0), 10);
      if (isNaN(credits) || credits < 0) credits = 0;

      // UIT rule for determining whether a row is a Lab (TH) or Theory (LT) section:
      // 1. If in a sheet explicitly named TH / Thực hành -> is_lab = true
      // 2. If in a sheet explicitly named LT / Lý thuyết -> is_lab = false
      // 3. If column THỰC HÀNH is explicitly present -> 1 is lab, 0 is theory
      // 4. Otherwise:
      //    - If HTGD is "LT" -> is_lab = false
      //    - If HTGD is "HT1", "HT2", "TG", "TH" -> is_lab = true
      //    - If section code ends with .1, .2, .3, .TTNT.1 -> is_lab = true
      const sLower = sheetName.toLowerCase();
      const ttUpper = teachingType.toUpperCase();
      const isLabColVal =
        colMap.isLab !== undefined ? String(row[colMap.isLab] || "").trim() : "";
      let isLab = false;

      if (/\bth\b|thuc\s*hanh/i.test(sLower)) {
        isLab = true;
      } else if (/\blt\b|ly\s*thuyet/i.test(sLower)) {
        isLab = false;
      } else if (isLabColVal === "1") {
        isLab = true;
      } else if (isLabColVal === "0") {
        isLab = false;
      } else if (ttUpper === "LT") {
        isLab = false;
      } else if (["HT1", "HT2", "TG", "TH"].includes(ttUpper)) {
        isLab = true;
      } else if (
        /\.\d+$/.test(sectionCode) ||
        /\.[A-Z0-9]+\.\d+$/.test(sectionCode)
      ) {
        isLab = true;
      } else {
        isLab = false;
      }

      const biweeklyRaw =
        colMap.biweekly !== undefined ? row[colMap.biweekly] : "";
      const biweekly = String(biweeklyRaw).trim() === "2";

      const room = String(
        colMap.room !== undefined ? row[colMap.room] || "" : "",
      ).trim();
      const capacity = parseCapacity(
        colMap.capacity !== undefined ? row[colMap.capacity] : 0,
      );
      const instructor = String(
        colMap.instructor !== undefined ? row[colMap.instructor] || "" : "",
      ).trim();
      const program = String(
        colMap.program !== undefined ? row[colMap.program] || "" : "",
      ).trim();
      const department = String(
        colMap.department !== undefined ? row[colMap.department] || "" : "",
      ).trim();
      const note = String(
        colMap.note !== undefined ? row[colMap.note] || "" : "",
      ).trim();
      const startDate =
        colMap.startDate !== undefined
          ? formatExcelDate(row[colMap.startDate])
          : "";
      const endDate =
        colMap.endDate !== undefined
          ? formatExcelDate(row[colMap.endDate])
          : "";

      const section: Section = {
        course_code: courseCode,
        section_code: sectionCode || `${courseCode}.01`,
        course_name: courseName || courseCode,
        credits,
        is_lab: isLab,
        teaching_type: teachingType || (isLab ? "HT1" : "LT"),
        day_of_week: dayOfWeek,
        periods,
        biweekly,
        room: room === "*" ? "" : room,
        capacity,
        instructor_name: instructor === "*" ? "" : instructor,
        program,
        department,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        note,
      };

      allSections.push(section);
      stats.totalRows++;
      if (isLab) stats.labCount++;
      else stats.theoryCount++;
    }
  }

  const uniqueCoursesSet = new Set(
    allSections.map((s) => s.course_code.replace(/\.[12]$/, "")),
  );
  stats.uniqueCourses = uniqueCoursesSet.size;

  if (allSections.length === 0) {
    warnings.push(
      "Không tìm thấy dữ liệu lớp học nào hợp lệ trong file Excel.",
    );
  }

  return {
    sections: allSections,
    stats,
    warnings,
  };
}
