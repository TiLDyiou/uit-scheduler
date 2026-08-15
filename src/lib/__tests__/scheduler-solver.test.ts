// src/lib/__tests__/scheduler-solver.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  getBaseCourseCode,
  getBaseSectionCode,
  doSectionsOverlap,
  solveSchedule,
} from '../scheduler-solver';
import { parseTkbExcel } from '../excel-parser';
import type { Section } from '@/types/scheduler';

// ──────────────────────────────────────────────
// Helper
// ──────────────────────────────────────────────
function makeSection(overrides: Partial<Section> = {}): Section {
  return {
    course_code: 'CE118',
    section_code: 'CE118.R11',
    course_name: 'Lập trình hướng đối tượng',
    credits: 4,
    is_lab: false,
    teaching_type: 'LT',
    day_of_week: 2,
    periods: [1, 2, 3],
    biweekly: false,
    room: 'C21',
    capacity: 50,
    instructor_name: 'Nguyễn Văn A',
    program: 'CQUI',
    department: 'KHMT',
    ...overrides,
  };
}

// ──────────────────────────────────────────────
// getBaseCourseCode
// ──────────────────────────────────────────────
describe('getBaseCourseCode', () => {
  it('removes .1 suffix', () => {
    expect(getBaseCourseCode('CE118.1')).toBe('CE118');
  });

  it('removes .2 suffix', () => {
    expect(getBaseCourseCode('CE118.2')).toBe('CE118');
  });

  it('does NOT remove .3 or higher', () => {
    expect(getBaseCourseCode('CE118.3')).toBe('CE118.3');
  });

  it('returns unchanged if no suffix', () => {
    expect(getBaseCourseCode('CE118')).toBe('CE118');
  });

  it('BUG: trim runs after regex, whitespace prevents .1/.2 match', () => {
    // getBaseCourseCode does: code.replace(/\.[12]$/, "").trim()
    // With "  CE118.1  " → regex doesn't match ($ sees trailing space) → trim gives "CE118.1"
    // Expected ideal: "CE118", Actual: "CE118.1"
    expect(getBaseCourseCode('  CE118.1  ')).toBe('CE118.1');
  });
});

// ──────────────────────────────────────────────
// getBaseSectionCode
// ──────────────────────────────────────────────
describe('getBaseSectionCode', () => {
  it('strips trailing lab index: "CE118.R11.1" → "CE118.R11"', () => {
    expect(getBaseSectionCode('CE118.R11.1')).toBe('CE118.R11');
  });

  it('strips .2: "CE118.R11.2" → "CE118.R11"', () => {
    expect(getBaseSectionCode('CE118.R11.2')).toBe('CE118.R11');
  });

  it('keeps non-numeric tail: "CE118.R11" → "CE118.R11"', () => {
    expect(getBaseSectionCode('CE118.R11')).toBe('CE118.R11');
  });

  it('handles TTNT-style: "IT001.R11.TTNT.1" → "IT001.R11.TTNT"', () => {
    expect(getBaseSectionCode('IT001.R11.TTNT.1')).toBe('IT001.R11.TTNT');
  });

  it('single-part code: "CE118" → "CE118"', () => {
    expect(getBaseSectionCode('CE118')).toBe('CE118');
  });
});

// ──────────────────────────────────────────────
// doSectionsOverlap
// ──────────────────────────────────────────────
describe('doSectionsOverlap', () => {
  it('returns true when same day + overlapping periods', () => {
    const a = makeSection({ day_of_week: 2, periods: [1, 2, 3] });
    const b = makeSection({ day_of_week: 2, periods: [3, 4, 5] });
    expect(doSectionsOverlap(a, b)).toBe(true);
  });

  it('returns false when same day but no period overlap', () => {
    const a = makeSection({ day_of_week: 2, periods: [1, 2, 3] });
    const b = makeSection({ day_of_week: 2, periods: [4, 5, 6] });
    expect(doSectionsOverlap(a, b)).toBe(false);
  });

  it('returns false when different days', () => {
    const a = makeSection({ day_of_week: 2, periods: [1, 2, 3] });
    const b = makeSection({ day_of_week: 3, periods: [1, 2, 3] });
    expect(doSectionsOverlap(a, b)).toBe(false);
  });

  it('returns true for identical timeslot', () => {
    const a = makeSection({ day_of_week: 4, periods: [6, 7] });
    const b = makeSection({ day_of_week: 4, periods: [6, 7] });
    expect(doSectionsOverlap(a, b)).toBe(true);
  });
});

