import { describe, it, expect } from "vitest";
import { solveSchedule, getBaseCourseCode, getBaseSectionCode } from "./scheduler-solver";
import { Section } from "@/types/scheduler";

const createMockSection = (partial: Partial<Section> & { section_code: string; course_code: string; day_of_week: number; periods: number[]; is_lab: boolean }): Section => ({
  course_name: "Mock Course",
  credits: 4,
  teaching_type: partial.is_lab ? "TH" : "LT",
  biweekly: false,
  room: "A101",
  capacity: 40,
  instructor_name: "GV Test",
  program: "CQUI",
  department: "KTPM",
  ...partial,
});

describe("scheduler-solver", () => {
  it("getBaseCourseCode & getBaseSectionCode operate correctly", () => {
    expect(getBaseCourseCode("IT001.1")).toBe("IT001");
    expect(getBaseCourseCode("IT001.2")).toBe("IT001");
    expect(getBaseCourseCode("IT001")).toBe("IT001");

    expect(getBaseSectionCode("IT001.N11.1")).toBe("IT001.N11");
    expect(getBaseSectionCode("IT001.N11.2")).toBe("IT001.N11");
    expect(getBaseSectionCode("IT001.N11")).toBe("IT001.N11");
  });

  it("selects TH.1 by default when course has both TH.1 and TH.2", () => {
    const mockSections: Section[] = [
      createMockSection({
        course_code: "IT001",
        course_name: "Nhập môn lập trình",
        section_code: "IT001.N11",
        is_lab: false,
        day_of_week: 2,
        periods: [1, 2, 3],
      }),
      createMockSection({
        course_code: "IT001",
        course_name: "Nhập môn lập trình (TH)",
        section_code: "IT001.N11.1",
        is_lab: true,
        day_of_week: 4,
        periods: [1, 2, 3],
      }),
      createMockSection({
        course_code: "IT001",
        course_name: "Nhập môn lập trình (TH)",
        section_code: "IT001.N11.2",
        is_lab: true,
        day_of_week: 4,
        periods: [1, 2, 3],
      }),
    ];

    const result = solveSchedule({
      course_codes: ["IT001"],
      sections: mockSections,
      available_slots: null,
    });

    expect(result.solutions.length).toBe(1);
    const sol = result.solutions[0];
    expect(sol.sections.some((s) => s.section_code === "IT001.N11")).toBe(true);
    expect(sol.sections.some((s) => s.section_code === "IT001.N11.1")).toBe(true);
    expect(sol.sections.some((s) => s.section_code === "IT001.N11.2")).toBe(false);
  });

  it("honors explicitly pinned TH.2 when user selects it", () => {
    const mockSections: Section[] = [
      createMockSection({
        course_code: "IT001",
        course_name: "Nhập môn lập trình",
        section_code: "IT001.N11",
        is_lab: false,
        day_of_week: 2,
        periods: [1, 2, 3],
      }),
      createMockSection({
        course_code: "IT001",
        course_name: "Nhập môn lập trình (TH)",
        section_code: "IT001.N11.1",
        is_lab: true,
        day_of_week: 4,
        periods: [1, 2, 3],
      }),
      createMockSection({
        course_code: "IT001",
        course_name: "Nhập môn lập trình (TH)",
        section_code: "IT001.N11.2",
        is_lab: true,
        day_of_week: 4,
        periods: [1, 2, 3],
      }),
    ];

    const result = solveSchedule({
      course_codes: ["IT001"],
      sections: mockSections,
      available_slots: null,
      pinned_sections: {
        IT001: {
          theorySectionCode: "IT001.N11",
          labSectionCode: "IT001.N11.2",
        },
      },
    });

    expect(result.solutions.length).toBe(1);
    const sol = result.solutions[0];
    expect(sol.sections.some((s) => s.section_code === "IT001.N11.2")).toBe(true);
  });
});
