"use client";

import React, { useState, useEffect } from "react";
import { TimeSlot } from "@/types/scheduler";
import {
  CalendarDays,
  Sparkles,
  CheckCircle2,
  XCircle,
  Sun,
  Moon,
  AlertCircle,
  Coffee,
  X,
  Zap,
  Clock,
} from "lucide-react";
import { getPeriodTime } from "@/lib/period-times";

interface Props {
  onSolve: (slots: TimeSlot[] | null) => void;
  availableSlots: TimeSlot[] | null;
  setAvailableSlots: (slots: TimeSlot[] | null) => void;
  loading: boolean;
  error?: string | null;
  selectedCourseCount: number;
}

const DAYS = [
  { label: "Thứ 2", value: 2 },
  { label: "Thứ 3", value: 3 },
  { label: "Thứ 4", value: 4 },
  { label: "Thứ 5", value: 5 },
  { label: "Thứ 6", value: 6 },
  { label: "Thứ 7", value: 7 },
];

const PERIODS = Array.from({ length: 10 }, (_, i) => i + 1);

export default function Step2TimePreference({
  onSolve,
  availableSlots,
  setAvailableSlots,
  loading,
  error,
  selectedCourseCount,
}: Props) {
  const [slotSet, setSlotSet] = useState<Set<string>>(() => {
    if (availableSlots && availableSlots.length > 0) {
      return new Set(availableSlots.map((s) => `${s.day}-${s.period}`));
    }
    const initial = new Set<string>();
    DAYS.forEach((d) => {
      PERIODS.forEach((p) => {
        initial.add(`${d.value}-${p}`);
      });
    });
    return initial;
  });

  const [isMouseDown, setIsMouseDown] = useState(false);
  const [dragAction, setDragAction] = useState<"add" | "remove" | null>(null);

  useEffect(() => {
    const slots: TimeSlot[] = Array.from(slotSet).map((key) => {
      const [d, p] = key.split("-").map(Number);
      return { day: d, period: p };
    });
    setAvailableSlots(slots);
  }, [slotSet, setAvailableSlots]);

  const handleCellMouseDown = (day: number, period: number) => {
    setIsMouseDown(true);
    const key = `${day}-${period}`;
    const willAdd = !slotSet.has(key);
    setDragAction(willAdd ? "add" : "remove");

    const next = new Set(slotSet);
    if (willAdd) next.add(key);
    else next.delete(key);
    setSlotSet(next);
  };

  const handleCellMouseEnter = (day: number, period: number) => {
    if (!isMouseDown || !dragAction) return;
    const key = `${day}-${period}`;
    const next = new Set(slotSet);
    if (dragAction === "add") next.add(key);
    else next.delete(key);
    setSlotSet(next);
  };

  useEffect(() => {
    const handleMouseUp = () => {
      setIsMouseDown(false);
      setDragAction(null);
    };
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const toggleDay = (day: number) => {
    const dayKeys = PERIODS.map((p) => `${day}-${p}`);
    const allSelected = dayKeys.every((k) => slotSet.has(k));
    const next = new Set(slotSet);
    if (allSelected) {
      dayKeys.forEach((k) => next.delete(k));
    } else {
      dayKeys.forEach((k) => next.add(k));
    }
    setSlotSet(next);
  };

  const togglePeriodRow = (period: number) => {
    const rowKeys = DAYS.map((d) => `${d.value}-${period}`);
    const allSelected = rowKeys.every((k) => slotSet.has(k));
    const next = new Set(slotSet);
    if (allSelected) {
      rowKeys.forEach((k) => next.delete(k));
    } else {
      rowKeys.forEach((k) => next.add(k));
    }
    setSlotSet(next);
  };

  const setAllFree = () => {
    const all = new Set<string>();
    DAYS.forEach((d) => PERIODS.forEach((p) => all.add(`${d.value}-${p}`)));
    setSlotSet(all);
  };

  const setAllBusy = () => {
    setSlotSet(new Set());
  };

  const avoidMornings = () => {
    const next = new Set(slotSet);
    DAYS.forEach((d) => {
      [1, 2, 3, 4, 5].forEach((p) => next.delete(`${d.value}-${p}`));
      [6, 7, 8, 9, 10].forEach((p) => next.add(`${d.value}-${p}`));
    });
    setSlotSet(next);
  };

  const avoidAfternoons = () => {
    const next = new Set(slotSet);
    DAYS.forEach((d) => {
      [1, 2, 3, 4, 5].forEach((p) => next.add(`${d.value}-${p}`));
      [6, 7, 8, 9, 10].forEach((p) => next.delete(`${d.value}-${p}`));
    });
    setSlotSet(next);
  };

  const avoidWeekends = () => {
    const next = new Set(slotSet);
    [7].forEach((d) => {
      PERIODS.forEach((p) => next.delete(`${d}-${p}`));
    });
    setSlotSet(next);
  };

  const handleRunSolve = () => {
    const slots: TimeSlot[] = Array.from(slotSet).map((s) => {
      const [d, p] = s.split("-").map(Number);
      return { day: d, period: p };
    });
    onSolve(slots);
  };

  const totalSlots = DAYS.length * PERIODS.length; // 6 * 10 = 60
  const busySlotsCount = totalSlots - slotSet.size;

  return (
    <div className="space-y-6 animate-fade-in-up select-none">
      {/* Header & Quick Presets (Double-Bezel) */}
      <section className="p-1.5 rounded-[1.75rem] bg-[var(--bg-storm)] border border-[var(--border-muted)] shadow-md shadow-black/5">
        <div className="rounded-[1.4rem] bg-[var(--bg-panel)] p-6 sm:p-7 border border-[var(--border-muted)]/60 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[var(--color-blue)]/10 text-[var(--color-blue)] border border-[var(--color-blue)]/20">
                <CalendarDays className="w-5 h-5" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[var(--fg-editor)] tracking-tight">
                Tùy Chọn Khung Giờ Rảnh / Bận
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[var(--fg-markdown)] max-w-2xl leading-relaxed">
              Bạn muốn né khung giờ nào? Kéo thả chuột để đánh dấu{" "}
              <strong className="text-[var(--color-red)]">
                giờ bận (màu đỏ)
              </strong>
              . Thuật toán sẽ tự động né các giờ này khi xếp lịch cho{" "}
              {selectedCourseCount} môn của bạn.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={setAllFree}
              className="px-3.5 py-1.5 rounded-full border border-[var(--border-muted)] bg-[var(--bg-storm)] hover:border-[var(--color-green)] text-xs font-bold text-[var(--fg-editor)] transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-green)]" />
              <span>Tất cả rảnh</span>
            </button>
            <button
              onClick={avoidMornings}
              className="px-3.5 py-1.5 rounded-full border border-[var(--border-muted)] bg-[var(--bg-storm)] hover:border-[var(--color-blue)] text-xs font-bold text-[var(--fg-editor)] transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              <Moon className="w-3.5 h-3.5 text-[var(--color-blue)]" />
              <span>Né buổi sáng</span>
            </button>
            <button
              onClick={avoidAfternoons}
              className="px-3.5 py-1.5 rounded-full border border-[var(--border-muted)] bg-[var(--bg-storm)] hover:border-[var(--color-yellow)] text-xs font-bold text-[var(--fg-editor)] transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              <Sun className="w-3.5 h-3.5 text-[var(--color-yellow)]" />
              <span>Né buổi chiều</span>
            </button>
            <button
              onClick={avoidWeekends}
              className="px-3.5 py-1.5 rounded-full border border-[var(--border-muted)] bg-[var(--bg-storm)] hover:border-[var(--color-orange)] text-xs font-bold text-[var(--fg-editor)] transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              <Coffee className="w-3.5 h-3.5 text-[var(--color-orange)]" />
              <span>Nghỉ Thứ 7</span>
            </button>
            <button
              onClick={setAllBusy}
              className="px-3.5 py-1.5 rounded-full border border-[var(--color-red)]/30 bg-[var(--color-red)]/10 text-xs font-bold text-[var(--color-red)] transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Đặt tất cả bận</span>
            </button>
          </div>
        </div>
      </section>

      {/* Interactive Time Grid (Double-Bezel) */}
      <div className="p-1.5 rounded-[1.75rem] bg-[var(--bg-storm)] border border-[var(--border-muted)] shadow-md shadow-black/5">
        <div className="rounded-[1.4rem] bg-[var(--bg-panel)] p-4 sm:p-6 border border-[var(--border-muted)]/60 overflow-x-auto custom-scrollbar">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[140px_repeat(6,1fr)] gap-2.5">
              {/* Header Row */}
              <button
                type="button"
                onClick={() => {
                  const all = new Set<string>();
                  DAYS.forEach((d) =>
                    PERIODS.forEach((p) => all.add(`${d.value}-${p}`)),
                  );
                  if (slotSet.size === 60) setSlotSet(new Set());
                  else setSlotSet(all);
                }}
                className="h-11 rounded-xl font-bold text-xs text-[var(--fg-editor)] hover:text-[var(--color-blue)] bg-[var(--bg-storm)] hover:bg-[var(--border-muted)] border border-[var(--border-muted)]/50 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                title="Nhấp để bật/tắt toàn bộ bảng thời gian"
              >
                <Clock className="w-3.5 h-3.5 text-[var(--color-blue)]" />
              </button>
              {DAYS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleDay(d.value)}
                  className="h-11 rounded-xl font-bold text-xs text-[var(--fg-editor)] hover:text-[var(--color-blue)] bg-[var(--bg-storm)] hover:bg-[var(--border-muted)] transition-all flex items-center justify-center gap-1"
                  title={`Nhấp để bật/tắt toàn bộ ${d.label}`}
                >
                  <span>{d.label}</span>
                </button>
              ))}

              {/* Periods Rows (All 10 periods uniform, centered) */}
              {PERIODS.map((p) => {
                const periodTimeStr = getPeriodTime(p);
                return (
                  <React.Fragment key={p}>
                    {/* Period Label (Centered with Period Number + Start & End Times) */}
                    <button
                      type="button"
                      onClick={() => togglePeriodRow(p)}
                      className="h-12 rounded-xl flex flex-col items-center justify-center text-center px-2 font-semibold text-[var(--fg-markdown)] hover:text-[var(--color-blue)] bg-[var(--bg-storm)]/60 hover:bg-[var(--bg-storm)] transition-colors border border-[var(--border-muted)]/50"
                      title={`Nhấp để bật/tắt Tiết ${p} (${periodTimeStr}) cả tuần`}
                    >
                      <span className="text-xs font-bold text-[var(--fg-editor)] leading-tight whitespace-nowrap">
                        Tiết {p}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--fg-comments)] leading-tight whitespace-nowrap mt-0.5">
                        {periodTimeStr}
                      </span>
                    </button>

                    {/* Day Slots for Period p (Uniform styling for all periods 1..10) */}
                    {DAYS.map((d) => {
                      const isAvailable = slotSet.has(`${d.value}-${p}`);
                      return (
                        <div
                          key={`${d.value}-${p}`}
                          onMouseDown={() => handleCellMouseDown(d.value, p)}
                          onMouseEnter={() => handleCellMouseEnter(d.value, p)}
                          className={`h-12 rounded-xl cursor-pointer transition-all duration-150 relative overflow-hidden flex items-center justify-center border ${
                            isAvailable
                              ? "bg-[var(--bg-storm)]/40 border-[var(--border-muted)]/60 hover:bg-[var(--color-blue)]/10 hover:border-[var(--color-blue)]/30"
                              : "bg-[var(--color-red)]/15 border-[var(--color-red)]/35 hover:bg-[var(--color-red)]/25"
                          }`}
                          title={`${d.label} • Tiết ${p} (${periodTimeStr}) - ${
                            isAvailable
                              ? "Rảnh (Có thể học)"
                              : "Bận (Né giờ này)"
                          }`}
                        >
                          {!isAvailable ? (
                            <div className="flex items-center gap-1 text-[var(--color-red)] animate-fade-in-up">
                              <X className="w-3.5 h-3.5 stroke-[3]" />
                              <span className="text-[10px] font-extrabold tracking-tight">
                                BẬN
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-[var(--border-terminal)] group-hover:text-[var(--color-blue)]">
                              •
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Error display and Solve Action */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="flex-1 w-full">
          {error && (
            <div className="p-4 bg-[var(--color-red)]/10 border border-[var(--color-red)]/30 rounded-2xl flex items-start gap-3 text-[var(--color-red)] text-xs sm:text-sm animate-fade-in-up">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium">{error}</p>
            </div>
          )}
          {!error && busySlotsCount > 0 && (
            <p className="text-xs text-[var(--fg-markdown)]">
              Đã đánh dấu{" "}
              <strong className="text-[var(--color-red)]">
                {busySlotsCount} tiết bận
              </strong>
              . Hệ thống sẽ né những tiết này khi tìm lịch học.
            </p>
          )}
        </div>

        <button
          disabled={loading || selectedCourseCount === 0}
          onClick={handleRunSolve}
          className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[var(--color-blue)] hover:bg-[var(--color-blue)]/90 text-[var(--color-btn-text)] font-extrabold text-sm shadow-lg shadow-[var(--color-blue)]/25 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 group"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-[var(--color-btn-text)] border-t-transparent rounded-full animate-spin" />
              <span>Đang tính toán lịch tối ưu...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-[var(--color-yellow)]" />
              <span>Tìm Lịch Học Tối Ưu</span>
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                <Zap className="w-3.5 h-3.5" />
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
