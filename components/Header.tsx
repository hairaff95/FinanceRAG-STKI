import React from "react";
import { Sparkles, ArrowRight, ShieldCheck, Database, Zap } from "lucide-react";

interface HeaderProps {
  activeTab: number;
  setActiveTab: (tab: number) => void;
  isOnline: boolean;
  totalChunks: number;
  supabaseConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isOnline,
  totalChunks,
  supabaseConnected,
}) => {
  const tabs = [
    { id: 1, label: "MEJA ANALIS", sub: "QA & PIPELINE" },
    { id: 2, label: "LABORATORIUM IR", sub: "5 METODE" },
    { id: 3, label: "BENCHMARK", sub: "EVALUASI M8" },
    { id: 4, label: "AUDIT CRAG", sub: "4 SKENARIO" },
    { id: 5, label: "BRANKAS KORPUS", sub: "SUPABASE & RPS" },
  ];

  return (
    <header className="w-full pt-4 pb-2 px-4 sm:px-6 lg:px-8">
      {/* 1. Neobrutalist Pill Navbar (As seen in the top of reference image) */}
      <div className="max-w-7xl mx-auto bg-[#F4F1EA] text-black border-2 border-black rounded-full px-4 sm:px-6 py-2.5 shadow-[4px_4px_0px_#000000] flex items-center justify-between gap-3">
        {/* Left: Star Badge & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#6C5CE7] text-white flex items-center justify-center font-bold shadow-sm border border-black">
            <Sparkles className="w-4 h-4 fill-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display text-xl tracking-wide uppercase font-bold text-black">
              FIN-CRAG
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-[#C8E087] text-[10px] font-mono font-bold border border-black uppercase">
              KBMI 4
            </span>
          </div>
        </div>

        {/* Center: Workspaces Nav (Uppercase Pill Links) */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-workspace-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase transition-colors duration-100 border-2 ${
                  isActive
                    ? "bg-[#F8C646] text-black border-black shadow-[2px_2px_0px_#000000]"
                    : "text-neutral-700 hover:text-black hover:bg-neutral-200 border-transparent"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Status Pill Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black text-white text-[11px] font-mono font-bold border border-black">
            <span className="w-2 h-2 rounded-full bg-[#C8E087] animate-pulse"></span>
            <span>{supabaseConnected ? "ONLINE" : "3.022 CHUNKS"}</span>
          </div>
        </div>
      </div>

      {/* Mobile Navbar Dropdown / Scrollable Tabs */}
      <div className="flex md:hidden overflow-x-auto gap-2 py-3 px-1 no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold whitespace-nowrap border-2 border-black ${
              activeTab === tab.id
                ? "bg-[#F8C646] text-black shadow-[2px_2px_0px_#000000]"
                : "bg-white text-black"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 2. Big Condensed Typography Banner */}
      <div className="max-w-7xl mx-auto pt-6 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-neutral-800 pb-5">
          <div className="w-full">
            <h2 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl uppercase tracking-tight text-white leading-none flex flex-wrap items-center gap-x-3 sm:gap-x-5 gap-y-1">
              <span>RETRIEVE</span>
              <span className="inline-flex items-center justify-center w-9 h-9 sm:w-14 sm:h-14 rounded-full border-2 sm:border-3 border-white text-white">
                <ShieldCheck className="w-5 h-5 sm:w-8 sm:h-8" />
              </span>
              <span>VERIFY</span>
              <span className="inline-flex items-center justify-center w-9 h-9 sm:w-14 sm:h-14 rounded-full bg-[#F8C646] text-black border-2 sm:border-3 border-black">
                <Sparkles className="w-5 h-5 sm:w-8 sm:h-8 fill-black" />
              </span>
              <span className="text-[#9BD2FD]">SYNTHESIZE</span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono text-neutral-400">
            <span className="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-700 text-[#F8C646] font-bold">
              BBCA • BBRI • BMRI • BBNI
            </span>
            <span className="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-700 text-[#C8E087] font-bold">
              ZERO EXTERNAL AI API
            </span>
            <span className="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-700 text-[#9BD2FD] font-bold">
              UDINUS STKI 2026
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
