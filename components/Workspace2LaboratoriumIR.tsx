"use client";

import React, { useState } from "react";
import { FlaskConical, Search, ArrowRight, Info, AlertCircle } from "lucide-react";
import { IRComparisonResult } from "@/lib/types";
import { NeoDropdown, NeoDropdownOption } from "./NeoDropdown";

export const Workspace2LaboratoriumIR: React.FC = () => {
  const [query, setQuery] = useState("Berapa rasio kecukupan modal CAR dan likuiditas LDR perbankan?");
  const [selectedBank, setSelectedBank] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState<IRComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bankDropdownOptions: NeoDropdownOption[] = [
    { value: "ALL", label: "Semua Emiten (KBMI 4)", badgeBg: "#C8E087" },
    { value: "BBCA", label: "BBCA - BCA", badgeBg: "#F8C646" },
    { value: "BBRI", label: "BBRI - BRI", badgeBg: "#6C5CE7" },
    { value: "BMRI", label: "BMRI - Mandiri", badgeBg: "#9BD2FD" },
    { value: "BBNI", label: "BBNI - BNI", badgeBg: "#EB4D4B" },
  ];

  const sampleQueries = [
    { q: "Berapa rasio kecukupan modal CAR dan likuiditas LDR perbankan?", bank: "ALL" },
    { q: "Laba bersih dan dividen BBCA tahun 2025", bank: "BBCA" },
    { q: "Penyaluran kredit mikro dan UMKM Bank BRI", bank: "BBRI" },
    { q: "Kualitas aset, kredit macet, dan restrukturisasi NPL BMRI", bank: "BMRI" },
  ];

  const handleRunComparison = async (qText?: string, bank?: string) => {
    const q = qText !== undefined ? qText : query;
    const b = bank !== undefined ? bank : selectedBank;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ir-compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, bankFilter: b }),
      });

      if (!res.ok) throw new Error("Gagal mengambil data komparasi IR.");
      const data: IRComparisonResult = await res.json();
      setComparison(data);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Search Header Banner */}
      <div className="bg-[#18181b] rounded-3xl p-6 sm:p-8 border-3 border-black shadow-[6px_6px_0px_#000000] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#6C5CE7] text-white flex items-center justify-center font-bold border-2 border-black">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-3xl sm:text-4xl uppercase tracking-tight text-white leading-none">
                LABORATORIUM IR: KOMPARASI 5 METODE
              </h2>
              <p className="text-xs font-mono text-neutral-400 mt-1">
                Uji langsung evolusi algoritma temu kembali dari Pertemuan M4 hingga M14 secara berdampingan.
              </p>
            </div>
          </div>
        </div>

        {/* Input & Filter Controls */}
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Masukkan kueri pengujian STKI..."
            suppressHydrationWarning
            className="flex-1 bg-white text-black border-3 border-black rounded-2xl px-5 py-3 text-sm font-sans font-bold placeholder-neutral-500 focus:outline-none shadow-[3px_3px_0px_#000000]"
          />

          <NeoDropdown
            value={selectedBank}
            onChange={(val) => setSelectedBank(val)}
            options={bankDropdownOptions}
          />

          <button
            onClick={() => handleRunComparison()}
            disabled={loading}
            className="px-6 py-3 bg-[#F8C646] hover:bg-[#f6bb2b] text-black font-mono font-bold text-xs uppercase tracking-wider rounded-2xl border-3 border-black shadow-[4px_4px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>KOMPARASI 5 METODE</span>
          </button>
        </div>

        {/* Sample Queries */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="font-mono font-bold text-[#F8C646] uppercase text-[11px]">Kueri Sampel:</span>
          {sampleQueries.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(item.q);
                setSelectedBank(item.bank);
                handleRunComparison(item.q, item.bank);
              }}
              className="px-3 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-[11px] font-sans font-semibold border border-neutral-700 transition-colors"
            >
              {item.q.slice(0, 40)}...
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-[#EB4D4B] text-white border-3 border-black shadow-[4px_4px_0px_#000000] text-xs font-mono font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Comparison Grid (5 Columns Styled Like Reference Image Cards) */}
      {comparison && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs font-mono text-neutral-400 px-1">
            <span>
              Kueri Uji: &quot;<strong className="text-white">{comparison.query}</strong>&quot;
            </span>
            <span className="px-3 py-1 rounded-full bg-black border border-neutral-700 text-[#C8E087] font-bold">
              Waktu Eksekusi: {comparison.executionTimeMs} ms
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-stretch">
            {/* Column 1: TF-IDF (Yellow Header) */}
            <div className="bg-[#18181b] rounded-3xl border-3 border-black shadow-[5px_5px_0px_#000000] overflow-hidden flex flex-col">
              <div className="bg-[#F8C646] text-black p-4 border-b-3 border-black">
                <div className="flex items-center justify-between font-mono text-[10px] font-bold">
                  <span>METODE 01</span>
                  <span className="px-2 py-0.5 rounded-full bg-black text-white">M4 RPS</span>
                </div>
                <h3 className="font-display text-2xl uppercase mt-1 leading-none">TF-IDF VSM</h3>
                <div className="text-[10px] font-mono font-bold mt-1 opacity-90">Cosine Similarity</div>
              </div>

              <div className="p-3.5 space-y-2.5 flex-1">
                {comparison.tfidf.map((item) => (
                  <div key={item.chunk.chunk_id} className="p-3 rounded-2xl bg-black border-2 border-neutral-800 text-[11px] space-y-1">
                    <div className="flex items-center justify-between font-mono">
                      <span className="w-5 h-5 rounded-full bg-[#F8C646] text-black font-bold flex items-center justify-center text-[10px]">
                        {item.rank}
                      </span>
                      <span className="text-[10px] text-neutral-400">{item.chunk.metadata.kode_bank} • Hal {item.chunk.metadata.halaman}</span>
                      <span className="text-[#F8C646] font-bold">{item.score}</span>
                    </div>
                    <p className="text-neutral-400 text-[10px] line-clamp-2">{item.chunk.raw_text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: BM25 (Purple Header) */}
            <div className="bg-[#18181b] rounded-3xl border-3 border-black shadow-[5px_5px_0px_#000000] overflow-hidden flex flex-col">
              <div className="bg-[#6C5CE7] text-white p-4 border-b-3 border-black">
                <div className="flex items-center justify-between font-mono text-[10px] font-bold text-white/90">
                  <span>METODE 02</span>
                  <span className="px-2 py-0.5 rounded-full bg-black text-white">M5 RPS</span>
                </div>
                <h3 className="font-display text-2xl uppercase mt-1 leading-none">OKAPI BM25</h3>
                <div className="text-[10px] font-mono font-bold mt-1 text-white/90">Probabilistic Lexical</div>
              </div>

              <div className="p-3.5 space-y-2.5 flex-1">
                {comparison.bm25.map((item) => (
                  <div key={item.chunk.chunk_id} className="p-3 rounded-2xl bg-black border-2 border-neutral-800 text-[11px] space-y-1">
                    <div className="flex items-center justify-between font-mono">
                      <span className="w-5 h-5 rounded-full bg-[#6C5CE7] text-white font-bold flex items-center justify-center text-[10px]">
                        {item.rank}
                      </span>
                      <span className="text-[10px] text-neutral-400">{item.chunk.metadata.kode_bank} • Hal {item.chunk.metadata.halaman}</span>
                      <span className="text-[#6C5CE7] font-bold">{item.score}</span>
                    </div>
                    <p className="text-neutral-400 text-[10px] line-clamp-2">{item.chunk.raw_text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: LSI / SVD (Sky Blue Header) */}
            <div className="bg-[#18181b] rounded-3xl border-3 border-black shadow-[5px_5px_0px_#000000] overflow-hidden flex flex-col">
              <div className="bg-[#9BD2FD] text-black p-4 border-b-3 border-black">
                <div className="flex items-center justify-between font-mono text-[10px] font-bold">
                  <span>METODE 03</span>
                  <span className="px-2 py-0.5 rounded-full bg-black text-white">M6 RPS</span>
                </div>
                <h3 className="font-display text-2xl uppercase mt-1 leading-none">LSI / SVD</h3>
                <div className="text-[10px] font-mono font-bold mt-1 opacity-90">Latent Semantic Space</div>
              </div>

              <div className="p-3.5 space-y-2.5 flex-1">
                {comparison.lsi.map((item) => (
                  <div key={item.chunk.chunk_id} className="p-3 rounded-2xl bg-black border-2 border-neutral-800 text-[11px] space-y-1">
                    <div className="flex items-center justify-between font-mono">
                      <span className="w-5 h-5 rounded-full bg-[#9BD2FD] text-black font-bold flex items-center justify-center text-[10px]">
                        {item.rank}
                      </span>
                      <span className="text-[10px] text-neutral-400">{item.chunk.metadata.kode_bank} • Hal {item.chunk.metadata.halaman}</span>
                      <span className="text-[#9BD2FD] font-bold">{item.score}</span>
                    </div>
                    <p className="text-neutral-400 text-[10px] line-clamp-2">{item.chunk.raw_text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 4: Hybrid RRF (Coral Red Header) */}
            <div className="bg-[#18181b] rounded-3xl border-3 border-black shadow-[5px_5px_0px_#000000] overflow-hidden flex flex-col">
              <div className="bg-[#EB4D4B] text-white p-4 border-b-3 border-black">
                <div className="flex items-center justify-between font-mono text-[10px] font-bold text-white/90">
                  <span>METODE 04</span>
                  <span className="px-2 py-0.5 rounded-full bg-black text-white">M14 RPS</span>
                </div>
                <h3 className="font-display text-2xl uppercase mt-1 leading-none">HYBRID RRF</h3>
                <div className="text-[10px] font-mono font-bold mt-1 text-white/90">Reciprocal Rank k=60</div>
              </div>

              <div className="p-3.5 space-y-2.5 flex-1">
                {comparison.rrf.map((item) => (
                  <div key={item.chunk.chunk_id} className="p-3 rounded-2xl bg-black border-2 border-neutral-800 text-[11px] space-y-1">
                    <div className="flex items-center justify-between font-mono">
                      <span className="w-5 h-5 rounded-full bg-[#EB4D4B] text-white font-bold flex items-center justify-center text-[10px]">
                        {item.rank}
                      </span>
                      <span className="text-[10px] text-neutral-400">{item.chunk.metadata.kode_bank} • Hal {item.chunk.metadata.halaman}</span>
                      <span className="text-[#EB4D4B] font-bold">{item.score}</span>
                    </div>
                    <p className="text-neutral-400 text-[10px] line-clamp-2">{item.chunk.raw_text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 5: FinQA Reranker (Lime Green Header) */}
            <div className="bg-[#18181b] rounded-3xl border-3 border-black shadow-[5px_5px_0px_#000000] overflow-hidden flex flex-col">
              <div className="bg-[#C8E087] text-black p-4 border-b-3 border-black">
                <div className="flex items-center justify-between font-mono text-[10px] font-bold">
                  <span>METODE 05</span>
                  <span className="px-2 py-0.5 rounded-full bg-black text-[#C8E087]">M14 PRO</span>
                </div>
                <h3 className="font-display text-2xl uppercase mt-1 leading-none">FINQA RERANK</h3>
                <div className="text-[10px] font-mono font-bold mt-1 opacity-90">6-Fitur Keuangan</div>
              </div>

              <div className="p-3.5 space-y-2.5 flex-1">
                {comparison.reranker.map((item) => (
                  <div key={item.chunk.chunk_id} className="p-3 rounded-2xl bg-black border-2 border-neutral-800 text-[11px] space-y-1">
                    <div className="flex items-center justify-between font-mono">
                      <span className="w-5 h-5 rounded-full bg-[#C8E087] text-black font-bold flex items-center justify-center text-[10px]">
                        {item.rank}
                      </span>
                      <span className="text-[10px] text-neutral-200 font-bold">{item.chunk.metadata.kode_bank} • Hal {item.chunk.metadata.halaman}</span>
                      <span className="text-[#C8E087] font-bold">{item.score.toFixed(4)}</span>
                    </div>
                    <p className="text-neutral-300 text-[10px] line-clamp-2">{item.chunk.raw_text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Educational Note */}
          <div className="bg-[#F4F1EA] text-black p-5 rounded-3xl border-3 border-black shadow-[4px_4px_0px_#000000] text-xs font-sans flex items-start gap-3">
            <Info className="w-5 h-5 text-[#6C5CE7] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="font-display text-base uppercase">Wawasan Evaluasi STKI:</strong>
              <p className="leading-relaxed font-medium">
                Perhatikan bagaimana peringkat dokumen berevolusi. TF-IDF dan BM25 berfokus pada repetisi kata leksikal. LSI menangkap konsep makna laten perbankan. Fusi RRF menggabungkan keduanya. Terakhir, <strong>FinQA Reranker</strong> memprioritaskan dokumen yang memuat bukti angka dan rasio akuntansi resmi perbankan BEI.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
