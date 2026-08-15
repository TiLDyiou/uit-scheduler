"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { RotateCcw, X, AlertTriangle } from "lucide-react";

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ResetModal({ isOpen, onClose, onConfirm }: ResetModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] w-screen h-screen flex items-center justify-center p-4 sm:p-6 bg-black/65 dark:bg-black/80 transition-opacity duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md my-auto rounded-[1.75rem] bg-[var(--bg-panel)] border border-[var(--border-terminal)] p-6 shadow-2xl shadow-black/40 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full text-[var(--fg-comments)] hover:text-[var(--fg-editor)] hover:bg-[var(--bg-storm)] transition-colors"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 text-[var(--color-red)] mb-3">
          <div className="p-2.5 rounded-2xl bg-[var(--color-red)]/10 border border-[var(--color-red)]/25">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[var(--fg-editor)]">
            Xác nhận Làm mới dữ liệu
          </h3>
        </div>

        <p className="text-sm text-[var(--fg-markdown)] leading-relaxed">
          Bạn có chắc chắn muốn đặt lại toàn bộ cài đặt xếp lịch không? Danh sách môn học đã chọn,
          khung giờ rảnh và các phương án thời khóa biểu sẽ được xóa và đặt lại từ đầu.
        </p>

        <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-bold text-[var(--fg-editor)] hover:bg-[var(--bg-storm)] border border-[var(--border-muted)] transition-all hover:scale-105 active:scale-95"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full text-xs font-bold text-[var(--color-btn-text)] bg-[var(--color-red)] hover:bg-[var(--color-red)]/90 transition-all shadow-md shadow-[var(--color-red)]/25 flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            Đồng ý làm mới
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