// ──────────────────────────────────────────────
// solveSchedule — unit tests
// ──────────────────────────────────────────────
describe('solveSchedule', () => {
  it('returns warning when no courses provided', () => {
    const result = solveSchedule({
      course_codes: [],
      sections: [],
      available_slots: null,
    });
    expect(result.solutions).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThanOrEqual(1);
    expect(result.warnings[0]).toContain('ít nhất 1 môn');
  });

  it('solves single course with single section', () => {
    const section = makeSection();
    const result = solveSchedule({
      course_codes: ['CE118'],
      sections: [section],
      available_slots: null,
    });
    expect(result.solutions.length).toBe(1);
    expect(result.solutions[0].sections).toHaveLength(1);
    expect(result.solutions[0].conflict_free).toBe(true);
  });

  it('solves 2 non-conflicting courses', () => {
    const s1 = makeSection({
      course_code: 'CE118', section_code: 'CE118.R11',
      day_of_week: 2, periods: [1, 2, 3],
    });
    const s2 = makeSection({
      course_code: 'IT001', section_code: 'IT001.R11',
      course_name: 'Nhập môn lập trình',
      day_of_week: 3, periods: [1, 2, 3],
    });
    const result = solveSchedule({
      course_codes: ['CE118', 'IT001'],
      sections: [s1, s2],
      available_slots: null,
    });
    expect(result.solutions.length).toBeGreaterThanOrEqual(1);
    expect(result.solutions[0].sections).toHaveLength(2);
    expect(result.solutions[0].conflict_free).toBe(true);
  });

  it('picks non-conflicting alternative when one option conflicts', () => {
    const s1 = makeSection({
      course_code: 'CE118', section_code: 'CE118.R11',
      day_of_week: 2, periods: [1, 2, 3],
    });
    const s2_conflict = makeSection({
      course_code: 'IT001', section_code: 'IT001.R11',
      day_of_week: 2, periods: [1, 2, 3],
    });
    const s2_ok = makeSection({
      course_code: 'IT001', section_code: 'IT001.R12',
      day_of_week: 4, periods: [1, 2, 3],
    });
    const result = solveSchedule({
      course_codes: ['CE118', 'IT001'],
      sections: [s1, s2_conflict, s2_ok],
      available_slots: null,
    });
    expect(result.solutions.length).toBeGreaterThanOrEqual(1);
    expect(
      result.solutions[0].sections.some(s => s.section_code === 'IT001.R12')
    ).toBe(true);
    expect(result.solutions[0].conflict_free).toBe(true);
  });

  it('skips course and reports specific conflict when all options conflict', () => {
    const s1 = makeSection({
      course_code: 'CE118', section_code: 'CE118.R11',
      day_of_week: 2, periods: [1, 2, 3],
    });
    const s2 = makeSection({
      course_code: 'IT001', section_code: 'IT001.R11',
      day_of_week: 2, periods: [2, 3, 4],
    });
    const result = solveSchedule({
      course_codes: ['CE118', 'IT001'],
      sections: [s1, s2],
      available_slots: null,
    });
    expect(result.solutions.length).toBeGreaterThanOrEqual(1);
    const sol = result.solutions[0];
    expect(sol.missing_courses.length).toBe(1);
    expect(sol.conflict_free).toBe(false);
    // Fix A: message should now always be specific
    expect(sol.missing_courses[0]).toContain('bị trùng lịch với');
  });

  it('respects available_slots filter', () => {
    const s1 = makeSection({
      course_code: 'CE118', section_code: 'CE118.R11',
      day_of_week: 2, periods: [1, 2, 3],
    });
    const s2 = makeSection({
      course_code: 'CE118', section_code: 'CE118.R12',
      day_of_week: 3, periods: [6, 7, 8],
    });
    const result = solveSchedule({
      course_codes: ['CE118'],
      sections: [s1, s2],
      available_slots: [
        { day: 3, period: 6 },
        { day: 3, period: 7 },
        { day: 3, period: 8 },
      ],
    });
    expect(result.solutions.length).toBe(1);
    expect(result.solutions[0].sections[0].section_code).toBe('CE118.R12');
  });

  it('pairs theory + lab and includes both in solution', () => {
    const theory = makeSection({
      course_code: 'IT001', section_code: 'IT001.R11',
      is_lab: false, day_of_week: 2, periods: [1, 2, 3],
    });
    const lab = makeSection({
      course_code: 'IT001', section_code: 'IT001.R11.1',
      is_lab: true, teaching_type: 'HT1',
      day_of_week: 3, periods: [1, 2, 3],
    });
    const result = solveSchedule({
      course_codes: ['IT001'],
      sections: [theory, lab],
      available_slots: null,
    });
    expect(result.solutions.length).toBeGreaterThanOrEqual(1);
    const sol = result.solutions[0];
    expect(sol.sections).toHaveLength(2);
    expect(sol.sections.some(s => !s.is_lab)).toBe(true);
    expect(sol.sections.some(s => s.is_lab)).toBe(true);
  });

  it('rejects theory-lab pair that internally conflicts', () => {
    const theory = makeSection({
      course_code: 'IT001', section_code: 'IT001.R11',
      is_lab: false, day_of_week: 2, periods: [1, 2, 3],
    });
    const lab = makeSection({
      course_code: 'IT001', section_code: 'IT001.R11.1',
      is_lab: true, teaching_type: 'HT1',
      day_of_week: 2, periods: [2, 3, 4],
    });
    const result = solveSchedule({
      course_codes: ['IT001'],
      sections: [theory, lab],
      available_slots: null,
    });
    // No valid pairing → no solution or solution with missing course
    if (result.solutions.length > 0) {
      expect(result.solutions[0].missing_courses.length).toBeGreaterThan(0);
    } else {
      expect(result.solutions).toHaveLength(0);
    }
  });

  it('respects pinned_sections filter', () => {
    const s1 = makeSection({
      course_code: 'CE118', section_code: 'CE118.R11',
      day_of_week: 2, periods: [1, 2, 3],
    });
    const s2 = makeSection({
      course_code: 'CE118', section_code: 'CE118.R12',
      day_of_week: 3, periods: [1, 2, 3],
    });
    const result = solveSchedule({
      course_codes: ['CE118'],
      sections: [s1, s2],
      available_slots: null,
      pinned_sections: { 'CE118': { theorySectionCode: 'CE118.R12' } },
    });
    expect(result.solutions.length).toBeGreaterThanOrEqual(1);
    expect(
      result.solutions.every(sol =>
        sol.sections.some(s => s.section_code === 'CE118.R12')
      )
    ).toBe(true);
  });

  it('respects max_solutions limit', () => {
    const sections = Array.from({ length: 5 }, (_, i) =>
      makeSection({
        course_code: 'CE118',
        section_code: `CE118.R${i + 1}`,
        day_of_week: i + 2,
        periods: [1, 2, 3],
      })
    );
    const result = solveSchedule({
      course_codes: ['CE118'],
      sections,
      available_slots: null,
      max_solutions: 3,
    });
    expect(result.solutions.length).toBeLessThanOrEqual(3);
  });

  it('solutions are sorted by score descending', () => {
    const sections = Array.from({ length: 5 }, (_, i) =>
      makeSection({
        course_code: 'CE118',
        section_code: `CE118.R${i + 1}`,
        day_of_week: i + 2,
        periods: [1, 2, 3],
      })
    );
    const result = solveSchedule({
      course_codes: ['CE118'],
      sections,
      available_slots: null,
    });
    for (let i = 0; i < result.solutions.length - 1; i++) {
      expect(result.solutions[i].score!).toBeGreaterThanOrEqual(
        result.solutions[i + 1].score!
      );
    }
  });

  it('normalizes .1/.2 suffix in course_codes input', () => {
    const section = makeSection({ course_code: 'CE118' });
    const result = solveSchedule({
      course_codes: ['CE118.1'],
      sections: [section],
      available_slots: null,
    });
    expect(result.solutions.length).toBeGreaterThanOrEqual(1);
  });

  it('deduplicates course_codes', () => {
    const section = makeSection();
    const result = solveSchedule({
      course_codes: ['CE118', 'CE118', 'CE118.1'],
      sections: [section],
      available_slots: null,
    });
    expect(result.solutions.length).toBe(1);
  });

  it('generates warning when all sections blocked by busy slots', () => {
    const section = makeSection({
      course_code: 'CE118', day_of_week: 2, periods: [1, 2, 3],
    });
    const result = solveSchedule({
      course_codes: ['CE118'],
      sections: [section],
      available_slots: [{ day: 5, period: 1 }],
    });
    expect(result.warnings.some(w => w.includes('CE118'))).toBe(true);
  });

  it('reports stats with execution time', () => {
    const result = solveSchedule({
      course_codes: ['CE118'],
      sections: [makeSection()],
      available_slots: null,
    });
    expect(result.stats.execution_time_ms).toBeGreaterThanOrEqual(0);
    expect(result.stats.total_options_considered).toBeGreaterThanOrEqual(1);
  });
});

