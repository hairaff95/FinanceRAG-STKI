"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface NeoDropdownOption {
  value: string;
  label: string;
  badge?: string;
  badgeBg?: string;
  badgeColor?: string;
}

interface NeoDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: NeoDropdownOption[];
  placeholder?: string;
  headerLabel?: string;
  className?: string;
}

export const NeoDropdown: React.FC<NeoDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = "Pilih...",
  headerLabel = "PILIH OPSI EMITEN:",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full min-w-[210px] bg-[#F4F1EA] text-black border-3 border-black rounded-2xl px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-between gap-3 shadow-[4px_4px_0px_#000000] hover:bg-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#000000] transition-all focus:outline-none"
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.badgeBg && (
            <span
              className="w-2.5 h-2.5 rounded-full border border-black shrink-0"
              style={{ backgroundColor: selectedOption.badgeBg }}
            />
          )}
          <span className="truncate">{selectedOption?.label || placeholder}</span>
        </div>

        <div
          className={`w-6 h-6 rounded-full bg-black text-white flex items-center justify-center shrink-0 border border-black transition-transform duration-200 ${
            isOpen ? "rotate-180 bg-[#F8C646] text-black" : ""
          }`}
        >
          <ChevronDown className="w-3.5 h-3.5 stroke-[3]" />
        </div>
      </button>

      {/* Custom Neobrutalist Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-full min-w-[230px] bg-[#F4F1EA] border-3 border-black rounded-2xl shadow-[6px_6px_0px_#000000] z-50 overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 border-b-2 border-black/10 text-[10px] font-mono font-bold uppercase text-neutral-500 tracking-wider">
            {headerLabel}
          </div>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 text-left text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-between gap-2 border-b border-black/10 last:border-b-0 transition-colors ${
                  isSelected
                    ? "bg-black text-white"
                    : "text-black hover:bg-[#F8C646] hover:text-black"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {opt.badgeBg && (
                    <span
                      className="w-3 h-3 rounded-full border border-black shrink-0"
                      style={{ backgroundColor: opt.badgeBg }}
                    />
                  )}
                  <span className="truncate">{opt.label}</span>
                </div>

                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-[#C8E087] text-black flex items-center justify-center shrink-0 border border-black">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
