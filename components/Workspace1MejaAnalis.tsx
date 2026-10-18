"use client";

import React, { useState } from "react";
import {
  Search,
  ArrowRight,
  Sparkles,
  Server,
  Layers,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import { FINCRAGResponse } from "@/lib/types";
import { FormattedCitedSummary } from "./FormattedCitedSummary";

export const Workspace1MejaAnalis: React.FC = () => {
  const [query, setQuery] = useState("Berapa laba bersih dan pertumbuhan kredit BBCA pada tahun 2025?");
  const [selectedBank, setSelectedBank] = useState<string>("ALL");
  const [useOllama, setUseOllama] = useState(false);
  const [ollamaModel, setOllamaModel] = useState("llama3");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FINCRAGResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scenarioPills = [
    {
      label: "Kinerja Laba & Kredit",
      q: "Berapa laba bersih dan pertumbuhan kredit BBCA pada tahun 2025?",
      bank: "BBCA",
    },
    {
      label: "Komparasi 2 Bank (BBRI vs BMRI)",
      q: "Bandingkan rasio NPL dan CAR antara Bank BRI (BBRI) dan Bank Mandiri (BMRI) tahun 2025",
      bank: "ALL",
    },
    {
      label: "Dana Murah & Target 2026",
      q: "Bagaimana rasio CASA dana murah dan strategi target pertumbuhan kredit BBNI 2026?",
      bank: "BBNI",
    },
    {
      label: "Uji Abstain (Luar Topik)",
      q: "Bagaimana resep dan bumbu cara memasak rendang daging sapi padang?",
      bank: "ALL",
    },
  ];

  const bankHeroCards = [
    {
      code: "BBRI",
      name: "BANK RAKYAT INDONESIA",
      chunks: "754 CHUNKS",
      bg: "bg-[#6C5CE7] text-white",
      sampleQ: "Bagaimana penyaluran kredit UMKM dan rasio NPL pada Bank BRI (BBRI)?",
    },
    {
      code: "BBNI",
      name: "BANK NEGARA INDONESIA",
      chunks: "789 CHUNKS",
      bg: "bg-[#EB4D4B] text-white",
      sampleQ: "Berapa rasio CASA dana murah dan laba bersih BNI (BBNI) 2025?",
    },
    {
      code: "BMRI",
      name: "BANK MANDIRI",
      chunks: "647 CHUNKS",
      bg: "bg-[#9BD2FD] text-black",
      sampleQ: "Berapa rasio CAR kecukupan modal dan aset Bank Mandiri (BMRI)?",
    },
    {
      code: "BBCA",
      name: "BANK CENTRAL ASIA",
      chunks: "832 CHUNKS",
      bg: "bg-[#C8E087] text-black",
      sampleQ: "Berapa laba bersih dan pertumbuhan kredit BBCA pada tahun 2025?",
    },
  ];

  const handleRunQuery = async (customQ?: string, customBank?: string) => {
    const qToRun = customQ !== undefined ? customQ : query;
    const bankToRun = customBank !== undefined ? customBank : selectedBank;

    if (!qToRun.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/fincrag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: qToRun,
          bankFilter: bankToRun !== "ALL" ? bankToRun : null,
          useOllama,
          ollamaModel,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data: FINCRAGResponse = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Gagal memproses kueri.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    if (status === "CORRECT") return "bg-[#C8E087] text-black border-2 border-black";
    if (status === "AMBIGUOUS") return "bg-[#F8C646] text-black border-2 border-black";
    return "bg-[#EB4D4B] text-white border-2 border-black";
  };

  return (
    <div className="space-y-8">
      {/* 1. Neobrutalist Hero Section (EXACT Layout from Reference Image) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Large Card: Warm Mustard Yellow (Matches "EXPLORE 500+ MASTERCLASSES...") */}
        <div className="lg:col-span-7 bg-[#F8C646] text-black rounded-3xl p-6 sm:p-8 border-3 border-black shadow-[6px_6px_0px_#000000] flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-black text-white text-[11px] font-mono font-bold uppercase tracking-wider">
                FINANCIAL AI TERMINAL
              </span>
              <span className="text-xs font-mono font-bold bg-white text-black px-3 py-1 rounded-full border-2 border-black">
                KBMI 4 BEI
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl uppercase tracking-tight leading-[0.95]">
              EXPLORE{" "}
              <span className="hand-drawn-circle px-1">3.022+</span>{" "}
              BANKING CHUNKS AND VERIFY RATIOS
            </h1>

            <p className="text-xs sm:text-sm font-sans font-medium text-neutral-800 max-w-lg leading-relaxed">
              Mekanisme temu kembali multi-agen dengan mitigasi halusinasi, fusi peringkat BM25–LSI, dan audit bukti numerik akuntansi.
            </p>
          </div>

          {/* Integrated Search Input inside the Yellow Card */}
          <div className="space-y-3 pt-2">
            <div className="relative">
              <textarea
                id="input-query-qa"
                rows={2}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tulis kueri laporan keuangan (Laba, CAR, NPL, CASA, Dividen)..."
                suppressHydrationWarning
                className="w-full h-20 min-h-[80px] bg-white text-black border-3 border-black rounded-2xl p-4 text-xs sm:text-sm font-sans font-bold placeholder-neutral-500 focus:outline-none focus:ring-0 resize-none shadow-[3px_3px_0px_#000000]"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Bank Selector Pills */}
              <div className="flex items-center gap-1.5 flex-wrap" id="bank-selector-group">
                {["ALL", "BBCA", "BBRI", "BMRI", "BBNI"].map((b) => (
                  <button
                    key={b}
                    id={`btn-bank-${b}`}
                    onClick={() => setSelectedBank(b)}
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold border-2 border-black transition-all ${
                      selectedBank === b
                        ? "bg-black text-white shadow-[2px_2px_0px_#ffffff]"
                        : "bg-white text-black hover:bg-neutral-100"
                    }`}
                  >
                    {b === "ALL" ? "Semua Bank" : b}
                  </button>
                ))}
              </div>

              {/* Action Button: Stable height to prevent cross-column layout jitter */}
              <button
                id="btn-submit-qa"
                onClick={() => handleRunQuery()}
                disabled={loading}
                className="h-12 min-h-[48px] flex items-center gap-2.5 px-5 rounded-full bg-black text-white font-mono font-bold text-xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all border-2 border-black shadow-[3px_3px_0px_#000000] disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <span>MEMPROSES...</span>
                    <span className="w-7 h-7 rounded-full bg-[#C8E087] text-black flex items-center justify-center shrink-0">
                      <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    </span>
                  </>
                ) : (
                  <>
                    <span>ANALISIS KORPUS</span>
                    <span className="w-7 h-7 rounded-full bg-[#C8E087] text-black flex items-center justify-center font-bold text-sm shrink-0">
                      →
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right 2x2 Grid: The 4 Bank KBMI 4 Cards (Tactile translation without scale jitter) */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {bankHeroCards.map((b) => (
            <div
              key={b.code}
              className={`group ${b.bg} rounded-3xl p-5 border-3 border-black shadow-[5px_5px_0px_#000000] flex flex-col justify-between hover:-translate-y-1 hover:shadow-[7px_7px_0px_#000000] active:translate-y-0.5 active:shadow-[2px_2px_0px_#000000] transition-all cursor-pointer ${
                selectedBank === b.code ? "ring-4 ring-white" : ""
              }`}
              onClick={() => {
                setQuery(b.sampleQ);
                setSelectedBank(b.code);
                handleRunQuery(b.sampleQ, b.code);
              }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-3xl sm:text-4xl tracking-tight uppercase leading-none">
                    {b.code}
                  </h3>
                  {selectedBank === b.code && (
                    <span className="px-2 py-0.5 bg-black text-white rounded-full text-[9px] font-mono font-bold uppercase tracking-wider">
                      AKTIF
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-90 mt-1">
                  {b.chunks}
                </div>
                <div className="text-[11px] font-sans font-semibold mt-1 opacity-80 line-clamp-1">
                  {b.name}
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-base border-2 border-black shadow-[2px_2px_0px_#000000] group-hover:translate-x-1 transition-transform">
                  →
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skenario Cepat Pills & Local Ollama Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#18181b] border-2 border-black rounded-2xl p-4 shadow-[4px_4px_0px_#000000]">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-mono font-bold text-[#F8C646] uppercase flex items-center gap-1 text-[11px]">
            <Sparkles className="w-3.5 h-3.5" /> Skenario Cepat:
          </span>
          {scenarioPills.map((p, idx) => (
            <button
              key={idx}
              id={`btn-scenario-${idx}`}
              onClick={() => {
                setQuery(p.q);
                setSelectedBank(p.bank);
                handleRunQuery(p.q, p.bank);
              }}
              className="px-3 py-1 rounded-full bg-[#F4F1EA] text-black font-sans font-bold text-xs border-2 border-black hover:bg-[#F8C646] hover:translate-x-0.5 hover:translate-y-0.5 transition-all shadow-[2px_2px_0px_#000000]"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Ollama Local Integration - Locked Height Pill to prevent vertical jitter */}
        <div className="flex items-center gap-2.5 bg-black text-white px-3.5 h-10 rounded-full border-2 border-black text-xs font-mono shrink-0 shadow-[2px_2px_0px_#000000]">
          <Server className="w-3.5 h-3.5 text-[#9BD2FD] shrink-0" />
          <label htmlFor="toggle-ollama" className="cursor-pointer font-bold select-none whitespace-nowrap">
            Ollama Local:
          </label>
          <input
            id="toggle-ollama"
            type="checkbox"
            checked={useOllama}
            onChange={(e) => setUseOllama(e.target.checked)}
            suppressHydrationWarning
            className="w-4 h-4 rounded text-[#6C5CE7] focus:ring-0 cursor-pointer shrink-0 accent-[#6C5CE7]"
          />
          {useOllama && (
            <input
              type="text"
              value={ollamaModel}
              onChange={(e) => setOllamaModel(e.target.value)}
              placeholder="llama3"
              suppressHydrationWarning
              className="bg-neutral-800 border border-neutral-600 px-2.5 h-6 rounded-full text-[11px] text-white w-20 font-mono text-center focus:outline-none focus:border-[#9BD2FD]"
            />
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-[#EB4D4B] text-white border-3 border-black shadow-[4px_4px_0px_#000000] text-xs font-mono font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>ERROR: {error}</span>
        </div>
      )}

      {/* 2. Pipeline Orkestrasi 5 Agen FIN-CRAG (5 Colored Neobrutalism Blocks) */}
      {result && (
        <div className="space-y-8">
          <div className="bg-[#18181b] rounded-3xl p-6 border-3 border-black shadow-[6px_6px_0px_#000000] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[#C8E087]" />
                <h3 className="font-display text-xl sm:text-2xl uppercase tracking-wide text-white">
                  PIPELINE 5 AGEN SPESIALIS FINANSIAL
                </h3>
              </div>
              <div className="px-3.5 py-1 rounded-full bg-black text-[#C8E087] border border-neutral-700 text-xs font-mono font-bold">
                Total Latensi: {result.totalLatencyMs} ms
              </div>
            </div>

            {/* 5 Blocks Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-1">
              {/* Agen 1: Yellow Block */}
              <div className="bg-[#F8C646] text-black rounded-2xl p-4 border-2 border-black shadow-[4px_4px_0px_#000000] flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between font-mono text-[11px] font-bold">
                    <span>AGEN 01</span>
                    <span>{result.agent1.executionTimeMs} ms</span>
                  </div>
                  <h4 className="font-display text-xl uppercase mt-1 leading-none">DECOMPOSER</h4>
                  <div className="text-[10px] font-mono font-bold uppercase mt-1">
                    Mode: {result.agent1.mode}
                  </div>
                  <div className="text-[10px] font-sans font-semibold mt-1 truncate">
                    {result.agent1.detectedBanks.join(", ") || "Semua Bank"}
                  </div>
                </div>
                <div className="pt-2 text-[9px] font-mono font-bold border-t border-black/20">
                  {result.agent1.expandedTerms.length} kata ekspansi
                </div>
              </div>

              {/* Agen 2: Purple Block */}
              <div className="bg-[#6C5CE7] text-white rounded-2xl p-4 border-2 border-black shadow-[4px_4px_0px_#000000] flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between font-mono text-[11px] font-bold text-white/90">
                    <span>AGEN 02</span>
                    <span>{result.agent2.executionTimeMs} ms</span>
                  </div>
                  <h4 className="font-display text-xl uppercase mt-1 leading-none">RETRIEVER</h4>
                  <div className="text-[10px] font-mono font-bold uppercase mt-1 text-white/90">
                    BM25: {result.agent2.topLexical.length} | LSI: {result.agent2.topLatent.length}
                  </div>
                  <div className="text-[10px] font-sans font-semibold mt-1">
                    Fusi RRF: {result.agent2.topRRF.length} chunks
                  </div>
                </div>
                <div className="pt-2 text-[9px] font-mono font-bold border-t border-white/20 text-white/80">
                  RRF k=60
                </div>
              </div>

              {/* Agen 3: Sky Blue Block */}
              <div className="bg-[#9BD2FD] text-black rounded-2xl p-4 border-2 border-black shadow-[4px_4px_0px_#000000] flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between font-mono text-[11px] font-bold">
                    <span>AGEN 03</span>
                    <span>{result.agent3.executionTimeMs} ms</span>
                  </div>
                  <h4 className="font-display text-xl uppercase mt-1 leading-none">SCORER</h4>
                  <div className="text-[10px] font-mono font-bold uppercase mt-1">
                    Top FinQA: {result.agent3.candidates[0]?.scores.totalScore || 0}
                  </div>
                  <div className="text-[10px] font-sans font-semibold mt-1">
                    {result.agent3.candidates.length} bukti terpilih
                  </div>
                </div>
                <div className="pt-2 text-[9px] font-mono font-bold border-t border-black/20">
                  6-Fitur FinQA
                </div>
              </div>

              {/* Agen 4: Coral Red Block */}
              <div className="bg-[#EB4D4B] text-white rounded-2xl p-4 border-2 border-black shadow-[4px_4px_0px_#000000] flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between font-mono text-[11px] font-bold text-white/90">
                    <span>AGEN 04</span>
                    <span>{result.agent4.executionTimeMs} ms</span>
                  </div>
                  <h4 className="font-display text-xl uppercase mt-1 leading-none">AUDITOR</h4>
                  <div className="text-[10px] font-mono font-bold uppercase mt-1">
                    {result.agent4.status}
                  </div>
                  <div className="text-[10px] font-sans font-semibold mt-1 text-white/90">
                    Keyakinan: {result.agent4.confidenceScore}
                  </div>
                </div>
                <div className="pt-2 text-[9px] font-mono font-bold border-t border-white/20 text-white/80">
                  CRAG Guardrail
                </div>
              </div>

              {/* Agen 5: Lime Green Block */}
              <div className="bg-[#C8E087] text-black rounded-2xl p-4 border-2 border-black shadow-[4px_4px_0px_#000000] flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between font-mono text-[11px] font-bold">
                    <span>AGEN 05</span>
                    <span>{result.agent5.executionTimeMs} ms</span>
                  </div>
                  <h4 className="font-display text-xl uppercase mt-1 leading-none">SYNTHESIZER</h4>
                  <div className="text-[10px] font-mono font-bold uppercase mt-1 truncate">
                    {result.agent5.engineUsed.replace("Financial Synthesizer", "Synthesizer")}
                  </div>
                  <div className="text-[10px] font-sans font-semibold mt-1">
                    {result.agent5.citations.length} badge sitasi
                  </div>
                </div>
                <div className="pt-2 text-[9px] font-mono font-bold border-t border-black/20">
                  Self-RAG Cited
                </div>
              </div>
            </div>
          </div>

          {/* 3. Main Cited Answer Card (Neobrutalism Cream/White Card) */}
          <div className="bg-[#F4F1EA] text-black rounded-3xl p-6 sm:p-8 border-3 border-black shadow-[6px_6px_0px_#000000] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-full bg-[#6C5CE7] text-white flex items-center justify-center font-bold text-sm border-2 border-black">
                  <FileText className="w-4 h-4 text-white" />
                </span>
                <h3 className="font-display text-2xl uppercase tracking-tight text-black">
                  RINGKASAN ANALISIS BERSITASI
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 ${getStatusBadgeColor(result.agent4.status)}`}>
                  {result.agent4.status === "CORRECT" && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {result.agent4.status === "AMBIGUOUS" && <AlertTriangle className="w-3.5 h-3.5" />}
                  {result.agent4.status === "INCORRECT_ABSTAIN" && <ShieldAlert className="w-3.5 h-3.5" />}
                  <span>{result.agent4.statusBadge}</span>
                </span>
                <span className="px-3 py-1 rounded-full bg-black text-white text-xs font-mono font-bold border border-black">
                  {result.agent5.engineUsed}
                </span>
              </div>
            </div>

            {/* Answer Content rendered cleanly via FormattedCitedSummary (Zero raw markdown symbols) */}
            <div className="text-black leading-relaxed font-sans font-medium">
              <FormattedCitedSummary content={result.agent5.citedSummary} />
            </div>

            {/* Citations Badges */}
            {result.agent5.citations.length > 0 && (
              <div className="pt-4 border-t-2 border-black flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono font-bold text-neutral-700 uppercase">Rujukan Sitasi:</span>
                {result.agent5.citations.map((c) => (
                  <span
                    key={c.citationNumber}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border-2 border-black text-black font-mono font-bold shadow-[2px_2px_0px_#000000]"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#F8C646] text-black flex items-center justify-center text-xs">
                      {c.citationNumber}
                    </span>
                    <span>{c.kode_bank} Hal. {c.halaman}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 4. Evidence Cards with 6-Feature Score Breakdown */}
          {result.agent3.candidates.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#9BD2FD]" />
                  <h4 className="font-display text-2xl uppercase tracking-tight text-white">
                    KARTU BUKTI TERVERIFIKASI ({result.agent3.candidates.length})
                  </h4>
                </div>
                <span className="text-xs font-mono font-bold text-[#C8E087]">
                  FinQA (Chen et al., 2021)
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {result.agent3.candidates.map((cand) => {
                  const meta = cand.chunk.metadata;
                  const s = cand.scores;

                  return (
                    <div
                      key={cand.chunk.chunk_id}
                      className="bg-[#18181b] rounded-3xl p-5 sm:p-6 border-3 border-black shadow-[5px_5px_0px_#000000] text-white space-y-4"
                    >
                      {/* Evidence Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="w-8 h-8 rounded-full bg-[#F8C646] text-black font-display text-lg flex items-center justify-center border-2 border-black">
                            {cand.citationId}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-white text-black font-mono font-bold text-xs border-2 border-black">
                            {meta.kode_bank}
                          </span>
                          <span className="font-sans font-bold text-sm text-neutral-200">
                            {meta.nama_bank}
                          </span>
                          <span className="text-xs font-mono text-neutral-400">
                            Hal. {meta.halaman} • Bab: {meta.bab}
                          </span>
                        </div>

                        <div className="px-3 py-1 rounded-full bg-black border border-neutral-700 text-xs font-mono">
                          <span className="text-neutral-400">Skor FinQA: </span>
                          <strong className="text-[#C8E087] font-bold text-sm">
                            {s.totalScore.toFixed(4)}
                          </strong>
                        </div>
                      </div>

                      {/* 6-Feature Score Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-[11px] font-mono bg-neutral-900/90 p-3 rounded-2xl border border-neutral-800">
                        <div>
                          <div className="text-neutral-400">F1 BM25 (25%)</div>
                          <div className="font-bold text-[#F8C646]">{s.f1_bm25.toFixed(4)}</div>
                        </div>
                        <div>
                          <div className="text-neutral-400">F2 LSI (25%)</div>
                          <div className="font-bold text-[#6C5CE7]">{s.f2_lsi.toFixed(4)}</div>
                        </div>
                        <div>
                          <div className="text-neutral-400">F3 RRF (20%)</div>
                          <div className="font-bold text-[#9BD2FD]">{s.f3_rrf.toFixed(4)}</div>
                        </div>
                        <div>
                          <div className="text-neutral-400">F4 Coverage (15%)</div>
                          <div className="font-bold text-[#EB4D4B]">{s.f4_term_coverage.toFixed(4)}</div>
                        </div>
                        <div>
                          <div className="text-neutral-400">F5 Numeric (10%)</div>
                          <div className="font-bold text-[#C8E087]">{s.f5_numeric_density.toFixed(4)}</div>
                        </div>
                        <div>
                          <div className="text-neutral-400">F6 Boost (5%)</div>
                          <div className="font-bold text-white">{s.f6_priority_boost.toFixed(4)}</div>
                        </div>
                      </div>

                      {/* Raw Excerpt */}
                      <div className="bg-black p-4 rounded-2xl border border-neutral-800 text-xs text-neutral-300 font-sans leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto">
                        {cand.chunk.raw_text}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
