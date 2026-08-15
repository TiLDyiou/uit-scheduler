export interface Section {
  course_code: string; // MÃ MH, e.g. "CE118"
  section_code: string; // MÃ LỚP, e.g. "CE118.R11" or "CE118.R11.1"
  course_name: string; // TÊN MÔN HỌC
  credits: number; // SỐ TC / TỐ TC
  is_lab: boolean; // True if THỰC HÀNH == 1 or HT1/HT2
  teaching_type: string; // HTGD: LT, HT1, HT2, TG
  day_of_week: number; // 2=Thứ 2 … 7=Thứ 7, 8=CN
  periods: number[]; // e.g. [1, 2, 3]
  biweekly: boolean; // True if CÁCH TUẦN == 2
  room: string; // PHÒNG HỌC
  capacity: number; // SĨ SỐ
  instructor_name: string; // TÊN GIẢNG VIÊN / TRỢ GIẢNG
  program: string; // HỆ ĐT: CQUI, CLC, CNTN, CTTT...
  department: string; // KHOA QL: KHMT, KTMT, HTTT, MMT&TT, KTPM, TTNT...
  startDate?: string;
  endDate?: string;
  note?: string;
}

export interface TimeSlot {
  day: number; // 2..8
  period: number; // 1..10
}

export interface ScheduleSolution {
  id?: string;
  sections: Section[];
  missing_courses: string[];
  conflict_free: boolean;
  total_credits: number;
  study_days_count: number;
  free_days: number[]; // days without any classes (2..8)
  morning_classes_count: number;
  afternoon_classes_count: number;
  score?: number;
}

export interface CourseSummary {
  code: string;
  name: string;
  baseCredits: number;
  labCredits: number;
  totalCredits: number;
  departments: string[];
  programs: string[];
  theorySections: Section[];
  labSections: Section[];
  allSections: Section[];
}

export interface PinnedCourseSection {
  theorySectionCode?: string; // Mã lớp LT cụ thể được chọn (vd: "CE118.R11")
  labSectionCode?: string; // Mã lớp TH cụ thể được chọn (vd: "CE118.R11.1")
}

export interface ParseExcelResult {
  sections: Section[];
  stats: {
    totalSheets: number;
    parsedSheets: number;
    sheetNames: string[];
    totalRows: number;
    uniqueCourses: number;
    theoryCount: number;
    labCount: number;
    skippedUnscheduled: number;
    skippedThesis: number;
  };
  warnings: string[];
}

export interface SolveRequest {
  course_codes: string[];
  sections: Section[];
  available_slots: TimeSlot[] | null;
  pinned_sections?: Record<string, PinnedCourseSection>;
  pinned_section_codes?: string[];
  max_solutions?: number;
}

export interface SolveResult {
  solutions: ScheduleSolution[];
  warnings: string[];
  stats: {
    total_options_considered: number;
    execution_time_ms: number;
  };
}

export type StepType = "selection" | "preference" | "results";
