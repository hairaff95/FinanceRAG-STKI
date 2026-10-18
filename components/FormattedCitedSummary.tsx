"use client";

import React from "react";
import { Info, AlertTriangle } from "lucide-react";

interface FormattedCitedSummaryProps {
  content: string;
}

export const FormattedCitedSummary: React.FC<FormattedCitedSummaryProps> = ({ content }) => {
  if (!content) return null;

  // Helper to render inline formatting: bold (**), italic (*), citations ([1], [2])
  const renderInline = (text: string): React.ReactNode[] => {
    // Regex splits by bold (**text**), italic (*text*), and citations ([1])
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|\[\d+\])/g;
    const parts = text.split(regex);

    return parts.map((part, idx) => {
      // 1. Bold (**text**)
      if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
        return (
          <strong key={idx} className="font-bold text-black">
            {part.slice(2, -2)}
          </strong>
        );
      }

      // 2. Italic (*text*)
      if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
        return (
          <em key={idx} className="italic text-neutral-800 font-semibold">
            {part.slice(1, -1)}
          </em>
        );
      }

      // 3. Citation badge ([1], [2], etc.)
      if (/^\[\d+\]$/.test(part)) {
        const num = part.slice(1, -1);
        return (
          <span
            key={idx}
            className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-[#F8C646] text-black text-[10px] font-mono font-bold border border-black shadow-[1px_1px_0px_#000000] mx-1 align-middle"
            title={`Sitasi Rujukan Bukti [${num}]`}
          >
            {num}
          </span>
        );
      }

      return <span key={idx}>{part}</span>;
    });
  };

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // 1. Horizontal divider (---, ***, ___)
    if (/^[-*_]{3,}$/.test(trimmed)) {
      elements.push(
        <div key={`hr-${i}`} className="border-t-2 border-black/20 my-4" />
      );
      i++;
      continue;
    }

    // 2. Markdown Headings (### Header, ## Header, # Header)
    if (/^#{1,6}\s+/.test(trimmed)) {
      const headerText = trimmed.replace(/^#{1,6}\s+/, "");
      elements.push(
        <div key={`h-${i}`} className="mt-5 mb-2 first:mt-1">
          <h4 className="font-display text-xl sm:text-2xl uppercase tracking-tight text-black flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#F8C646] border-2 border-black shrink-0" />
            <span>{headerText}</span>
          </h4>
        </div>
      );
      i++;
      continue;
    }

    // 3. Blockquote (> ...)
    if (trimmed.startsWith(">")) {
      const quoteText = trimmed.replace(/^>\s*/, "");
      elements.push(
        <div
          key={`quote-${i}`}
          className="p-4 bg-[#FFF9E6] border-2 border-black rounded-2xl text-xs sm:text-sm font-sans font-medium text-neutral-900 shadow-[3px_3px_0px_#000000] my-3 flex items-start gap-2.5"
        >
          <AlertTriangle className="w-4 h-4 text-[#F8C646] shrink-0 mt-0.5 fill-black" />
          <div className="flex-1 leading-relaxed">{renderInline(quoteText)}</div>
        </div>
      );
      i++;
      continue;
    }

    // 4. Synthesizer disclaimer note (*Rangkuman di atas disintesis...*)
    if (
      (trimmed.startsWith("*") && trimmed.endsWith("*") && trimmed.length > 30) ||
      trimmed.toLowerCase().includes("rangkuman di atas disintesis secara deterministik")
    ) {
      const noteText = trimmed.replace(/^\*+|\*+$/g, "");
      elements.push(
        <div
          key={`note-${i}`}
          className="p-3.5 bg-white rounded-2xl border-2 border-black/30 text-xs font-mono text-neutral-800 my-4 flex items-start gap-2.5 shadow-[2px_2px_0px_rgba(0,0,0,0.1)]"
        >
          <Info className="w-4 h-4 text-neutral-700 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">{renderInline(noteText)}</div>
        </div>
      );
      i++;
      continue;
    }

    // 5. Bullet list item (starts with • or - or *)
    if (trimmed.startsWith("•") || /^[*-]\s+/.test(trimmed)) {
      const bulletContent = trimmed.replace(/^[•*\-]\s+/, "");
      elements.push(
        <div
          key={`bullet-${i}`}
          className="p-3.5 sm:p-4 bg-white rounded-2xl border-2 border-black shadow-[3px_3px_0px_#000000] my-2 text-xs sm:text-sm font-sans font-medium text-neutral-900 leading-relaxed flex items-start gap-3 transition-transform hover:-translate-y-0.5"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#F8C646] border-2 border-black shrink-0 mt-1" />
          <div className="flex-1">{renderInline(bulletContent)}</div>
        </div>
      );
      i++;
      continue;
    }

    // 6. Quoted financial text (starts with " or “)
    if (trimmed.startsWith('"') || trimmed.startsWith('“')) {
      elements.push(
        <div
          key={`text-quote-${i}`}
          className="p-4 bg-white rounded-2xl border-2 border-black shadow-[3px_3px_0px_#000000] my-2.5 text-xs sm:text-sm font-sans font-medium text-neutral-900 leading-relaxed"
        >
          {renderInline(trimmed)}
        </div>
      );
      i++;
      continue;
    }

    // 7. Regular paragraph
    elements.push(
      <p key={`p-${i}`} className="leading-relaxed text-sm sm:text-base font-sans text-neutral-900 my-2">
        {renderInline(trimmed)}
      </p>
    );
    i++;
  }

  return <div className="space-y-1">{elements}</div>;
};