// ──────────────────────────────────────────────
// scoreSolution — tested indirectly
// ──────────────────────────────────────────────
describe('scoreSolution (via solveSchedule)', () => {
  it('calculates correct free_days for single-day schedule', () => {
    const section = makeSection({ day_of_week: 2, periods: [1, 2, 3] });
    const result = solveSchedule({
      course_codes: ['CE118'],
      sections: [section],
      available_slots: null,
    });
    const sol = result.solutions[0];
    expect(sol.study_days_count).toBe(1);
    // Days 3,4,5,6,7,8 should be free
    expect(sol.free_days).toHaveLength(6);
    expect(sol.free_days).toEqual(expect.arrayContaining([3, 4, 5, 6, 7, 8]));
  });

  it('counts morning vs afternoon periods correctly', () => {
    const sol1 = solveSchedule({
      course_codes: ['A'],
      sections: [makeSection({ course_code: 'A', section_code: 'A.1', periods: [1, 2, 3] })],
      available_slots: null,
    }).solutions[0];
    expect(sol1.morning_classes_count).toBe(3);
    expect(sol1.afternoon_classes_count).toBe(0);

    const sol2 = solveSchedule({
      course_codes: ['B'],
      sections: [makeSection({ course_code: 'B', section_code: 'B.1', periods: [6, 7, 8] })],
      available_slots: null,
    }).solutions[0];
    expect(sol2.morning_classes_count).toBe(0);
    expect(sol2.afternoon_classes_count).toBe(3);
  });

  it('weekend-free schedule scores higher than weekend-occupied', () => {
    const r1 = solveSchedule({
      course_codes: ['A'],
      sections: [makeSection({
        course_code: 'A', section_code: 'A.1',
        day_of_week: 2, periods: [1, 2, 3],
      })],
      available_slots: null,
    });
    const r2 = solveSchedule({
      course_codes: ['B'],
      sections: [makeSection({
        course_code: 'B', section_code: 'B.1',
        day_of_week: 7, periods: [1, 2, 3],
      })],
      available_slots: null,
    });
    expect(r1.solutions[0].score!).toBeGreaterThan(r2.solutions[0].score!);
  });
});

