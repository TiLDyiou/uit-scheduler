"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { ScheduleSolution, Section } from "@/types/scheduler";
import { getCoursePalette, COURSE_PALETTES } from "@/lib/color-palette";
import { getBaseCourseCode, doSectionsOverlap } from "@/lib/scheduler-solver";
import confetti from "canvas-confetti";
import {
  ImageIcon,
  ArrowLeft,
  AlertCircle,
  MapPin,
  User,
  Sun,
  Moon,
  Layers,
  X,
  Sparkles,
} from "lucide-react";
import { getPeriodTime } from "@/lib/period-times";

interface Props {
  solutions: ScheduleSolution[];
  allSections: Section[];
  warnings?: string[];
  onBack: () => void;
}

const DAYS = [
  { label: "Thứ 2", value: 2 },
  { label: "Thứ 3", value: 3 },
  { label: "Thứ 4", value: 4 },
  { label: "Thứ 5", value: 5 },
  { label: "Thứ 6", value: 6 },
  { label: "Thứ 7", value: 7 },
  { label: "CN", value: 8 },
];

const PERIODS = Array.from({ length: 10 }, (_, i) => i + 1);

export default function Step3Results({
  solutions,
  allSections,
  warnings = [],
  onBack,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentSolutions, setCurrentSolutions] = useState<ScheduleSolution[]>(solutions);
  const [timetableTheme, setTimetableTheme] = useState<"light" | "dark">("light");
  const [exportingImage, setExportingImage] = useState(false);
  const [swapTargetSection, setSwapTargetSection] = useState<Section | null>(null);

  const timetableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setCurrentSolutions(solutions);
    setSelectedIndex(0);

    if (solutions.length > 0) {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#1e66f5", "#179299", "#8839ef", "#04a5e5", "#40a02b"],
        });
      } catch (e) {}
    }
  }, [solutions]);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTimetableTheme(isDark ? "dark" : "light");
  }, []);

  const activeSolution = currentSolutions[selectedIndex] || solutions[0];

  const colorIndexMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (!activeSolution) return map;

    const uniqueBases: string[] = [];
    activeSolution.sections.forEach((s) => {
      const base = getBaseCourseCode(s.course_code);
      if (!uniqueBases.includes(base)) uniqueBases.push(base);
    });

    uniqueBases.forEach((base, idx) => {
      map[base] = idx % COURSE_PALETTES.length;
    });

    return map;
  }, [activeSolution]);

  const handleExportImage = async () => {
    if (!timetableRef.current) return;
    setExportingImage(true);
    try {
      const { toPng } = await import("html-to-image");
      const isLight = timetableTheme === "light";
      const node = timetableRef.current;

      const dataUrl = await toPng(node, {
        backgroundColor: isLight ? "#eff1f5" : "#1a1b26",
        pixelRatio: 2.5,
        cacheBust: true,
        style: {
          overflow: "visible",
          scrollbarWidth: "none",
        },
      });

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `TKB_UIT.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert("Đã xảy ra lỗi khi xuất ảnh thời khóa biểu.");
    } finally {
      setExportingImage(false);
    }
  };

  const handleSwapSection = (newSection: Section) => {
    if (!swapTargetSection || !activeSolution) return;

    const updatedSections = activeSolution.sections.map((s) =>
      s.section_code === swapTargetSection.section_code ? newSection : s
    );

    const updatedSolutions = [...currentSolutions];
    updatedSolutions[selectedIndex] = {
      ...activeSolution,
      sections: updatedSections,
    };
    setCurrentSolutions(updatedSolutions);
    setSwapTargetSection(null);
  };

  const availableAlternatives = useMemo(() => {
    if (!swapTargetSection || !activeSolution) return [];
    const baseCode = getBaseCourseCode(swapTargetSection.course_code);
    const otherSectionsInSchedule = activeSolution.sections.filter(
      (s) => s.section_code !== swapTargetSection.section_code
    );

    return allSections
      .filter((s) => {
        const isSameCourse = getBaseCourseCode(s.course_code) === baseCode;
        const isSameType = s.is_lab === swapTargetSection.is_lab;
        const isDifferentSection = s.section_code !== swapTargetSection.section_code;
        return isSameCourse && isSameType && isDifferentSection;
      })
      .map((s) => {
        const hasOverlap = otherSectionsInSchedule.some((other) =>
          doSectionsOverlap(s, other)
        );
        return { section: s, hasOverlap };
      });
  }, [swapTargetSection, activeSolution, allSections]);

  if (!activeSolution || currentSolutions.length === 0) {
    return (
      <div className="py-20 p-1.5 rounded-[1.75rem] bg-[var(--bg-storm)] border border-[var(--border-muted)] flex flex-col items-center justify-center text-center space-y-4">
        <div className="rounded-[1.4rem] bg-[var(--bg-panel)] p-10 border border-[var(--border-muted)]/60 flex flex-col items-center space-y-4 w-full">
          <div className="w-16 h-16 rounded-full bg-[var(--color-red)]/10 text-[var(--color-red)] flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-lg font-bold text-[var(--fg-editor)]">
              Không tìm thấy phương án thời khóa biểu phù hợp
            </h3>
            <p className="text-xs sm:text-sm text-[var(--fg-markdown)] leading-relaxed">
              Các lớp học của các môn đã chọn đều bị xung đột thời gian với nhau hoặc rơi vào khung giờ bận của bạn.
            </p>
          </div>
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-full bg-[var(--color-blue)] hover:bg-[var(--color-blue)]/90 text-[var(--color-btn-text)] font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-[var(--color-blue)]/25"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại điều chỉnh môn hoặc giờ bận</span>
          </button>
        </div>
      </div>
    );
  }

  // Build 10 periods x 7 days timetable matrix
  type CellData = null | "merged_slot" | Section;
  const matrix: CellData[][] = Array.from({ length: 10 }, () =>
    Array(7).fill(null)
  );

  activeSolution.sections.forEach((s) => {
    if (!s.periods || s.periods.length === 0) return;
    const sortedPeriods = [...s.periods].sort((a, b) => a - b);
    const startPeriod = sortedPeriods[0];
    const dayIndex = s.day_of_week >= 2 && s.day_of_week <= 8 ? s.day_of_week - 2 : 0;

    if (startPeriod >= 1 && startPeriod <= 10 && dayIndex >= 0 && dayIndex < 7) {
      matrix[startPeriod - 1][dayIndex] = s;
      for (let i = 1; i < sortedPeriods.length; i++) {
        const p = startPeriod - 1 + i;
        if (p < 10) matrix[p][dayIndex] = "merged_slot";
      }
    }
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Global Warnings if any course had no solution */}
      {warnings.length > 0 && (
        <div className="p-4 rounded-2xl bg-[var(--color-yellow)]/10 border border-[var(--color-yellow)]/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[var(--color-yellow)] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-[var(--fg-editor)]">
              Lưu ý về lịch xếp:
            </h4>
            <ul className="text-xs text-[var(--fg-markdown)] list-disc list-inside space-y-0.5">
              {warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Partial solution missing courses alert */}
      {activeSolution.missing_courses.length > 0 && (
        <div className="p-4 rounded-2xl bg-[var(--color-red)]/10 border border-[var(--color-red)]/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[var(--color-red)] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-[var(--fg-editor)]">
              Môn học không thể xếp trong phương án này:
            </h4>
            <ul className="text-xs text-[var(--fg-markdown)] list-disc list-inside space-y-0.5">
              {activeSolution.missing_courses.map((m, idx) => (
                <li key={idx}>{m}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Solutions Control Bar (Double-Bezel) */}
      <div className="p-1.5 rounded-[1.75rem] bg-[var(--bg-storm)] border border-[var(--border-muted)] shadow-md shadow-black/5">
        <div className="rounded-[1.4rem] bg-[var(--bg-panel)] p-4 border border-[var(--border-muted)]/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Solution Tabs */}
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--fg-comments)] mr-1 hidden sm:inline">
              Phương án:
            </span>
            {currentSolutions.map((sol, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedIndex(idx)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 border ${
                    isSelected
                      ? "bg-[var(--color-blue)] text-[var(--color-btn-text)] border-transparent shadow-md shadow-[var(--color-blue)]/25 scale-[1.02]"
                      : "bg-[var(--bg-storm)] text-[var(--fg-markdown)] border-[var(--border-muted)] hover:border-[var(--color-blue)]/50"
                  }`}
                >
                  <span>#{idx + 1}</span>
                  <span className="text-[10px] font-medium opacity-80">
                    ({sol.study_days_count} ngày)
                  </span>
                </button>
              );
            })}
          </div>

          {/* Export & Appearance Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() =>
                setTimetableTheme((prev) => (prev === "dark" ? "light" : "dark"))
              }
              className="p-2.5 rounded-xl border border-[var(--border-muted)] bg-[var(--bg-storm)] hover:bg-[var(--border-muted)] text-[var(--fg-editor)] text-xs font-bold flex items-center gap-1.5 transition-all"
              title="Đổi màu giao diện bảng (Sáng/Tối) khi xem và xuất ảnh"
            >
              {timetableTheme === "dark" ? (
                <>
                  <Sun className="w-4 h-4 text-[var(--color-yellow)]" />
                  <span className="hidden sm:inline">Bảng Sáng</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-[var(--color-blue)]" />
                  <span className="hidden sm:inline">Bảng Tối</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportImage}
              disabled={exportingImage}
              className="px-5 py-2.5 rounded-xl bg-[var(--color-blue)] hover:bg-[var(--color-blue)]/90 text-[var(--color-btn-text)] text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-[var(--color-blue)]/20 hover:scale-105 active:scale-95 disabled:opacity-50"
              title="Tải ảnh thời khóa biểu dạng PNG chất lượng cao"
            >
              <ImageIcon className="w-4 h-4" />
              <span>{exportingImage ? "Đang tạo ảnh..." : "Xuất Ảnh (.png)"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Timetable Visual Grid (Double-Bezel) */}
      <div className="p-1.5 rounded-[1.75rem] bg-[var(--bg-storm)] border border-[var(--border-muted)] shadow-md shadow-black/5">
        <div className="rounded-[1.4rem] overflow-x-auto custom-scrollbar">
          {(() => {
            const isLight = timetableTheme === "light";
            return (
              <div
                ref={timetableRef}
                className={`min-w-[850px] p-5 sm:p-6 rounded-[1.4rem] border transition-colors ${
                  isLight
                    ? "bg-[#eff1f5] text-[#4c4f69] border-[#acb0be]/50 shadow-sm"
                    : "bg-[#1a1b26] text-[#c0caf5] border-[#292e42] shadow-xl"
                }`}
              >
                <div className="space-y-4">
                  {/* Timetable Header info */}
                  <div
                    className={`flex items-center justify-between border-b pb-3 ${
                      isLight ? "border-[#acb0be]/40" : "border-[#292e42]"
                    }`}
                  >
                    <div>
                      <h3 className="text-base font-extrabold flex items-center gap-2">
                        <span>Thời Khóa Biểu</span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                            isLight
                              ? "bg-[#1e66f5]/10 text-[#1e66f5] border-[#1e66f5]/20"
                              : "bg-[#7aa2f7]/15 text-[#7aa2f7] border-[#7aa2f7]/30"
                          }`}
                        >
                          {activeSolution.total_credits} Tín chỉ
                        </span>
                      </h3>
                      <p
                        className={`text-xs mt-0.5 font-medium ${
                          isLight ? "text-[#6c6f85]" : "text-[#a9b1d6]"
                        }`}
                      >
                        Học {activeSolution.study_days_count} ngày/tuần
                        {activeSolution.free_days.length > 0 &&
                          ` • Nghỉ các ngày: ${activeSolution.free_days
                            .map((d) => (d === 8 ? "Chủ nhật" : `Thứ ${d}`))
                            .join(", ")}`}
                      </p>
                    </div>
                    <div
                      className={`text-right text-xs font-medium ${
                        isLight ? "text-[#6c6f85]" : "text-[#a9b1d6]"
                      }`}
                    >
                      <span>Trường ĐH Công nghệ Thông tin - ĐHQG TP.HCM</span>
                    </div>
                  </div>

                  {/* Table Grid */}
                  <table className="w-full border-collapse table-fixed">
                    <thead>
                      <tr className="h-11">
                        <th
                          className={`w-[115px] p-2 text-center text-xs font-extrabold border ${
                            isLight
                              ? "text-[#6c6f85] border-[#acb0be]/35 bg-[#e6e9ef]/70"
                              : "text-[#7aa2f7] border-[#24283b] bg-[#1f2335]/90"
                          }`}
                        >
                          Tiết
                        </th>
                        {DAYS.map((d) => (
                          <th
                            key={d.value}
                            className={`p-2 text-center text-xs font-extrabold border ${
                              isLight
                                ? "text-[#4c4f69] border-[#acb0be]/35 bg-[#e6e9ef]/50"
                                : "text-[#c0caf5] border-[#24283b] bg-[#1f2335]/70"
                            }`}
                          >
                            {d.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PERIODS.map((p, pIdx) => {
                        return (
                          <tr key={p} className="h-16">
                            {/* Period Label */}
                            <td
                              className={`p-1 text-center align-middle border ${
                                isLight
                                  ? "border-[#acb0be]/35 bg-[#e6e9ef]/60 text-[#4c4f69]"
                                  : "border-[#24283b] bg-[#1f2335]/80 text-[#c0caf5]"
                              }`}
                            >
                              <div className="flex flex-col items-center justify-center px-1">
                                <span className="text-xs font-bold whitespace-nowrap">Tiết {p}</span>
                                <span
                                  className={`text-[10px] font-mono leading-tight whitespace-nowrap mt-0.5 ${
                                    isLight ? "text-[#6c6f85]" : "text-[#7aa2f7]"
                                  }`}
                                >
                                  {getPeriodTime(p)}
                                </span>
                              </div>
                            </td>

                            {/* Day Cells */}
                            {DAYS.map((d, dIdx) => {
                              const cell = matrix[pIdx][dIdx];

                              if (cell === "merged_slot") return null;

                              if (cell === null) {
                                return (
                                  <td
                                    key={`empty-${d.value}-${p}`}
                                    className={`border ${
                                      isLight
                                        ? "border-[#acb0be]/30 bg-[#eff1f5]/60"
                                        : "border-[#24283b]/80 bg-[#16161e]/40"
                                    }`}
                                  />
                                );
                              }

                              const s = cell;
                              const span = s.periods.length;
                              const palette = getCoursePalette(
                                s.course_code,
                                colorIndexMap
                              );

                              return (
                                <td
                                  key={`section-${s.section_code}`}
                                  rowSpan={span}
                                  className={`p-1 align-top border ${
                                    isLight
                                      ? "border-[#acb0be]/30 bg-[#eff1f5]/60"
                                      : "border-[#24283b]/80 bg-[#16161e]/40"
                                  }`}
                                >
                                  <div
                                    onClick={() => setSwapTargetSection(s)}
                                    className={`w-full h-full rounded-2xl border p-2.5 relative overflow-hidden transition-all duration-200 cursor-pointer group flex flex-col justify-between hover:scale-[1.01] ${
                                      isLight
                                        ? `${palette.cardBgLight} ${palette.cardBorderLight} shadow-sm hover:shadow-md`
                                        : `${palette.cardBgDark} ${palette.cardBorderDark} shadow-md hover:shadow-xl`
                                    }`}
                                    style={{ minHeight: `${span * 64 - 8}px` }}
                                    title="Nhấp để xem hoặc đổi sang lớp khác của môn này"
                                  >
                                    {/* Left accent bar */}
                                    <div
                                      className={`absolute left-0 top-0 bottom-0 w-1.5 ${palette.accentBar}`}
                                    />

                                    <div className="pl-2 space-y-1 min-w-0">
                                      <h4
                                        className={`text-xs font-bold leading-snug break-words ${
                                          isLight
                                            ? palette.titleLight
                                            : palette.titleDark
                                        }`}
                                      >
                                        {s.course_name}
                                      </h4>

                                      <div className="flex flex-wrap items-center gap-1">
                                        <span
                                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded leading-none ${
                                            isLight
                                              ? `${palette.tagBgLight} ${palette.tagTextLight}`
                                              : `${palette.tagBgDark} ${palette.tagTextDark}`
                                          }`}
                                        >
                                          {s.section_code}
                                        </span>
                                        {s.biweekly && (
                                          <span
                                            className={`text-[9px] font-bold ${
                                              isLight
                                                ? "text-[#1e66f5]"
                                                : "text-[#7aa2f7]"
                                            }`}
                                          >
                                            Cách tuần
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Room & Instructor footer */}
                                    <div
                                      className={`pl-2 pt-1.5 space-y-0.5 text-[10px] border-t ${
                                        isLight
                                          ? "text-[#4c4f69]/80 border-[#acb0be]/30"
                                          : "text-[#a9b1d6]/80 border-[#414868]/40"
                                      }`}
                                    >
                                      {s.room && (
                                        <div className="flex items-center gap-1 font-medium leading-tight">
                                          <MapPin className="w-2.5 h-2.5 shrink-0" />
                                          <span className="break-words">
                                            {s.room}
                                          </span>
                                        </div>
                                      )}
                                      {s.instructor_name && (
                                        <div className="flex items-start gap-1 font-medium leading-tight">
                                          <User className="w-2.5 h-2.5 shrink-0 mt-0.5" />
                                          <span className="break-words">
                                            {s.instructor_name}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Enrolled Sections Summary Table (Double-Bezel) */}
      <div className="p-1.5 rounded-[1.75rem] bg-[var(--bg-storm)] border border-[var(--border-muted)] shadow-md shadow-black/5">
        <div className="rounded-[1.4rem] bg-[var(--bg-panel)] border border-[var(--border-muted)]/60 overflow-hidden">
          <div className="p-4 border-b border-[var(--border-muted)] bg-[var(--bg-storm)]/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[var(--color-blue)]" />
              <h4 className="text-sm font-bold text-[var(--fg-editor)]">
                Chi tiết các lớp đã xếp ({activeSolution.sections.length} lớp)
              </h4>
            </div>
            <span className="text-xs font-bold text-[var(--fg-markdown)]">
              Tổng cộng {activeSolution.total_credits} tín chỉ
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-muted)] bg-[var(--bg-storm)]/60 text-[var(--fg-comments)] font-bold">
                  <th className="p-3 w-12 text-center">STT</th>
                  <th className="p-3">Mã lớp</th>
                  <th className="p-3">Tên môn học</th>
                  <th className="p-3">Hình thức</th>
                  <th className="p-3">Thứ</th>
                  <th className="p-3">Tiết</th>
                  <th className="p-3">Phòng</th>
                  <th className="p-3">Giảng viên</th>
                  <th className="p-3 text-center">TC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-muted)]/40 text-[var(--fg-markdown)]">
                {activeSolution.sections.map((s, idx) => (
                  <tr
                    key={s.section_code}
                    className="hover:bg-[var(--bg-storm)]/50 transition-colors"
                  >
                    <td className="p-3 text-center font-mono text-[var(--fg-comments)]">{idx + 1}</td>
                    <td className="p-3 font-mono font-bold text-[var(--color-blue)]">
                      {s.section_code}
                    </td>
                    <td className="p-3 font-bold text-[var(--fg-editor)]">
                      {s.course_name}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.is_lab
                            ? "bg-[var(--color-orange)]/15 text-[var(--color-orange)]"
                            : "bg-[var(--color-blue)]/15 text-[var(--color-blue)]"
                        }`}
                      >
                        {s.is_lab ? "Thực hành" : "Lý thuyết"}
                      </span>
                    </td>
                    <td className="p-3 font-bold">
                      {s.day_of_week === 8 ? "Chủ nhật" : `Thứ ${s.day_of_week}`}
                    </td>
                    <td className="p-3 font-mono">{s.periods.join(", ")}</td>
                    <td className="p-3 font-medium">{s.room || "-"}</td>
                    <td className="p-3">{s.instructor_name || "-"}</td>
                    <td className="p-3 text-center font-extrabold">{s.credits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Back Button Action */}
      <div className="flex justify-start pt-2">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-full border border-[var(--border-muted)] bg-[var(--bg-panel)] hover:bg-[var(--bg-storm)] text-[var(--fg-editor)] font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại điều chỉnh môn hoặc khung giờ</span>
        </button>
      </div>

      {/* Section Swapper Modal (Global Viewport Portal) */}
      {swapTargetSection && mounted && createPortal(
        <div
          onClick={() => setSwapTargetSection(null)}
          className="fixed inset-0 z-[100] w-screen h-screen flex items-center justify-center p-4 sm:p-6 bg-black/65 dark:bg-black/80 transition-opacity duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg my-auto rounded-[1.75rem] bg-[var(--bg-panel)] border border-[var(--border-terminal)] shadow-2xl shadow-black/40 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
          >
            <div className="p-5 sm:p-6 border-b border-[var(--border-muted)] flex items-center justify-between bg-[var(--bg-storm)]/60">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[var(--fg-editor)]">
                  Đổi lớp: {swapTargetSection.course_name}
                </h3>
                <p className="text-xs text-[var(--fg-comments)] mt-0.5">
                  Lớp hiện tại: <strong className="font-mono text-[var(--fg-editor)]">{swapTargetSection.section_code}</strong> (Thứ {swapTargetSection.day_of_week === 8 ? "CN" : swapTargetSection.day_of_week}, Tiết {swapTargetSection.periods.join(", ")})
                </p>
              </div>
              <button
                onClick={() => setSwapTargetSection(null)}
                className="p-2 rounded-full text-[var(--fg-comments)] hover:text-[var(--fg-editor)] hover:bg-[var(--bg-storm)] transition-colors"
                title="Đóng modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-2.5 custom-scrollbar">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[var(--fg-comments)] mb-2">
                Các lớp thay thế có thể chọn:
              </h4>

              {availableAlternatives.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[var(--bg-storm)]/30 border border-[var(--border-muted)]/50 text-xs text-[var(--fg-comments)] text-center">
                  Không có lớp thay thế nào khác cho môn này trong học kỳ.
                </div>
              ) : (
                availableAlternatives.map(({ section: alt, hasOverlap }) => (
                  <div
                    key={alt.section_code}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all ${
                      hasOverlap
                        ? "border-[var(--border-muted)] opacity-50 bg-[var(--bg-storm)]/30"
                        : "border-[var(--border-muted)] hover:border-[var(--color-blue)] bg-[var(--bg-storm)]/40 hover:bg-[var(--bg-storm)]"
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[var(--color-blue)]">
                          {alt.section_code}
                        </span>
                        <span className="text-[var(--fg-editor)] font-semibold">
                          Thứ {alt.day_of_week === 8 ? "CN" : alt.day_of_week}, Tiết {alt.periods.join(", ")}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--fg-comments)] flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <span>Phòng: {alt.room || "-"}</span>
                        <span>GV: {alt.instructor_name || "-"}</span>
                        {alt.biweekly && (
                          <span className="text-[var(--color-blue)] font-bold">
                            • Cách tuần
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      disabled={hasOverlap}
                      onClick={() => handleSwapSection(alt)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                        hasOverlap
                          ? "bg-[var(--border-muted)] text-[var(--fg-comments)] cursor-not-allowed"
                          : "bg-[var(--color-blue)] hover:bg-[var(--color-blue)]/90 text-[var(--color-btn-text)] shadow-sm hover:scale-105 active:scale-95"
                      }`}
                    >
                      {hasOverlap ? "Trùng lịch" : "Chọn lớp này"}
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 sm:p-5 border-t border-[var(--border-muted)] bg-[var(--bg-storm)]/60 flex items-center justify-between">
              <span className="text-xs text-[var(--fg-comments)]">
                Nhấn <strong>Esc</strong> hoặc click ngoài để đóng
              </span>
              <button
                onClick={() => setSwapTargetSection(null)}
                className="px-6 py-2.5 rounded-full text-xs font-bold text-[var(--fg-editor)] hover:bg-[var(--bg-storm)] border border-[var(--border-muted)] transition-all hover:scale-105 active:scale-95"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
