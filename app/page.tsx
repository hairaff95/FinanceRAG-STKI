"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Workspace1MejaAnalis } from "@/components/Workspace1MejaAnalis";
import { Workspace2LaboratoriumIR } from "@/components/Workspace2LaboratoriumIR";
import { Workspace3BenchmarkAblasi } from "@/components/Workspace3BenchmarkAblasi";
import { Workspace4SimulasiAuditCRAG } from "@/components/Workspace4SimulasiAuditCRAG";
import { Workspace5BrankasKorpusJurnal } from "@/components/Workspace5BrankasKorpusJurnal";
import { ShieldCheck } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState(1);
  const [isOnline, setIsOnline] = useState(true);
  const [totalChunks, setTotalChunks] = useState(3022);
  const [supabaseConnected, setSupabaseConnected] = useState(false);

  useEffect(() => {
    fetch("/api/fincrag")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "ONLINE") {
          setIsOnline(true);
          setTotalChunks(data.totalChunks || 3022);
          setSupabaseConnected(Boolean(data.supabaseConnected));
        }
      })
      .catch((err) => {
        console.warn("Gagal mengecek status engine:", err);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0e0e10] text-[#f4f1ea]">
      {/* Neobrutalism Header & Banner */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOnline={isOnline}
        totalChunks={totalChunks}
        supabaseConnected={supabaseConnected}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 min-h-[75vh]">
        {activeTab === 1 && <Workspace1MejaAnalis />}
        {activeTab === 2 && <Workspace2LaboratoriumIR />}
        {activeTab === 3 && <Workspace3BenchmarkAblasi />}
        {activeTab === 4 && <Workspace4SimulasiAuditCRAG />}
        {activeTab === 5 && <Workspace5BrankasKorpusJurnal />}
      </main>

      {/* Neobrutalist Footer */}
      <footer className="border-t-2 border-neutral-800 bg-[#0e0e10] py-8 mt-16 text-xs font-mono text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-display text-xl text-white uppercase tracking-wider">
              FIN-CRAG
            </span>
            <span className="text-neutral-600">|</span>
            <span className="text-neutral-300 font-bold">STKI UDINUS 2026</span>
            <span className="text-neutral-600">|</span>
            <span className="px-3 py-1 rounded-full bg-[#C8E087] text-black font-bold border border-black flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> ZERO EXTERNAL AI API
            </span>
          </div>

          <div className="flex items-center gap-3 text-neutral-400 text-[11px] font-bold">
            <span className="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800">
              KORPUS: 3.022 CHUNKS (KBMI 4)
            </span>
            <span className="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[#F8C646]">
              RPS M1–M14
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