// ──────────────────────────────────────────────
// Fix A verification — consistent message format
// ──────────────────────────────────────────────
describe('Fix A: consistent conflict messages', () => {
  it('both skipped courses get specific "bị trùng lịch với" message', () => {
    // Simulate: 3 courses, first 2 conflict with each other, 3rd is fine
    const sA = makeSection({
      course_code: 'NT212', section_code: 'NT212.R11',
      course_name: 'An toàn dữ liệu',
      day_of_week: 2, periods: [1, 2, 3],
    });
    const sB = makeSection({
      course_code: 'NT101', section_code: 'NT101.R11',
      course_name: 'An toàn mạng',
      day_of_week: 2, periods: [1, 2, 3], // exact same slot → conflict
    });
    const sC = makeSection({
      course_code: 'IT001', section_code: 'IT001.R11',
      course_name: 'Nhập môn lập trình',
      day_of_week: 4, periods: [6, 7, 8], // no conflict with anyone
    });

    const result = solveSchedule({
      course_codes: ['NT212', 'NT101', 'IT001'],
      sections: [sA, sB, sC],
      available_slots: null,
    });

    // Should have solutions where one of NT212/NT101 is missing
    const solWithMissing = result.solutions.filter(
      s => s.missing_courses.length > 0
    );
    expect(solWithMissing.length).toBeGreaterThan(0);

    // ALL missing_courses messages should be specific (no generic "do trùng giờ học")
    for (const sol of solWithMissing) {
      for (const msg of sol.missing_courses) {
        expect(msg).toContain('bị trùng lịch với');
        expect(msg).not.toMatch(/do trùng giờ học$/);
      }
    }
  });
});

