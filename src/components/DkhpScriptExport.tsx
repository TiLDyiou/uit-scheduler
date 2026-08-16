"use client";

import React, { useState, useMemo } from "react";
import { Section } from "@/types/scheduler";
import {
  extractListMaLop,
  getScriptDkhp,
  tokenizeJsLine,
} from "@/lib/dkhp-script";
import {
  Copy,
  Check,
  ExternalLink,
  HelpCircle,
  Sparkles,
  Layers,
  FileCode,
} from "lucide-react";

interface DkhpScriptExportProps {
  sections: Section[];
  totalCredits?: number;
}

export default function DkhpScriptExport({ sections }: DkhpScriptExportProps) {
  const [scriptCopied, setScriptCopied] = useState(false);
  const [listCopied, setListCopied] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const listMaLop = useMemo(() => extractListMaLop(sections), [sections]);
  const scriptCode = useMemo(() => getScriptDkhp(listMaLop), [listMaLop]);
  const commaSeparatedList = useMemo(() => listMaLop.join(", "), [listMaLop]);

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(scriptCode);
      setScriptCopied(true);
      setTimeout(() => setScriptCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy script:", err);
    }
  };

  const handleCopyList = async () => {
    try {
      await navigator.clipboard.writeText(commaSeparatedList);
      setListCopied(true);
      setTimeout(() => setListCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy class list:", err);
    }
  };

  const lines = useMemo(() => scriptCode.split("\n"), [scriptCode]);

  return (
    <div className="p-1.5 rounded-[1.75rem] bg-[var(--bg-storm)] border border-[var(--border-muted)] shadow-md shadow-black/5">
      <div className="rounded-[1.4rem] bg-[var(--bg-panel)] border border-[var(--border-muted)]/60 overflow-hidden">
        {/* Class Codes & Action Buttons Bar */}
        <div className="p-3 sm:p-3.5 bg-[var(--bg-storm)]/40 border-b border-[var(--border-muted)] flex items-center justify-between gap-3">
          {/* Class Codes - display all codes without truncation */}
          <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mr-1 text-[11px] font-bold uppercase tracking-wider text-[var(--fg-comments)] shrink-0">
              <Layers className="w-3.5 h-3.5 text-[var(--color-magenta)] shrink-0" />
              <span>Mã lớp ({listMaLop.length}):</span>
            </div>

            {listMaLop.length > 0 ? (
              listMaLop.map((code) => (
                <span
                  key={code}
                  className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-[var(--bg-panel)] border border-[var(--border-muted)] text-[var(--color-blue)] shadow-xs"
                >
                  {code}
                </span>
              ))
            ) : (
              <span className="font-mono text-xs text-[var(--fg-comments)]">
                Chưa có mã lớp nào
              </span>
            )}
          </div>

          {/* Action Buttons: Copy Class Codes & Guide (?) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Copy Class Codes button */}
            <button
              onClick={handleCopyList}
              disabled={listMaLop.length === 0}
              className={`p-1.5 rounded-xl border transition-all flex items-center justify-center shadow-xs disabled:opacity-50 ${
                listCopied
                  ? "border-[var(--color-green)] bg-[var(--color-green)]/15 text-[var(--color-green)]"
                  : "border-[var(--border-muted)] bg-[var(--bg-panel)] hover:bg-[var(--bg-storm)] text-[var(--fg-comments)] hover:text-[var(--fg-editor)]"
              }`}
              title={
                listCopied ? "Đã sao chép mã lớp" : "Sao chép danh sách mã lớp"
              }
              aria-label="Sao chép danh sách mã lớp"
            >
              {listCopied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            {/* Guide toggle button (?) */}
            <button
              onClick={() => setShowGuide((prev) => !prev)}
              className={`p-1.5 rounded-xl border transition-all flex items-center justify-center shadow-xs ${
                showGuide
                  ? "border-[var(--color-cyan)] bg-[var(--color-cyan)]/15 text-[var(--color-cyan)]"
                  : "border-[var(--border-muted)] bg-[var(--bg-panel)] hover:bg-[var(--bg-storm)] text-[var(--fg-comments)] hover:text-[var(--fg-editor)]"
              }`}
              title={showGuide ? "Ẩn hướng dẫn" : "Hướng dẫn sử dụng"}
              aria-label="Hướng dẫn sử dụng"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible / Quick Instructions */}
        {showGuide && (
          <div className="p-4 sm:p-5 bg-[var(--color-blue)]/5 border-b border-[var(--border-muted)] space-y-3 animate-fade-in-up">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-blue)]">
              <Sparkles className="w-4 h-4" />
              <span>Hướng dẫn sử dụng Script đăng ký nhanh 3 bước:</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-muted)]/70 space-y-1">
                <div className="font-bold text-[var(--color-blue)] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[var(--color-blue)]/15 flex items-center justify-center text-[10px]">
                    1
                  </span>
                  <span>Mở trang ĐKHP</span>
                </div>
                <p className="text-[var(--fg-markdown)] text-[11px] leading-relaxed">
                  Truy cập{" "}
                  <a
                    href="https://dkhp.uit.edu.vn"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-blue)] underline inline-flex items-center gap-0.5 font-medium"
                  >
                    dkhp.uit.edu.vn
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>{" "}
                  và đăng nhập vào phần Đăng ký học phần.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-muted)]/70 space-y-1">
                <div className="font-bold text-[var(--color-magenta)] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[var(--color-magenta)]/15 flex items-center justify-center text-[10px]">
                    2
                  </span>
                  <span>Mở Console (F12)</span>
                </div>
                <p className="text-[var(--fg-markdown)] text-[11px] leading-relaxed">
                  Nhấn phím{" "}
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-storm)] border border-[var(--border-muted)] font-mono text-[10px]">
                    F12
                  </kbd>{" "}
                  (hoặc chuột phải chọn <em>Inspect / Kiểm tra</em>), sau đó
                  chọn tab <strong>Console</strong>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-muted)]/70 space-y-1">
                <div className="font-bold text-[var(--color-green)] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[var(--color-green)]/15 flex items-center justify-center text-[10px]">
                    3
                  </span>
                  <span>Dán & Nhấn Enter</span>
                </div>
                <p className="text-[var(--fg-markdown)] text-[11px] leading-relaxed">
                  Sao chép mã, dán (Ctrl+V) vào Console và nhấn Enter.{" "}
                  <em>
                    (Nếu trình duyệt cảnh báo lần đầu, hãy gõ{" "}
                    <strong className="font-mono text-[var(--color-orange)]">
                      allow pasting
                    </strong>{" "}
                    rồi nhấn Enter trước khi dán).
                  </em>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Code Editor Container with Syntax Highlighting matching app color scheme */}
        <div className="relative">
          {/* Top sub-header of code block with icon-only Copy Button */}
          <div className="px-4 py-2 bg-[var(--bg-storm)]/60 border-b border-[var(--border-muted)]/60 flex items-center justify-between text-[11px] text-[var(--fg-comments)] font-mono">
            <div className="flex items-center gap-2">
              <FileCode className="w-3.5 h-3.5 text-[var(--color-blue)]" />
              <span className="font-semibold text-[var(--fg-editor)]">
                dkhp-register.js
              </span>
            </div>

            {/* Copy JS Script button (icon-only) */}
            <button
              onClick={handleCopyScript}
              disabled={listMaLop.length === 0}
              className={`p-1.5 rounded-lg transition-all flex items-center justify-center shadow-xs active:scale-95 disabled:opacity-50 ${
                scriptCopied
                  ? "bg-[var(--color-green)] text-[var(--color-btn-text)] shadow-[var(--color-green)]/20"
                  : "bg-[var(--color-blue)] hover:bg-[var(--color-blue)]/90 text-[var(--color-btn-text)] shadow-[var(--color-blue)]/25 hover:scale-105"
              }`}
              title={scriptCopied ? "Đã sao chép mã JS!" : "Sao chép mã JS"}
              aria-label="Sao chép mã JS"
            >
              {scriptCopied ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Code Viewer (Valid table element) */}
          <div className="overflow-x-auto custom-scrollbar bg-[var(--bg-storm)]/30 max-h-[360px] p-3 sm:p-4 text-xs font-mono leading-relaxed">
            <table className="m-0 p-0 w-full border-collapse">
              <tbody>
                {lines.map((line, lineIdx) => {
                  const tokens = tokenizeJsLine(line);
                  return (
                    <tr
                      key={lineIdx}
                      className="hover:bg-[var(--bg-storm)]/50 transition-colors"
                    >
                      {/* Line number */}
                      <td className="w-10 pr-3 py-0.5 text-right select-none text-[10px] text-[var(--fg-comments)]/60 font-mono align-top border-r border-[var(--border-muted)]/30">
                        {lineIdx + 1}
                      </td>

                      {/* Code Content */}
                      <td className="pl-3 py-0.5 whitespace-pre align-top">
                        {tokens.map((token, tokenIdx) => {
                          let colorClass = "text-[var(--fg-variable)]";
                          let extraClass = "";

                          switch (token.type) {
                            case "comment":
                              colorClass = "text-[var(--fg-comments)]";
                              extraClass = "italic";
                              break;
                            case "string":
                              colorClass = "text-[var(--color-green)]";
                              break;
                            case "keyword":
                              colorClass =
                                "text-[var(--color-magenta)] font-bold";
                              break;
                            case "builtin":
                              colorClass =
                                "text-[var(--color-cyan)] font-semibold";
                              break;
                            case "boolean-number":
                              colorClass =
                                "text-[var(--color-orange)] font-semibold";
                              break;
                            case "function":
                              colorClass =
                                "text-[var(--color-blue)] font-semibold";
                              break;
                            case "operator":
                              colorClass = "text-[var(--color-teal)]";
                              break;
                            case "punctuation":
                              colorClass = "text-[var(--fg-editor)]";
                              break;
                            case "text":
                            default:
                              colorClass = "text-[var(--fg-editor)]";
                              break;
                          }

                          return (
                            <span
                              key={tokenIdx}
                              className={`${colorClass} ${extraClass}`}
                            >
                              {token.text}
                            </span>
                          );
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
