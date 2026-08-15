"use client";

import { useEffect, useState } from "react";
import { RotateCcw, Sun, Moon } from "lucide-react";

interface HeaderProps {
  totalSections: number;
  uniqueCourses: number;
  onReset: () => void;
}

export default function Header({
  totalSections,
  uniqueCourses,
  onReset,
}: HeaderProps) {
  const [theme, setTheme] = useState<"dark" | "light">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      setTheme("light");
    }
  }, []);

  const toggleTheme = () => {
    if (theme === "dark") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-muted)] bg-[var(--bg-storm)]/80 backdrop-blur-xl transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Left: Brand & UIT Title */}
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-extrabold text-[var(--fg-editor)] tracking-tight truncate">
            UIT Scheduler
          </h1>
          <p className="text-xs text-[var(--fg-comments)] truncate font-medium">
            <span>Trường Đại học Công nghệ Thông tin • ĐHQG-HCM</span>
          </p>
        </div>

        {/* Right: Stats, Theme toggle, Reset button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {totalSections > 0 ? (
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-muted)] text-xs text-[var(--fg-markdown)] shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[var(--color-green)] animate-pulse" />
              <span>
                <strong className="font-bold text-[var(--fg-editor)]">
                  {totalSections}
                </strong>{" "}
                lớp học ({uniqueCourses} môn)
              </span>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-muted)] text-xs text-[var(--fg-comments)]">
              <span>Chưa nạp dữ liệu TKB</span>
            </div>
          )}

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-[var(--border-muted)] bg-[var(--bg-panel)] text-[var(--fg-markdown)] hover:text-[var(--fg-editor)] hover:border-[var(--border-terminal)] transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
            title={
              theme === "dark"
                ? "Chuyển sang giao diện sáng"
                : "Chuyển sang giao diện tối"
            }
            aria-label="Chuyển đổi giao diện"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-[var(--color-yellow)]" />
            ) : (
              <Moon className="w-4 h-4 text-[var(--color-blue)]" />
            )}
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[var(--color-red)] bg-[var(--color-red)]/10 hover:bg-[var(--color-red)]/20 border border-[var(--color-red)]/25 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
            title="Làm mới toàn bộ dữ liệu xếp lịch"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>
      </div>
    </header>
  );
}