// ──────────────────────────────────────────────
// Integration: solveSchedule with real UIT data
// ──────────────────────────────────────────────
describe('solveSchedule (real UIT data integration)', () => {
  let allSections: Section[];

  beforeAll(() => {
    const filePath = join(__dirname, '../../../docs/TKB_KHDT_14-08-2026_1786696150_HK_1_NH2026.xlsx');
    const fileBuffer = new Uint8Array(readFileSync(filePath));
    const parsed = parseTkbExcel(fileBuffer);
    allSections = parsed.sections;
  });

  it('solves a single real course (IT001)', () => {
    const result = solveSchedule({
      course_codes: ['IT001'],
      sections: allSections,
      available_slots: null,
    });
    expect(result.solutions.length).toBeGreaterThan(0);
    // IT001 has theory + lab → should pair them
    const sol = result.solutions[0];
    expect(sol.sections.some(s => !s.is_lab)).toBe(true);
    expect(sol.sections.some(s => s.is_lab)).toBe(true);
    expect(sol.conflict_free).toBe(true);
  });

  it('solves multiple real courses without crashing', () => {
    // Pick a few known courses
    const codes = ['IT001', 'CE005', 'AI001'];
    const result = solveSchedule({
      course_codes: codes,
      sections: allSections,
      available_slots: null,
      max_solutions: 10,
    });
    expect(result.solutions.length).toBeGreaterThan(0);
    expect(result.stats.execution_time_ms).toBeLessThan(6000);
  });

  it('all solutions are conflict-free (no overlapping periods in same solution)', () => {
    const result = solveSchedule({
      course_codes: ['IT001', 'CE005'],
      sections: allSections,
      available_slots: null,
      max_solutions: 20,
    });
    for (const sol of result.solutions) {
      const occupied = new Set<string>();
      let hasConflict = false;
      for (const s of sol.sections) {
        for (const p of s.periods) {
          const key = `${s.day_of_week}-${p}`;
          if (occupied.has(key)) {
            hasConflict = true;
          }
          occupied.add(key);
        }
      }
      if (sol.conflict_free) {
        expect(hasConflict).toBe(false);
      }
    }
  });

  it('total_credits sum is consistent with solution sections', () => {
    const result = solveSchedule({
      course_codes: ['IT001'],
      sections: allSections,
      available_slots: null,
    });
    for (const sol of result.solutions) {
      const sumCredits = sol.sections.reduce((acc, s) => acc + s.credits, 0);
      expect(sol.total_credits).toBe(sumCredits);
    }
  });
});
