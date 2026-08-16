"use client";

import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import StepIndicator from "@/components/StepIndicator";
import Step1CourseSelection from "@/components/Step1CourseSelection";
import Step2TimePreference from "@/components/Step2TimePreference";
import Step3Results from "@/components/Step3Results";
import ResetModal from "@/components/ResetModal";
import { Section, TimeSlot, ScheduleSolution, StepType, PinnedCourseSection } from "@/types/scheduler";
import { solveSchedule } from "@/lib/scheduler-solver";
import { AlertCircle, X } from "lucide-react";

const STORAGE_KEY = "uit_scheduler_state_v4";

export default function SchedulerPage() {
  const [isClient, setIsClient] = useState(false);
  const [step, setStep] = useState<StepType>("selection");
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedCourseCodes, setSelectedCourseCodes] = useState<string[]>([]);
  const [pinnedSections, setPinnedSections] = useState<Record<string, PinnedCourseSection>>({});
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[] | null>(null);
  const [solutions, setSolutions] = useState<ScheduleSolution[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);

  // Initialize and hydrate from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sections && Array.isArray(parsed.sections) && parsed.sections.length > 0) {
          setSections(parsed.sections);
        }
        if (parsed.selectedCourseCodes && Array.isArray(parsed.selectedCourseCodes)) {
          setSelectedCourseCodes(parsed.selectedCourseCodes);
        }
        if (parsed.pinnedSections && typeof parsed.pinnedSections === "object") {
          setPinnedSections(parsed.pinnedSections);
        }
        if (parsed.availableSlots) {
          setAvailableSlots(parsed.availableSlots);
        }
        if (parsed.solutions && Array.isArray(parsed.solutions)) {
          setSolutions(parsed.solutions);
        }
        if (parsed.warnings && Array.isArray(parsed.warnings)) {
          setWarnings(parsed.warnings);
        }
        if (parsed.step) {
          setStep(parsed.step);
        }
      }
    } catch (err) {
      console.warn("Could not load saved scheduler state:", err);
    }
    setIsClient(true);
  }, []);

  // Persist state to localStorage on update
  useEffect(() => {
    if (!isClient) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          step,
          sections,
          selectedCourseCodes,
          pinnedSections,
          availableSlots,
          solutions,
          warnings,
        })
      );
    } catch (err) {
      console.warn("Could not save scheduler state:", err);
    }
  }, [
    isClient,
    step,
    sections,
    selectedCourseCodes,
    pinnedSections,
    availableSlots,
    solutions,
    warnings,
  ]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastError) {
      const timer = setTimeout(() => setToastError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastError]);

  // Unique courses count
  const uniqueCoursesCount = useMemo(() => {
    const set = new Set(sections.map((s) => s.course_code.replace(/\.[12]$/, "")));
    return set.size;
  }, [sections]);

  const handleNextToPreference = (selected: string[]) => {
    setSelectedCourseCodes(selected);
    setError(null);
    setStep("preference");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSolve = (slots: TimeSlot[] | null, isToast = false) => {
    setAvailableSlots(slots);
    setLoading(true);
    if (isToast) setToastError(null);
    else setError(null);

    // Yield to let UI update loading state
    setTimeout(() => {
      try {
        const result = solveSchedule({
          course_codes: selectedCourseCodes,
          sections,
          available_slots: slots,
          pinned_sections: pinnedSections,
        });

        setWarnings(result.warnings);

        if (result.solutions.length === 0) {
          const hasBusySlots = slots && slots.length < 60;
          const msg = hasBusySlots
            ? "Không xếp được lịch học nào do các lớp (hoặc lớp cố định) bị trùng với khung giờ bận bạn đã chọn. Vui lòng mở rộng khung giờ rảnh (bỏ bớt các ô đỏ) hoặc đổi lớp cố định."
            : "Không tìm được phương án xếp lịch không trùng cho các môn/lớp đã chọn. Vui lòng quay lại bước trước để thay đổi danh sách môn học hoặc đổi mã lớp cố định.";

          if (isToast) setToastError(msg);
          else setError(msg);
        } else {
          setSolutions(result.solutions);
          setStep("results");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch (err) {
        console.error("Solver error:", err);
        const msg = "Đã xảy ra lỗi trong quá trình tính toán xếp lịch.";
        if (isToast) setToastError(msg);
        else setError(msg);
      } finally {
        setLoading(false);
      }
    }, 50);
  };

  const confirmReset = () => {
    setStep("selection");
    setSections([]);
    setSelectedCourseCodes([]);
    setPinnedSections({});
    setAvailableSlots(null);
    setSolutions([]);
    setWarnings([]);
    setError(null);
    setToastError(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    setShowResetModal(false);
  };

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-night)] text-[var(--fg-editor)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[var(--color-blue)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-[var(--fg-comments)]">Đang tải UIT Scheduler...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-night)] text-[var(--fg-editor)] flex flex-col font-sans transition-colors duration-250">
      {/* Header */}
      <Header
        totalSections={sections.length}
        uniqueCourses={uniqueCoursesCount}
        onReset={() => setShowResetModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Step Indicator */}
        <StepIndicator
          currentStep={step}
          onStepChange={(newStep) => {
            if (newStep === "results") {
              handleSolve(availableSlots, true);
            } else {
              setStep(newStep);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          selectedCount={selectedCourseCodes.length}
          canGoToResults={Boolean(availableSlots || solutions.length > 0)}
        />

        {/* Step Content */}
        <div className="mt-4">
          {step === "selection" && (
            <Step1CourseSelection
              sections={sections}
              setSections={setSections}
              onNext={handleNextToPreference}
              onQuickSolve={() => handleSolve(availableSlots, true)}
              canQuickSolve={Boolean(availableSlots || solutions.length > 0)}
              selectedCourseCodes={selectedCourseCodes}
              setSelectedCourseCodes={setSelectedCourseCodes}
              pinnedSections={pinnedSections}
              setPinnedSections={setPinnedSections}
            />
          )}

          {step === "preference" && (
            <Step2TimePreference
              onSolve={handleSolve}
              availableSlots={availableSlots}
              setAvailableSlots={setAvailableSlots}
              loading={loading}
              error={error}
              selectedCourseCount={selectedCourseCodes.length}
            />
          )}

          {step === "results" && (
            <Step3Results
              solutions={solutions}
              allSections={sections}
              availableSlots={availableSlots}
              warnings={warnings}
              onBack={() => setStep("preference")}
              onBackToSelection={() => setStep("selection")}
            />
          )}
        </div>
      </main>

      {/* Toast Error Popup */}
      {toastError && (
        <div className="fixed top-20 right-4 z-50 animate-in fade-in slide-in-from-top-3 max-w-md w-full p-4">
          <div className="p-4 rounded-2xl bg-rose-600 text-white shadow-2xl flex items-start gap-3 border border-rose-500">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm leading-relaxed flex-1">{toastError}</p>
            <button
              onClick={() => setToastError(null)}
              className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      <ResetModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={confirmReset}
      />
    </div>
  );
}
