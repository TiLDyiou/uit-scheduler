"use client";

import { StepType } from "@/types/scheduler";
import { Check, BookOpen, Clock, CalendarCheck } from "lucide-react";

interface StepIndicatorProps {
  currentStep: StepType;
  onStepChange?: (step: StepType) => void;
  selectedCount: number;
  canGoToResults?: boolean;
}

export default function StepIndicator({
  currentStep,
  onStepChange,
  selectedCount,
  canGoToResults = false,
}: StepIndicatorProps) {
  const steps: {
    key: StepType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { key: "selection", label: "1. Chọn Môn Học", icon: BookOpen },
    { key: "preference", label: "2. Khung Giờ Rảnh", icon: Clock },
    { key: "results", label: "3. Kết Quả Xếp Lịch", icon: CalendarCheck },
  ];

  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <nav aria-label="Tiến trình xếp lịch" className="flex items-center justify-center py-4">
      {/* Outer Shell (Double-Bezel) */}
      <div className="p-1.5 rounded-2xl bg-[var(--bg-storm)] border border-[var(--border-muted)] shadow-md shadow-black/5 flex items-center gap-1.5 sm:gap-3 max-w-full overflow-x-auto">
        {steps.map((s, idx) => {
          const isPast = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isClickable =
            !isCurrent &&
            (isPast ||
              (idx === 1 && selectedCount > 0) ||
              (idx === 2 && selectedCount > 0 && canGoToResults));
          const Icon = s.icon;

          return (
            <div key={s.key} className="flex items-center gap-1.5 sm:gap-3">
              <button
                onClick={() => {
                  if (isClickable && onStepChange) {
                    onStepChange(s.key);
                  }
                }}
                disabled={!isClickable}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap ${
                  isCurrent
                    ? "bg-[var(--color-blue)] text-[var(--color-btn-text)] shadow-lg shadow-[var(--color-blue)]/25 scale-[1.02]"
                    : isPast
                    ? "bg-[var(--color-green)]/10 text-[var(--color-green)] border border-[var(--color-green)]/30 hover:bg-[var(--color-green)]/20 cursor-pointer"
                    : isClickable
                    ? "text-[var(--fg-markdown)] hover:text-[var(--fg-editor)] hover:bg-[var(--bg-panel)] cursor-pointer"
                    : "text-[var(--fg-comments)] opacity-50 cursor-not-allowed"
                }`}
              >
                {isPast ? (
                  <span className="w-4 h-4 rounded-full bg-[var(--color-green)] text-[var(--color-btn-text)] flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                ) : (
                  <Icon className="w-4 h-4 shrink-0" />
                )}
                <span>{s.label}</span>
              </button>

              {idx < steps.length - 1 && (
                <div
                  className={`w-3 sm:w-6 h-0.5 rounded-full transition-colors ${
                    isPast
                      ? "bg-[var(--color-green)]/40"
                      : "bg-[var(--border-muted)]"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
