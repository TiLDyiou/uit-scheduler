"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { Section, CourseSummary, PinnedCourseSection } from "@/types/scheduler";
import { parseTkbExcel } from "@/lib/excel-parser";
import {
  getBaseCourseCode,
  getBaseSectionCode,
  doSectionsOverlap,
} from "@/lib/scheduler-solver";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  X,
  Check,
  Search,
  AlertTriangle,
  ChevronRight,
  Info,
  Calendar,
  Layers,
  Building2,
  Trash2,
  FileUp,
  Pin,
  Lock,
  Sparkles,
  RotateCcw,
} from "lucide-react";

interface Props {
  sections: Section[];
  setSections: (s: Section[]) => void;
  onNext: (selectedCodes: string[]) => void;
  onQuickSolve?: () => void;
  canQuickSolve?: boolean;
  selectedCourseCodes: string[];
  setSelectedCourseCodes: (codes: string[]) => void;
  pinnedSections: Record<string, PinnedCourseSection>;
  setPinnedSections: React.Dispatch<
    React.SetStateAction<Record<string, PinnedCourseSection>>
  >;
}

export default function Step1CourseSelection({
  sections,
  setSections,
  onNext,
  onQuickSolve,
  canQuickSolve = false,
  selectedCourseCodes,
  setSelectedCourseCodes,
  pinnedSections,
  setPinnedSections,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [selectedProgram, setSelectedProgram] = useState<string>("ALL");
  const [inspectCourse, setInspectCourse] = useState<CourseSummary | null>(
    null,
  );
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    if (!inspectCourse) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setInspectCourse(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inspectCourse]);

  // Group sections by base course code
  const courseMap = useMemo(() => {
    const map: Record<string, CourseSummary> = {};

    for (const s of sections) {
      const baseCode = getBaseCourseCode(s.course_code);
      if (!map[baseCode]) {
        map[baseCode] = {
          code: baseCode,
          name: s.course_name,
          baseCredits: 0,
          labCredits: 0,
          totalCredits: 0,
          departments: [],
          programs: [],
          theorySections: [],
          labSections: [],
          allSections: [],
        };
      }

      const item = map[baseCode];
      item.allSections.push(s);

      if (s.is_lab) {
        item.labSections.push(s);
        if (s.credits > item.labCredits) item.labCredits = s.credits;
      } else {
        item.theorySections.push(s);
        item.name = s.course_name;
        if (s.credits > item.baseCredits) item.baseCredits = s.credits;
      }

      if (s.department && !item.departments.includes(s.department)) {
        item.departments.push(s.department);
      }
      if (s.program && !item.programs.includes(s.program)) {
        item.programs.push(s.program);
      }

      item.totalCredits = item.baseCredits + item.labCredits;
    }

    return map;
  }, [sections]);

  // Extract all unique departments and programs for filters
  const allDepartments = useMemo(() => {
    const depts = new Set<string>();
    for (const c of Object.values(courseMap)) {
      c.departments.forEach((d) => depts.add(d));
    }
    return Array.from(depts).filter(Boolean).sort();
  }, [courseMap]);

  // Filter courses based on search query, department, and program
  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return Object.values(courseMap)
      .filter((c) => {
        const matchCode = c.code.toLowerCase().includes(query);
        const matchName = c.name.toLowerCase().includes(query);
        const matchLecturer = c.allSections.some((s) =>
          s.instructor_name.toLowerCase().includes(query),
        );
        const matchesSearch = !query || matchCode || matchName || matchLecturer;
        const matchesDept =
          selectedDept === "ALL" || c.departments.includes(selectedDept);
        const matchesProg =
          selectedProgram === "ALL" || c.programs.includes(selectedProgram);

        return matchesSearch && matchesDept && matchesProg;
      })
      .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [courseMap, searchQuery, selectedDept, selectedProgram]);

  // Calculate total credits of selected courses
  const totalSelectedCredits = useMemo(() => {
    return selectedCourseCodes.reduce((sum, code) => {
      const c = courseMap[code];
      return sum + (c?.totalCredits || 0);
    }, 0);
  }, [selectedCourseCodes, courseMap]);

  const handleProcessFile = async (file: File) => {
    setUploading(true);
    setUploadMessage(null);
    try {
      const buffer = await file.arrayBuffer();
      const result = parseTkbExcel(buffer);

      if (result.sections.length > 0) {
        setSections(result.sections);
        const sheetMsg =
          result.stats.parsedSheets > 1
            ? `Đã nạp ${result.stats.parsedSheets} sheet (${result.stats.sheetNames.join(", ")}) với ${result.sections.length} lớp học (${result.stats.uniqueCourses} môn)`
            : `Đã nạp ${result.sections.length} lớp học (${result.stats.uniqueCourses} môn)`;
        setUploadMessage(sheetMsg);
      } else {
        alert("Không tìm thấy dữ liệu thời khóa biểu hợp lệ trong file Excel!");
      }
    } catch (err) {
      console.error(err);
      alert(
        "Đã xảy ra lỗi khi đọc file Excel. Vui lòng kiểm tra định dạng file.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessFile(file);
  };

  const toggleCourse = (code: string) => {
    const next = new Set(selectedCourseCodes);
    if (next.has(code)) {
      next.delete(code);
      // Also clear pinned section if removing course
      setPinnedSections((prev) => {
        const copy = { ...prev };
        delete copy[code];
        return copy;
      });
    } else {
      next.add(code);
    }
    setSelectedCourseCodes(Array.from(next));
  };

  const handleClearAll = () => {
    setSelectedCourseCodes([]);
    setPinnedSections({});
  };

  // Pinning actions
  const handleSelectTheorySection = (
    courseCode: string,
    sectionCode: string,
  ) => {
    const baseCC = getBaseCourseCode(courseCode);
    // Automatically ensure course is selected
    if (
      !selectedCourseCodes.includes(baseCC) &&
      !selectedCourseCodes.includes(courseCode)
    ) {
      setSelectedCourseCodes([...selectedCourseCodes, baseCC]);
    }

    setPinnedSections((prev) => {
      const current = prev[baseCC] || prev[courseCode] || {};
      const isAlreadySelected = current.theorySectionCode === sectionCode;
      const nextTheory = isAlreadySelected ? undefined : sectionCode;

      // If switching theory, check if current lab still matches
      let nextLab = current.labSectionCode;
      if (nextLab && nextTheory && getBaseSectionCode(nextLab) !== nextTheory) {
        nextLab = undefined; // reset mismatched lab
      }

      const copy = { ...prev };
      delete copy[courseCode];
      delete copy[baseCC];

      if (!nextTheory && !nextLab) {
        return copy;
      }

      return {
        ...copy,
        [baseCC]: {
          theorySectionCode: nextTheory,
          labSectionCode: nextLab,
        },
      };
    });
  };

  const handleSelectLabSection = (
    courseCode: string,
    labSectionCode: string,
  ) => {
    const baseCC = getBaseCourseCode(courseCode);
    // Automatically ensure course is selected
    if (
      !selectedCourseCodes.includes(baseCC) &&
      !selectedCourseCodes.includes(courseCode)
    ) {
      setSelectedCourseCodes([...selectedCourseCodes, baseCC]);
    }

    const parentTheoryCode = getBaseSectionCode(labSectionCode);

    setPinnedSections((prev) => {
      const current = prev[baseCC] || prev[courseCode] || {};
      const isAlreadySelected = current.labSectionCode === labSectionCode;
      const nextLab = isAlreadySelected ? undefined : labSectionCode;

      // When selecting a lab, automatically link and select the corresponding theory class!
      const nextTheory = nextLab ? parentTheoryCode : current.theorySectionCode;

      const copy = { ...prev };
      delete copy[courseCode];
      delete copy[baseCC];

      if (!nextTheory && !nextLab) {
        return copy;
      }

      return {
        ...copy,
        [baseCC]: {
          theorySectionCode: nextTheory,
          labSectionCode: nextLab,
        },
      };
    });
  };

  const handleResetCoursePin = (courseCode: string) => {
    const baseCC = getBaseCourseCode(courseCode);
    setPinnedSections((prev) => {
      const copy = { ...prev };
      delete copy[courseCode];
      delete copy[baseCC];
      return copy;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        className="hidden"
        accept=".xlsx,.xls"
      />

      {/* Upload Zone (Unified Dropzone when empty, compact bar when loaded) */}
      {sections.length === 0 ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-2 rounded-[2rem] border transition-all duration-300 cursor-pointer group ${
            isDragOver
              ? "border-[var(--color-blue)] bg-[var(--color-blue)]/10 scale-[1.005]"
              : "border-[var(--border-muted)] bg-[var(--bg-storm)] shadow-md hover:border-[var(--color-blue)]/50"
          }`}
        >
          <div className="rounded-[1.6rem] bg-[var(--bg-panel)] p-10 sm:p-14 border-2 border-dashed border-[var(--border-terminal)] group-hover:border-[var(--color-blue)] flex flex-col items-center justify-center text-center space-y-5 transition-all">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-blue)]/10 text-[var(--color-blue)] border border-[var(--color-blue)]/25 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
              <FileSpreadsheet className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-lg">
              <h2 className="text-lg sm:text-xl font-bold text-[var(--fg-editor)] tracking-tight">
                Nhập File Thời Khóa Biểu Excel (UIT)
              </h2>
              <p className="text-sm font-medium text-[var(--fg-markdown)]">
                Kéo thả file Excel TKB vào đây hoặc nhấp để duyệt file từ máy
                tính
              </p>
            </div>

            <button
              type="button"
              disabled={uploading}
              className="px-6 py-3 rounded-full bg-[var(--color-blue)] hover:bg-[var(--color-blue)]/90 text-[var(--color-btn-text)] font-bold text-xs sm:text-sm shadow-lg shadow-[var(--color-blue)]/25 transition-all group-hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>
                {uploading
                  ? "Đang đọc dữ liệu Excel..."
                  : "Chọn file Excel từ thiết bị"}
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Compact Top Bar when data is loaded */}
          <div className="p-1.5 rounded-[1.75rem] border border-[var(--border-muted)] bg-[var(--bg-storm)] shadow-sm">
            <div className="rounded-[1.4rem] bg-[var(--bg-panel)] px-5 py-3.5 border border-[var(--border-muted)]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-[var(--color-green)]/10 text-[var(--color-green)] border border-[var(--color-green)]/20 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-[var(--fg-editor)] truncate">
                    {uploadMessage ||
                      `Đã nạp ${sections.length} lớp học (${Object.keys(courseMap).length} môn)`}
                  </p>
                  <p className="text-[11px] text-[var(--fg-comments)]">
                    Đang sử dụng dữ liệu TKB từ file Excel. Bạn có thể tải file
                    khác bất kỳ lúc nào.
                  </p>
                </div>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 rounded-full bg-[var(--bg-storm)] hover:bg-[var(--border-muted)] text-[var(--fg-editor)] border border-[var(--border-muted)] font-bold text-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shrink-0 self-start sm:self-auto"
              >
                <UploadCloud className="w-3.5 h-3.5 text-[var(--color-blue)]" />
                <span>{uploading ? "Đang nạp..." : "Tải file khác"}</span>
              </button>
            </div>
          </div>

          {/* Main Selection Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Selected Courses (col-span-5) */}
            <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-4">
              <div className="p-1.5 rounded-[1.75rem] bg-[var(--bg-storm)] border border-[var(--border-muted)] shadow-md shadow-black/5 flex flex-col h-[600px]">
                <div className="rounded-[1.4rem] bg-[var(--bg-panel)] border border-[var(--border-muted)]/60 flex flex-col h-full overflow-hidden">
                  {/* Panel Header */}
                  <div className="p-4 border-b border-[var(--border-muted)] bg-[var(--bg-storm)]/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[var(--color-blue)]" />
                      <h3 className="text-sm font-bold text-[var(--fg-editor)]">
                        Môn học đã chọn
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[var(--color-blue)]/10 text-[var(--color-blue)] border border-[var(--color-blue)]/25">
                        {selectedCourseCodes.length} môn
                      </span>
                      {selectedCourseCodes.length > 0 && (
                        <button
                          onClick={handleClearAll}
                          className="p-1 text-[var(--fg-comments)] hover:text-[var(--color-red)] transition-colors"
                          title="Xóa tất cả môn đã chọn"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Selected Courses Scroll List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
                    {selectedCourseCodes.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[var(--fg-comments)]">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--bg-storm)] border border-[var(--border-muted)] flex items-center justify-center mb-3">
                          <CheckCircle2 className="w-6 h-6 opacity-40" />
                        </div>
                        <p className="text-sm font-semibold text-[var(--fg-editor)]">
                          Chưa chọn môn học nào
                        </p>
                        <p className="text-xs mt-1 text-[var(--fg-comments)] max-w-xs">
                          Hãy nhấp chọn các môn từ danh mục bên cạnh, hoặc bấm
                          biểu tượng mắt để chọn cụ thể mã lớp bạn muốn học.
                        </p>
                      </div>
                    ) : (
                      selectedCourseCodes.map((code) => {
                        const c = courseMap[code];
                        if (!c) return null;
                        const pin = pinnedSections[code];
                        const isPinned =
                          pin && (pin.theorySectionCode || pin.labSectionCode);

                        return (
                          <div
                            key={code}
                            className={`p-3 rounded-2xl border transition-all duration-200 ${
                              isPinned
                                ? "bg-[var(--color-blue)]/10 border-[var(--color-blue)]/40 shadow-sm"
                                : "bg-[var(--color-blue)]/5 border-[var(--color-blue)]/20 hover:border-[var(--color-blue)]/40"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-[var(--color-blue)] text-[var(--color-btn-text)] font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm">
                                  {c.totalCredits} TC
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-xs sm:text-sm font-bold text-[var(--fg-editor)] truncate">
                                    {c.name}
                                  </h4>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--color-blue)]/15 text-[var(--color-blue)]">
                                      {c.code}
                                    </span>
                                    {c.labSections.length > 0 && (
                                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--color-orange)]/15 text-[var(--color-orange)]">
                                        Có TH
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => toggleCourse(code)}
                                  className="p-1.5 text-[var(--fg-comments)] hover:text-[var(--color-red)] rounded-lg hover:bg-[var(--bg-storm)] transition-colors"
                                  title="Bỏ chọn môn này"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Pinned Section Status & Quick Switcher */}
                            <div className="mt-2 pt-2 border-t border-[var(--border-muted)]/50 flex items-center justify-between text-[11px]">
                              {isPinned ? (
                                <div className="flex items-center gap-1.5 text-[var(--color-blue)] font-bold truncate">
                                  <Lock className="w-3 h-3 shrink-0" />
                                  <span className="truncate">
                                    Cố định:{" "}
                                    {[pin.theorySectionCode, pin.labSectionCode]
                                      .filter(Boolean)
                                      .join(" + ")}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[var(--fg-comments)] italic flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-[var(--color-yellow)]" />{" "}
                                  Tự động tìm lớp
                                </span>
                              )}

                              <div className="flex items-center gap-1 shrink-0 ml-2">
                                {isPinned && (
                                  <button
                                    type="button"
                                    onClick={() => handleResetCoursePin(code)}
                                    className="text-[10px] text-[var(--fg-comments)] hover:text-[var(--color-red)] hover:underline flex items-center gap-0.5"
                                    title="Hủy cố định (Xếp tự động)"
                                  >
                                    <RotateCcw className="w-2.5 h-2.5" /> Hủy cố
                                    định
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setInspectCourse(c)}
                                  className="text-[10px] text-[var(--color-blue)] hover:underline font-bold"
                                >
                                  {isPinned ? "Đổi lớp" : "Chọn lớp"}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Bottom Credits Summary & Next CTA */}
                  <div className="p-4 border-t border-[var(--border-muted)] bg-[var(--bg-storm)]/60 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--fg-markdown)] font-medium">
                        Tổng tín chỉ đăng ký:
                      </span>
                      <span
                        className={`text-base font-extrabold ${
                          totalSelectedCredits > 0 && totalSelectedCredits < 14
                            ? "text-[var(--color-orange)]"
                            : "text-[var(--color-blue)]"
                        }`}
                      >
                        {totalSelectedCredits} TC
                      </span>
                    </div>

                    {totalSelectedCredits > 0 && totalSelectedCredits < 14 && (
                      <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[var(--color-orange)]/10 border border-[var(--color-orange)]/25">
                        <AlertTriangle className="w-4 h-4 text-[var(--color-orange)] shrink-0 mt-0.5" />
                        <p className="text-[11px] text-[var(--color-orange)] leading-tight font-medium">
                          Hiện dưới <strong>14 tín chỉ</strong>. Khuyến khích
                          đăng ký tối thiểu 14 TC/học kỳ.
                        </p>
                      </div>
                    )}

                    {canQuickSolve && onQuickSolve ? (
                      <div className="space-y-2">
                        <button
                          disabled={selectedCourseCodes.length === 0}
                          onClick={onQuickSolve}
                          className="w-full py-3 rounded-full bg-[var(--color-blue)] hover:bg-[var(--color-blue)]/90 text-[var(--color-btn-text)] font-bold text-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-[var(--color-blue)]/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                        >
                          <Sparkles className="w-4 h-4 text-[var(--color-yellow)]" />
                          <span>Xếp lịch ngay (Dùng khung giờ đã lưu)</span>
                          <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </button>
                        <button
                          disabled={selectedCourseCodes.length === 0}
                          onClick={() => onNext(selectedCourseCodes)}
                          className="w-full py-2.5 rounded-full border border-[var(--border-muted)] bg-[var(--bg-storm)] hover:bg-[var(--bg-panel)] text-[var(--fg-markdown)] hover:text-[var(--fg-editor)] font-semibold text-xs transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-1.5"
                        >
                          <span>Tùy chỉnh khung giờ bận (Bước 2)</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        disabled={selectedCourseCodes.length === 0}
                        onClick={() => onNext(selectedCourseCodes)}
                        className="w-full py-3 rounded-full bg-[var(--color-blue)] hover:bg-[var(--color-blue)]/90 text-[var(--color-btn-text)] font-bold text-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-[var(--color-blue)]/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                      >
                        <span>Tiếp tục sang bước Khung giờ</span>
                        <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Course Catalog & Filters (col-span-7) */}
            <div className="lg:col-span-7">
              <div className="p-1.5 rounded-[1.75rem] bg-[var(--bg-storm)] border border-[var(--border-muted)] shadow-md shadow-black/5 flex flex-col h-[600px]">
                <div className="rounded-[1.4rem] bg-[var(--bg-panel)] border border-[var(--border-muted)]/60 flex flex-col h-full overflow-hidden">
                  {/* Search and Filters Header */}
                  <div className="p-4 border-b border-[var(--border-muted)] space-y-3 bg-[var(--bg-storm)]/30">
                    <div className="relative">
                      <Search className="w-4 h-4 text-[var(--fg-comments)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Tìm theo mã môn (CE118), tên môn học, hoặc tên giảng viên..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border-muted)] bg-[var(--bg-storm)]/60 text-sm text-[var(--fg-editor)] placeholder-[var(--fg-comments)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)] transition-all"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-comments)] hover:text-[var(--fg-editor)]"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Department filter tags */}
                    {allDepartments.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="text-[var(--fg-comments)] flex items-center gap-1 shrink-0 font-medium">
                          <Building2 className="w-3.5 h-3.5" /> Khoa:
                        </span>
                        <button
                          onClick={() => setSelectedDept("ALL")}
                          className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                            selectedDept === "ALL"
                              ? "bg-[var(--color-blue)] text-[var(--color-btn-text)] shadow-sm"
                              : "bg-[var(--bg-storm)] text-[var(--fg-markdown)] hover:bg-[var(--border-muted)]"
                          }`}
                        >
                          Tất cả
                        </button>
                        {allDepartments.map((dept) => (
                          <button
                            key={dept}
                            onClick={() => setSelectedDept(dept)}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                              selectedDept === dept
                                ? "bg-[var(--color-blue)] text-[var(--color-btn-text)] shadow-sm"
                                : "bg-[var(--bg-storm)] text-[var(--fg-markdown)] hover:bg-[var(--border-muted)]"
                            }`}
                          >
                            {dept}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Courses List */}
                  <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-muted)]/40 custom-scrollbar">
                    {filteredCourses.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center p-6 text-[var(--fg-comments)] text-center">
                        <Info className="w-8 h-8 opacity-40 mb-2" />
                        <p className="text-sm font-semibold text-[var(--fg-editor)]">
                          Không tìm thấy môn học nào phù hợp
                        </p>
                        <p className="text-xs text-[var(--fg-comments)] mt-1">
                          Thử tìm kiếm với từ khóa khác hoặc bỏ các bộ lọc Khoa.
                        </p>
                      </div>
                    ) : (
                      filteredCourses.map((course) => {
                        const isSelected = selectedCourseCodes.includes(
                          course.code,
                        );
                        const pin = pinnedSections[course.code];
                        const isPinned =
                          pin && (pin.theorySectionCode || pin.labSectionCode);

                        return (
                          <div
                            key={course.code}
                            onClick={() => toggleCourse(course.code)}
                            className={`p-3.5 flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-[var(--color-blue)]/10 border-l-4 border-l-[var(--color-blue)]"
                                : "hover:bg-[var(--bg-storm)]/60 border-l-4 border-l-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0 transition-colors ${
                                  isSelected
                                    ? "bg-[var(--color-blue)] text-[var(--color-btn-text)] shadow-sm"
                                    : "bg-[var(--bg-storm)] text-[var(--fg-markdown)] border border-[var(--border-muted)]"
                                }`}
                              >
                                {course.totalCredits} TC
                              </div>

                              <div className="min-w-0">
                                <p
                                  className={`text-sm font-bold truncate ${
                                    isSelected
                                      ? "text-[var(--color-blue)]"
                                      : "text-[var(--fg-editor)]"
                                  }`}
                                >
                                  {course.name}
                                </p>

                                <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-[var(--fg-comments)]">
                                  <span className="font-mono font-bold text-[var(--fg-markdown)]">
                                    {course.code}
                                  </span>
                                  <span>•</span>
                                  <span>
                                    {course.theorySections.length} lớp LT
                                  </span>
                                  {course.labSections.length > 0 && (
                                    <>
                                      <span>•</span>
                                      <span className="text-[var(--color-orange)] font-bold">
                                        {course.labSections.length} lớp TH
                                      </span>
                                    </>
                                  )}
                                  {isPinned && (
                                    <>
                                      <span>•</span>
                                      <span className="text-[var(--color-blue)] font-bold flex items-center gap-0.5">
                                        <Lock className="w-3 h-3" /> Đã chọn lớp
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInspectCourse(course);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                                  isPinned
                                    ? "bg-[var(--color-blue)]/15 text-[var(--color-blue)] border-[var(--color-blue)]/30 hover:bg-[var(--color-blue)]/25"
                                    : "text-[var(--fg-comments)] hover:text-[var(--fg-editor)] hover:bg-[var(--bg-storm)] border-[var(--border-muted)]/60"
                                }`}
                                title="Xem và chọn cụ thể mã lớp"
                              >
                                Chọn lớp
                              </button>

                              <div
                                className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                                  isSelected
                                    ? "bg-[var(--color-blue)] text-[var(--color-btn-text)] shadow-sm"
                                    : "border border-[var(--border-terminal)] bg-transparent"
                                }`}
                              >
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Class Section Inspection & Specific Selection Modal (Global Viewport Portal) */}
      {inspectCourse &&
        mounted &&
        (() => {
          const pin = pinnedSections[inspectCourse.code] || {};
          const hasPin = Boolean(pin.theorySectionCode || pin.labSectionCode);

          // Find all pinned sections belonging to other courses
          const otherPinnedSections: Section[] = [];
          for (const [courseCode, p] of Object.entries(pinnedSections)) {
            if (courseCode === inspectCourse.code) continue;
            if (p.theorySectionCode) {
              const sec = sections.find(
                (s) =>
                  !s.is_lab &&
                  s.section_code === p.theorySectionCode &&
                  getBaseCourseCode(s.course_code) === courseCode,
              );
              if (sec) otherPinnedSections.push(sec);
            }
            if (p.labSectionCode) {
              const sec = sections.find(
                (s) =>
                  s.is_lab &&
                  s.section_code === p.labSectionCode &&
                  getBaseCourseCode(s.course_code) === courseCode,
              );
              if (sec) otherPinnedSections.push(sec);
            }
          }

          const getDirectPinnedConflict = (s: Section) => {
            const colliding = otherPinnedSections.filter((other) =>
              doSectionsOverlap(s, other),
            );
            if (colliding.length === 0) return null;
            return colliding
              .map(
                (c) =>
                  `${c.section_code} (Thứ ${c.day_of_week === 8 ? "CN" : c.day_of_week}, Tiết ${c.periods.join(",")})`,
              )
              .join("; ");
          };

          // Filtered lab sections based on selected theory class
          const visibleLabSections = inspectCourse.labSections.filter((lab) => {
            if (!pin.theorySectionCode) return true;
            return (
              getBaseSectionCode(lab.section_code) === pin.theorySectionCode
            );
          });

          // Process & sort theory sections (non-conflicting first)
          const processedTheorySections = inspectCourse.theorySections
            .map((s) => {
              const directConflict = getDirectPinnedConflict(s);
              const matchingLabs = inspectCourse.labSections.filter(
                (lab) =>
                  getBaseSectionCode(lab.section_code) === s.section_code,
              );
              const hasValidLab =
                matchingLabs.length === 0 ||
                matchingLabs.some(
                  (lab) =>
                    !getDirectPinnedConflict(lab) && !doSectionsOverlap(s, lab),
                );

              let conflictMsg: string | null = null;
              if (directConflict) {
                conflictMsg = `Trùng với lớp cố định: ${directConflict}`;
              } else if (matchingLabs.length > 0 && !hasValidLab) {
                conflictMsg =
                  "Tất cả lớp TH của lớp này đều trùng với lớp cố định khác";
              }

              return {
                section: s,
                hasConflict: Boolean(conflictMsg),
                conflictMsg,
              };
            })
            .sort((a, b) => {
              if (a.hasConflict !== b.hasConflict)
                return a.hasConflict ? 1 : -1;
              if (a.section.day_of_week !== b.section.day_of_week) {
                return a.section.day_of_week - b.section.day_of_week;
              }
              return (a.section.periods[0] || 0) - (b.section.periods[0] || 0);
            });

          // Process & sort lab sections (non-conflicting first)
          const processedLabSections = visibleLabSections
            .map((s) => {
              const directConflict = getDirectPinnedConflict(s);
              const parentTheoryCode = getBaseSectionCode(s.section_code);
              const parentTheory = inspectCourse.theorySections.find(
                (ts) => ts.section_code === parentTheoryCode,
              );
              const parentConflict = parentTheory
                ? getDirectPinnedConflict(parentTheory)
                : null;

              let conflictMsg: string | null = null;
              if (directConflict) {
                conflictMsg = `Trùng với lớp cố định: ${directConflict}`;
              } else if (parentConflict) {
                conflictMsg = `Lớp LT (${parentTheoryCode}) trùng với: ${parentConflict}`;
              }

              return {
                section: s,
                hasConflict: Boolean(conflictMsg),
                conflictMsg,
              };
            })
            .sort((a, b) => {
              if (a.hasConflict !== b.hasConflict)
                return a.hasConflict ? 1 : -1;
              if (a.section.day_of_week !== b.section.day_of_week) {
                return a.section.day_of_week - b.section.day_of_week;
              }
              return (a.section.periods[0] || 0) - (b.section.periods[0] || 0);
            });

          return createPortal(
            <div
              onClick={() => setInspectCourse(null)}
              className="fixed inset-0 z-[100] w-screen h-screen flex items-center justify-center p-4 sm:p-6 bg-black/65 dark:bg-black/80 transition-opacity duration-200"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-3xl max-h-[88vh] my-auto rounded-[1.75rem] bg-[var(--bg-panel)] border border-[var(--border-terminal)] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
              >
                {/* Modal Header */}
                <div className="p-5 sm:p-6 border-b border-[var(--border-muted)] flex items-start justify-between bg-[var(--bg-storm)]/60 gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-blue)] shrink-0" />
                      <h3 className="text-base sm:text-lg font-bold text-[var(--fg-editor)] tracking-tight truncate">
                        {inspectCourse.name}
                      </h3>
                    </div>
                    <p className="text-xs text-[var(--fg-comments)] flex flex-wrap items-center gap-2">
                      <span>
                        Mã môn:{" "}
                        <strong className="font-mono text-[var(--fg-editor)]">
                          {inspectCourse.code}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        <strong>{inspectCourse.totalCredits}</strong> tín chỉ (
                        {inspectCourse.baseCredits} LT +{" "}
                        {inspectCourse.labCredits} TH)
                      </span>
                      {inspectCourse.departments.length > 0 && (
                        <>
                          <span>•</span>
                          <span>
                            Khoa: {inspectCourse.departments.join(", ")}
                          </span>
                        </>
                      )}
                    </p>
                  </div>

                  <button
                    onClick={() => setInspectCourse(null)}
                    className="p-2 rounded-full text-[var(--fg-comments)] hover:text-[var(--fg-editor)] hover:bg-[var(--bg-storm)] transition-colors shrink-0"
                    title="Đóng (Esc)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Pin Banner / Instruction */}
                <div className="px-5 py-3 bg-[var(--bg-storm)]/40 border-b border-[var(--border-muted)]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Pin className="w-4 h-4 text-[var(--color-blue)] shrink-0" />
                    <span className="text-[var(--fg-editor)]">
                      {hasPin ? (
                        <span>
                          Đang cố định:{" "}
                          <strong className="text-[var(--color-blue)] font-mono">
                            {[pin.theorySectionCode, pin.labSectionCode]
                              .filter(Boolean)
                              .join(" + ")}
                          </strong>
                        </span>
                      ) : (
                        <span className="text-[var(--fg-comments)]">
                          Nhấp vào mã lớp bên dưới để{" "}
                          <strong>chỉ định lớp học cụ thể</strong> (hệ thống sẽ
                          tự liên kết lớp LT và TH tương ứng).
                        </span>
                      )}
                    </span>
                  </div>

                  {hasPin && (
                    <button
                      type="button"
                      onClick={() => handleResetCoursePin(inspectCourse.code)}
                      className="px-3 py-1 rounded-lg bg-[var(--bg-storm)] hover:bg-[var(--border-muted)] text-[var(--fg-editor)] font-bold text-[11px] flex items-center gap-1 shrink-0 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" /> Đặt lại Tự động
                    </button>
                  )}
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar">
                  {/* 1. Theory Sections */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-blue)] flex items-center gap-1.5">
                        <Layers className="w-4 h-4" />
                        1. Lớp Lý thuyết
                      </h4>
                      {pin.theorySectionCode && (
                        <span className="text-[11px] font-bold text-[var(--color-blue)]">
                          ✓ Đã chọn: {pin.theorySectionCode}
                        </span>
                      )}
                    </div>

                    {processedTheorySections.length === 0 ? (
                      <div className="p-4 rounded-2xl bg-[var(--bg-storm)]/30 border border-[var(--border-muted)]/50 text-xs text-[var(--fg-comments)] italic text-center">
                        Không có lớp lý thuyết riêng (môn thực hành/đồ án)
                      </div>
                    ) : (
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {processedTheorySections.map(
                          ({ section: s, hasConflict, conflictMsg }) => {
                            const isSelected =
                              pin.theorySectionCode === s.section_code;

                            return (
                              <div
                                key={s.section_code}
                                onClick={() =>
                                  handleSelectTheorySection(
                                    inspectCourse.code,
                                    s.section_code,
                                  )
                                }
                                className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 text-xs space-y-2 relative overflow-hidden ${
                                  isSelected
                                    ? "bg-[var(--color-blue)]/15 border-[var(--color-blue)] shadow-md shadow-[var(--color-blue)]/10 ring-2 ring-[var(--color-blue)]/30"
                                    : hasConflict
                                      ? "bg-[var(--color-red)]/5 hover:bg-[var(--color-red)]/10 border-[var(--color-red)]/30 opacity-80 hover:opacity-100"
                                      : "bg-[var(--bg-storm)]/40 hover:bg-[var(--bg-storm)] border-[var(--border-muted)] hover:border-[var(--color-blue)]/50"
                                }`}
                              >
                                <div className="flex items-center justify-between font-bold">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`font-mono text-sm ${isSelected ? "text-[var(--color-blue)] font-bold" : hasConflict ? "text-[var(--color-red)]" : "text-[var(--fg-editor)]"}`}
                                    >
                                      {s.section_code}
                                    </span>
                                  </div>
                                  <span className="text-[var(--fg-markdown)] font-semibold">
                                    Thứ{" "}
                                    {s.day_of_week === 8 ? "CN" : s.day_of_week}{" "}
                                    • Tiết {s.periods.join(", ")}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[var(--fg-comments)] text-[11px] pt-1.5 border-t border-[var(--border-muted)]/40">
                                  <div>
                                    Phòng:{" "}
                                    <strong className="text-[var(--fg-editor)]">
                                      {s.room || "-"}
                                    </strong>
                                  </div>
                                  <div className="text-right">
                                    Sĩ số:{" "}
                                    <strong className="text-[var(--fg-editor)]">
                                      {s.capacity || "-"}
                                    </strong>
                                  </div>
                                  <div className="col-span-2 truncate">
                                    GV:{" "}
                                    <strong className="text-[var(--fg-editor)]">
                                      {s.instructor_name || "Chưa phân công"}
                                    </strong>
                                  </div>
                                  {(s.startDate || s.endDate) && (
                                    <div className="col-span-2 text-[10px] text-[var(--fg-comments)] font-mono">
                                      Thời gian: {s.startDate || "?"} →{" "}
                                      {s.endDate || "?"}
                                    </div>
                                  )}
                                </div>

                                {hasConflict && conflictMsg && (
                                  <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-red)] font-bold pt-1 border-t border-[var(--color-red)]/20">
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">
                                      {conflictMsg}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          },
                        )}
                      </div>
                    )}
                  </div>

                  {/* 2. Lab Sections */}
                  {inspectCourse.labSections.length > 0 && (
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-orange)] flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            2. Lớp Thực hành
                          </h4>
                          {pin.theorySectionCode && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-blue)]/10 text-[var(--color-blue)] font-bold">
                              Tương ứng với {pin.theorySectionCode}
                            </span>
                          )}
                        </div>

                        {pin.labSectionCode && (
                          <span className="text-[11px] font-bold text-[var(--color-orange)]">
                            ✓ {pin.labSectionCode}
                          </span>
                        )}
                      </div>

                      {processedLabSections.length === 0 ? (
                        <div className="p-4 rounded-2xl bg-[var(--bg-storm)]/30 border border-[var(--border-muted)]/50 text-xs text-[var(--fg-comments)] text-center space-y-2">
                          <p>
                            Không có lớp thực hành nào tương ứng với mã lớp LT{" "}
                            <strong>{pin.theorySectionCode}</strong>.
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              handleSelectTheorySection(
                                inspectCourse.code,
                                pin.theorySectionCode!,
                              )
                            }
                            className="text-[var(--color-blue)] hover:underline font-bold text-xs"
                          >
                            Bỏ chọn lớp LT để xem tất cả lớp TH
                          </button>
                        </div>
                      ) : (
                        <div className="grid gap-2.5 sm:grid-cols-2">
                          {processedLabSections.map(
                            ({ section: s, hasConflict, conflictMsg }) => {
                              const isSelected =
                                pin.labSectionCode === s.section_code;

                              return (
                                <div
                                  key={s.section_code}
                                  onClick={() =>
                                    handleSelectLabSection(
                                      inspectCourse.code,
                                      s.section_code,
                                    )
                                  }
                                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 text-xs space-y-2 relative overflow-hidden ${
                                    isSelected
                                      ? "bg-[var(--color-orange)]/15 border-[var(--color-orange)] shadow-md shadow-[var(--color-orange)]/10 ring-2 ring-[var(--color-orange)]/30"
                                      : hasConflict
                                        ? "bg-[var(--color-red)]/5 hover:bg-[var(--color-red)]/10 border-[var(--color-red)]/30 opacity-80 hover:opacity-100"
                                        : "bg-[var(--color-orange)]/5 hover:bg-[var(--color-orange)]/10 border-[var(--color-orange)]/25 hover:border-[var(--color-orange)]/50"
                                  }`}
                                >
                                  <div className="flex items-center justify-between font-bold">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`font-mono text-sm ${isSelected ? "text-[var(--color-orange)] font-bold" : hasConflict ? "text-[var(--color-red)]" : "text-[var(--fg-editor)]"}`}
                                      >
                                        {s.section_code}
                                      </span>
                                    </div>
                                    <span className="text-[var(--fg-markdown)] font-semibold">
                                      Thứ{" "}
                                      {s.day_of_week === 8
                                        ? "CN"
                                        : s.day_of_week}{" "}
                                      • Tiết {s.periods.join(", ")}
                                    </span>
                                  </div>

                                  <div className="space-y-1.5 text-[var(--fg-comments)] text-[11px] pt-1.5 border-t border-[var(--color-orange)]/20">
                                    <div className="grid grid-cols-2 gap-x-2">
                                      <div>
                                        Phòng:{" "}
                                        <strong className="text-[var(--fg-editor)]">
                                          {s.room || "-"}
                                        </strong>
                                      </div>
                                      <div className="text-right">
                                        Sĩ số:{" "}
                                        <strong className="text-[var(--fg-editor)]">
                                          {s.capacity || "-"}
                                        </strong>
                                      </div>
                                    </div>
                                    <div className="truncate">
                                      GV/Trợ giảng:{" "}
                                      <strong className="text-[var(--fg-editor)]">
                                        {s.instructor_name || "Chưa phân công"}
                                      </strong>
                                    </div>
                                    {(s.startDate || s.endDate) && (
                                      <div className="text-[10px] text-[var(--fg-comments)] font-mono">
                                        Thời gian: {s.startDate || "?"} →{" "}
                                        {s.endDate || "?"}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1.5">
                                      {s.biweekly ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[var(--color-blue)]/15 text-[var(--color-blue)] font-bold text-[10px]">
                                          Cách tuần
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[var(--bg-storm)] text-[var(--fg-comments)] text-[10px]">
                                          Hàng tuần
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {hasConflict && conflictMsg && (
                                    <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-red)] font-bold pt-1 border-t border-[var(--color-red)]/20">
                                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                      <span className="truncate">
                                        {conflictMsg}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            },
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 sm:p-5 border-t border-[var(--border-muted)] bg-[var(--bg-storm)]/60 flex items-center justify-between gap-3">
                  <div className="text-xs text-[var(--fg-comments)]">
                    {hasPin ? (
                      <span className="text-[var(--color-green)] font-semibold">
                        ✓ Đã lưu lựa chọn mã lớp cho môn này
                      </span>
                    ) : (
                      <span>
                        Chế độ: <strong>Tự động tìm lớp</strong>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setInspectCourse(null)}
                    className="px-6 py-2.5 rounded-full bg-[var(--color-blue)] hover:bg-[var(--color-blue)]/90 text-[var(--color-btn-text)] text-xs font-bold shadow-md shadow-[var(--color-blue)]/20 transition-all hover:scale-105 active:scale-95"
                  >
                    Xác nhận & Đóng
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          );
        })()}
    </div>
  );
}
