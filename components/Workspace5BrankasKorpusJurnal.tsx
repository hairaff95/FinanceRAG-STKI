"use client";

import React, { useState, useEffect } from "react";
import {
  Database,
  BookOpen,
  GraduationCap,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  FileText,
  Copy,
  Check,
  X,
} from "lucide-react";
import { ChunkItem } from "@/lib/types";
import { NeoDropdown, NeoDropdownOption } from "./NeoDropdown";

export const Workspace5BrankasKorpusJurnal: React.FC = () => {
  const [subTab, setSubTab] = useState<"corpus" | "journals" | "rps">("corpus");

  // State Korpus
  const [chunks, setChunks] = useState<ChunkItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalChunks, setTotalChunks] = useState(3022);
  const [bankFilter, setBankFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [bankStats, setBankStats] = useState<{ [bank: string]: number }>({
    BBCA: 832,
    BBNI: 789,
    BBRI: 754,
    BMRI: 647,
  });

  // State Expand & Modal Detail Chunk
  const [expandedChunks, setExpandedChunks] = useState<{ [id: string]: boolean }>({});
  const [selectedChunk, setSelectedChunk] = useState<ChunkItem | null>(null);
  const [copied, setCopied] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedChunks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getBankBadge = (kode: string) => {
    switch (kode) {
      case "BBCA":
        return "bg-[#F8C646] text-black";
      case "BBNI":
        return "bg-[#EB4D4B] text-white";
      case "BBRI":
        return "bg-[#6C5CE7] text-white";
      case "BMRI":
        return "bg-[#9BD2FD] text-black";
      default:
        return "bg-[#C8E087] text-black";
    }
  };

  const fetchChunks = async (p: number, bank: string, search: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/corpus?page=${p}&limit=12&bank=${bank !== "ALL" ? bank : ""}&search=${encodeURIComponent(
          search
        )}`
      );
      if (res.ok) {
        const data = await res.json();
        setChunks(data.chunks);
        setPage(data.page);
        setTotalPages(data.totalPages);
        setTotalChunks(data.total);
        if (data.bankStats) setBankStats(data.bankStats);
      }
    } catch (err) {
      console.error("Gagal memuat korpus:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChunks(page, bankFilter, searchQuery);
  }, [page, bankFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchChunks(1, bankFilter, searchQuery);
  };

  const journals = [
    {
      no: 1,
      peneliti: "Setty et al. (2024)",
      judul: "Improving Retrieval for RAG based Question Answering Models on Financial Documents",
      penerbit: "arXiv Financial NLP",
      url: "https://arxiv.org/pdf/2404.07221",
      implementasi:
        "Teknik pemotongan PDF laporan bank (chunking) dengan penyisipan Metadata Header ([Emiten | Tahun | Bab | Hal]) pada Agen 1.",
    },
    {
      no: 2,
      peneliti: "Chen et al. (2021)",
      judul: "FinQA: A Dataset of Numerical Reasoning over Financial Data",
      penerbit: "Proceedings of EMNLP 2021",
      url: "https://aclanthology.org/2021.emnlp-main.296.pdf",
      implementasi:
        "Desain fitur Financial Numeric & Ratio Density pada Agen 3 (Financial Evidence Scorer) untuk memprioritaskan potongan teks berisi rasio %, bps, triliun, dan miliar.",
    },
    {
      no: 3,
      peneliti: "Yan et al. (2024)",
      judul: "Corrective Retrieval Augmented Generation (CRAG)",
      penerbit: "arXiv / ICLR 2024",
      url: "https://arxiv.org/pdf/2401.15884",
      implementasi:
        "Desain Agen 4 (CRAG Auditor & Guardrail) yang menilai kelayakan bukti (Correct / Ambiguous / Incorrect) dan mengeksekusi Abstention jika di luar domain.",
    },
    {
      no: 4,
      peneliti: "Asai et al. (2024)",
      judul: "Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection",
      penerbit: "ICLR 2024",
      url: "https://arxiv.org/pdf/2310.11511",
      implementasi:
        "Desain Agen 5 (Cited Financial Synthesizer) dan fitur deteksi kontradiksi klaim angka keuangan antar-dokumen.",
    },
    {
      no: 5,
      peneliti: "Robertson & Zaragoza (2009)",
      judul: "The Probabilistic Relevance Framework: BM25 and Beyond",
      penerbit: "Foundations and Trends in IR",
      url: "https://www.staff.city.ac.uk/~sbrp622/papers/foundations_bm25_review.pdf",
      implementasi:
        "Rumus matematika Okapi BM25 pada pencarian leksikal untuk menangkap kode ticker saham dan singkatan rasio perbankan.",
    },
    {
      no: 6,
      peneliti: "Cormack, Clarke, & Buettcher (2009)",
      judul: "Reciprocal Rank Fusion Outperforms Condorcet and Individual Rank Learning Methods",
      penerbit: "ACM SIGIR 2009",
      url: "https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf",
      implementasi:
        "Rumus Hybrid RRF (k=60) pada Agen 2 untuk menggabungkan peringkat leksikal (BM25) dan semantik ruang laten (LSI/SVD).",
    },
    {
      no: 7,
      peneliti: "Deerwester et al. (1990)",
      judul: "Indexing by Latent Semantic Analysis",
      penerbit: "JASIS",
      url: "https://scholar.google.com/scholar?q=Indexing+by+Latent+Semantic+Analysis+Deerwester",
      implementasi:
        "Landasan reduksi dimensi matriks TF-IDF + Truncated SVD (LSI) untuk menangkap kemiripan makna konsep perbankan tanpa API embedding eksternal.",
    },
  ];

  const rpsData = [
    {
      minggu: "M1 – M3",
      topik: "Text Preprocessing, Tokenisasi, & Inverted Index",
      implementasi:
        "Pembersihan teks laporan tahunan, tokenisasi numerik-keuangan, chunking (1.000 karakter, overlap 200), dan pembangunan Inverted Index cepat.",
    },
    {
      minggu: "M4",
      topik: "Vector Space Model (VSM) & Pembobotan TF-IDF",
      implementasi:
        "Perhitungan bobot Term Frequency–Inverse Document Frequency dan kemiripan sudut Cosine Similarity pada ruang vektor.",
    },
    {
      minggu: "M5",
      topik: "Probabilistic Retrieval & Okapi BM25",
      implementasi:
        "Pencarian kata kunci dengan normalisasi panjang dokumen (k1=1.5, b=0.75) untuk kode emiten dan singkatan rasio.",
    },
    {
      minggu: "M6",
      topik: "Latent Semantic Indexing (LSI / Truncated SVD)",
      implementasi:
        "Dekomposisi nilai singular untuk memetakan kueri dan chunk laporan bank ke ruang konsep perbankan laten tanpa API luar.",
    },
    {
      minggu: "M8",
      topik: "Evaluasi Sistem Temu Kembali Informasi (IR Metrics)",
      implementasi:
        "Pengujian otomatis metrik Precision@5, Recall@5, MAP, MRR, NDCG@5, serta Akurasi Abstention terhadap Ground Truth.",
    },
    {
      minggu: "M9 – M11",
      topik: "Query Expansion & Relevance Reformulation",
      implementasi:
        "Ekspansi kueri otomatis pada Agen 1 menggunakan kamus sinonim perbankan (CASA, NPL, CAR, BOPO, LDR, Laba).",
    },
    {
      minggu: "M12 – M14",
      topik: "Hybrid IR, Learning-to-Rank, & Corrective RAG",
      implementasi:
        "Fusi peringkat RRF (k=60), Financial Reranker 6-fitur FinQA, sintesis bersitasi halaman PDF asli, dan simulasi audit 4 skenario CRAG.",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Sub Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-neutral-800 pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSubTab("corpus")}
            className={`px-4 py-2 rounded-full text-xs font-mono font-bold uppercase tracking-wider border-2 border-black transition-all ${
              subTab === "corpus"
                ? "bg-[#F8C646] text-black shadow-[3px_3px_0px_#000000]"
                : "bg-white text-black hover:bg-neutral-100"
            }`}
          >
            KORPUS SUPABASE (3.022 CHUNKS)
          </button>

          <button
            onClick={() => setSubTab("journals")}
            className={`px-4 py-2 rounded-full text-xs font-mono font-bold uppercase tracking-wider border-2 border-black transition-all ${
              subTab === "journals"
                ? "bg-[#6C5CE7] text-white shadow-[3px_3px_0px_#000000]"
                : "bg-white text-black hover:bg-neutral-100"
            }`}
          >
            7 JURNAL OPEN ACCESS
          </button>

          <button
            onClick={() => setSubTab("rps")}
            className={`px-4 py-2 rounded-full text-xs font-mono font-bold uppercase tracking-wider border-2 border-black transition-all ${
              subTab === "rps"
                ? "bg-[#C8E087] text-black shadow-[3px_3px_0px_#000000]"
                : "bg-white text-black hover:bg-neutral-100"
            }`}
          >
            PEMETAAN RPS M1–M14
          </button>
        </div>

        <div className="px-3.5 py-1 rounded-full bg-black border border-neutral-700 text-[#C8E087] text-xs font-mono font-bold">
          SUPABASE: SYNCHRONIZED
        </div>
      </div>

      {/* SUB-TAB 1: KORPUS SUPABASE EXPLORER */}
      {subTab === "corpus" && (
        <div className="space-y-6">
          {/* 4 Bank Stat Blocks (Exact Style from Reference Image) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                code: "BBCA",
                name: "Bank Central Asia",
                count: bankStats.BBCA || 832,
                bg: "bg-[#F8C646] text-black",
              },
              {
                code: "BBNI",
                name: "Bank Negara Indonesia",
                count: bankStats.BBNI || 789,
                bg: "bg-[#EB4D4B] text-white",
              },
              {
                code: "BBRI",
                name: "Bank Rakyat Indonesia",
                count: bankStats.BBRI || 754,
                bg: "bg-[#6C5CE7] text-white",
              },
              {
                code: "BMRI",
                name: "Bank Mandiri",
                count: bankStats.BMRI || 647,
                bg: "bg-[#9BD2FD] text-black",
              },
            ].map((b) => (
              <div
                key={b.code}
                onClick={() => {
                  setBankFilter(b.code);
                  setPage(1);
                }}
                className={`group ${b.bg} rounded-3xl p-5 border-3 border-black shadow-[5px_5px_0px_#000000] flex flex-col justify-between cursor-pointer hover:-translate-y-1 hover:shadow-[7px_7px_0px_#000000] active:translate-y-0.5 active:shadow-[2px_2px_0px_#000000] transition-all ${
                  bankFilter === b.code ? "ring-4 ring-white" : ""
                }`}
              >
                <div>
                  <h3 className="font-display text-4xl uppercase leading-none">{b.code}</h3>
                  <div className="text-[10px] font-mono font-bold uppercase mt-1 tracking-wider opacity-90">
                    {b.count} CHUNKS TERINDEX
                  </div>
                  <div className="text-xs font-sans font-semibold mt-1 opacity-80">{b.name}</div>
                </div>

                <div className="pt-6 flex justify-end">
                  <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-base border-2 border-black shadow-[2px_2px_0px_#000000] group-hover:translate-x-1 transition-transform">
                    →
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Search Bar */}
          <div className="bg-[#18181b] p-4 rounded-3xl border-3 border-black shadow-[4px_4px_0px_#000000] flex flex-col sm:flex-row items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari teks potongan dokumen, rasio, atau nama bab..."
                className="bg-white border-2 border-black rounded-2xl px-4 py-2.5 text-xs text-black font-sans font-bold flex-1 focus:outline-none placeholder-neutral-500 shadow-[2px_2px_0px_#000000]"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#C8E087] text-black font-mono font-bold text-xs uppercase rounded-2xl border-2 border-black hover:bg-[#b8dd67] transition-all shadow-[2px_2px_0px_#000000]"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            <div className="w-full sm:w-auto">
              <NeoDropdown
                value={bankFilter}
                onChange={(val) => {
                  setBankFilter(val);
                  setPage(1);
                }}
                options={[
                  { value: "ALL", label: `Semua (${totalChunks})`, badgeBg: "#C8E087" },
                  { value: "BBCA", label: `BBCA (${bankStats.BBCA || 832})`, badgeBg: "#F8C646" },
                  { value: "BBNI", label: `BBNI (${bankStats.BBNI || 789})`, badgeBg: "#EB4D4B" },
                  { value: "BBRI", label: `BBRI (${bankStats.BBRI || 754})`, badgeBg: "#6C5CE7" },
                  { value: "BMRI", label: `BMRI (${bankStats.BMRI || 647})`, badgeBg: "#9BD2FD" },
                ]}
              />
            </div>
          </div>

          {/* Chunks Cards Grid - Retain mounted grid during pagination to eliminate flicker */}
          {chunks.length === 0 && loading ? (
            <div className="p-16 text-center text-xs font-mono text-neutral-400 bg-[#18181b] rounded-3xl border-3 border-black shadow-[4px_4px_0px_#000000] min-h-[420px] flex flex-col items-center justify-center space-y-3">
              <span className="w-8 h-8 border-3 border-[#F8C646] border-t-transparent rounded-full animate-spin inline-block"></span>
              <div className="text-white font-bold text-sm">Memuat korpus dari Supabase...</div>
              <div className="text-neutral-500 text-[11px]">Mengambil 3.022 data potongan dokumen resmi BEI</div>
            </div>
          ) : (
            <div className="relative min-h-[500px]">
              {/* Subtle non-intrusive refresh indicator */}
              {loading && (
                <div className="absolute top-2 right-2 z-10 px-3 py-1 bg-black/80 backdrop-blur text-[#F8C646] text-[10px] font-mono font-bold rounded-full border border-[#F8C646]/40 flex items-center gap-1.5 shadow-md">
                  <span className="w-2.5 h-2.5 border-2 border-[#F8C646] border-t-transparent rounded-full animate-spin" />
                  <span>MEMPERBARUI...</span>
                </div>
              )}

              <div
                className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity duration-150 ${
                  loading ? "opacity-60 pointer-events-none" : "opacity-100"
                }`}
              >
                {chunks.map((c) => {
                  const isExpanded = !!expandedChunks[c.chunk_id];
                  return (
                    <div
                      key={c.chunk_id}
                      className="bg-[#18181b] p-5 rounded-3xl border-3 border-black shadow-[4px_4px_0px_#000000] text-xs space-y-3 flex flex-col justify-between transition-all"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between font-mono text-[10px]">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold border border-black ${getBankBadge(
                              c.metadata.kode_bank
                            )}`}
                          >
                            {c.metadata.kode_bank}
                          </span>
                          <span className="text-neutral-400 font-semibold">Hal. {c.metadata.halaman}</span>
                          <span className="text-neutral-500 truncate max-w-[120px]" title={c.chunk_id}>
                            {c.chunk_id}
                          </span>
                        </div>

                        <div
                          className="font-display text-lg uppercase text-white tracking-wide line-clamp-1"
                          title={c.metadata.bab}
                        >
                          {c.metadata.bab}
                        </div>

                        {/* Kotak Teks Korpus: Scrollable & Bebas Slicing/Potongan Awkward */}
                        <div
                          className={`text-neutral-300 text-[11px] leading-relaxed font-sans bg-black p-3.5 rounded-2xl border border-neutral-800 whitespace-pre-line select-text transition-all ${
                            isExpanded ? "max-h-none h-auto" : "h-40 overflow-y-auto"
                          }`}
                        >
                          {c.raw_text}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-2 border-t border-neutral-800">
                        <span className="truncate max-w-[130px] text-neutral-500" title={c.metadata.sumber_file}>
                          {c.metadata.sumber_file}
                        </span>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleExpand(c.chunk_id)}
                            className="px-2.5 py-1 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 hover:border-neutral-500 transition-colors flex items-center gap-1 font-bold text-[10px]"
                            title={isExpanded ? "Ringkas tampilan box" : "Perluas tampilan box di kartu"}
                          >
                            {isExpanded ? (
                              <>
                                <Minimize2 className="w-2.5 h-2.5 text-[#F8C646]" />
                                <span>Ringkas</span>
                              </>
                            ) : (
                              <>
                                <Maximize2 className="w-2.5 h-2.5 text-[#C8E087]" />
                                <span>Perluas</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedChunk(c)}
                            className="p-1 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 hover:border-neutral-500 transition-colors"
                            title="Buka Modal Detail Dokumen Lengkap"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#9BD2FD]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between border-t-2 border-neutral-800 pt-4 text-xs font-mono">
            <span className="text-neutral-400">
              Halaman <strong className="text-white">{page}</strong> dari <strong className="text-white">{totalPages}</strong> ({totalChunks} Chunks)
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="px-4 py-2 rounded-full bg-white text-black border-2 border-black font-bold disabled:opacity-40 hover:bg-neutral-100 shadow-[2px_2px_0px_#000000] flex items-center gap-1 transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Sebelumnya
              </button>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="px-4 py-2 rounded-full bg-white text-black border-2 border-black font-bold disabled:opacity-40 hover:bg-neutral-100 shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 transition-all"
              >
                <span>Selanjutnya</span>
                {loading ? (
                  <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: KATALOG 7 JURNAL OPEN ACCESS */}
      {subTab === "journals" && (
        <div className="space-y-6">
          <div className="bg-[#F4F1EA] text-black p-5 rounded-3xl border-3 border-black shadow-[4px_4px_0px_#000000] text-xs font-sans font-medium">
            Seluruh arsitektur dan algoritma FIN-CRAG dibangun berdasarkan <strong>7 publikasi ilmiah bereputasi internasional</strong> yang dapat diakses secara gratis (*Open Access*):
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {journals.map((j) => (
              <div
                key={j.no}
                className="bg-[#18181b] p-6 rounded-3xl border-3 border-black shadow-[5px_5px_0px_#000000] space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-[#F8C646] text-black font-mono font-bold text-xs border border-black">
                      RUJUKAN #{j.no}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">{j.penerbit}</span>
                  </div>

                  <h3 className="font-display text-xl uppercase tracking-tight text-white leading-tight">
                    {j.judul}
                  </h3>
                  <div className="text-xs font-mono text-neutral-400">Peneliti: {j.peneliti}</div>

                  <div className="p-4 bg-black rounded-2xl border border-neutral-800 text-xs text-neutral-300 space-y-1">
                    <strong className="text-[10px] font-mono text-[#C8E087] uppercase tracking-wide">
                      Implementasi Teknis di FIN-CRAG:
                    </strong>
                    <p className="text-[11px] leading-relaxed">{j.implementasi}</p>
                  </div>
                </div>

                <a
                  href={j.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black font-mono font-bold text-xs border-2 border-black hover:bg-[#F8C646] shadow-[2px_2px_0px_#000000] self-start transition-all"
                >
                  <span>Buka PDF Open Access</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: PEMETAAN RPS STKI M1-M14 */}
      {subTab === "rps" && (
        <div className="bg-[#18181b] rounded-3xl p-6 sm:p-8 border-3 border-black shadow-[6px_6px_0px_#000000] space-y-5">
          <div>
            <h3 className="font-display text-3xl uppercase tracking-tight text-white flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-[#C8E087]" />
              PEMETAAN CAPAIAN PEMBELAJARAN RPS STKI (M1–M14)
            </h3>
            <p className="text-xs font-mono text-neutral-400 mt-1">
              Kesesuaian kurikulum dan implementasi teknis pada FIN-CRAG untuk mata kuliah Sistem Temu Kembali Informasi S1 Teknik Informatika UDINUS 2026.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border-2 border-black">
            <table className="w-full text-left text-xs font-mono border-collapse bg-black text-neutral-200">
              <thead>
                <tr className="bg-[#C8E087] text-black border-b-2 border-black">
                  <th className="py-3 px-4 font-display text-sm uppercase w-32">Minggu RPS</th>
                  <th className="py-3 px-4 font-display text-sm uppercase w-72">Topik Perkuliahan</th>
                  <th className="py-3 px-4 font-display text-sm uppercase">Implementasi Nyata pada FIN-CRAG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {rpsData.map((row) => (
                  <tr key={row.minggu} className="hover:bg-neutral-900 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#F8C646] text-sm">{row.minggu}</td>
                    <td className="py-3.5 px-4 font-bold text-white text-xs">{row.topik}</td>
                    <td className="py-3.5 px-4 text-neutral-300 font-sans text-xs leading-relaxed">
                      {row.implementasi}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DETAIL CHUNK KORPUS LENGKAP */}
      {selectedChunk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#18181b] border-3 border-black rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-[8px_8px_0px_#000000] space-y-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b-2 border-neutral-800 pb-4">
              <div>
                <div className="flex items-center gap-2 font-mono text-xs mb-1.5 flex-wrap">
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold border border-black ${getBankBadge(
                      selectedChunk.metadata.kode_bank
                    )}`}
                  >
                    {selectedChunk.metadata.kode_bank}
                  </span>
                  <span className="text-white font-bold">{selectedChunk.metadata.nama_bank}</span>
                  <span className="text-neutral-400 font-semibold">· Hal. {selectedChunk.metadata.halaman}</span>
                  <span className="text-neutral-500 text-[10px]">({selectedChunk.metadata.tahun})</span>
                </div>
                <h3 className="font-display text-2xl uppercase tracking-wide text-white">
                  {selectedChunk.metadata.bab}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedChunk(null)}
                className="w-8 h-8 rounded-full bg-white text-black font-bold flex items-center justify-center border-2 border-black hover:bg-[#EB4D4B] hover:text-white transition-colors shadow-[2px_2px_0px_#000000] shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Full Chunk Content */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span>
                  Chunk ID: <strong className="text-white font-mono">{selectedChunk.chunk_id}</strong>
                </span>
                <span>
                  Sumber: <strong className="text-white font-mono">{selectedChunk.metadata.sumber_file}</strong>
                </span>
              </div>

              <div className="bg-black p-4 sm:p-5 rounded-2xl border border-neutral-800 text-xs sm:text-sm text-neutral-200 font-sans leading-relaxed whitespace-pre-line select-text max-h-[50vh] overflow-y-auto">
                {selectedChunk.raw_text}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => handleCopyText(selectedChunk.raw_text)}
                className="px-4 py-2 rounded-full bg-[#C8E087] text-black font-mono font-bold text-xs border-2 border-black hover:bg-[#b5d56b] transition-all shadow-[2px_2px_0px_#000000] flex items-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-black" />
                    <span>Tersalin ke Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-black" />
                    <span>Salin Teks Chunk</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSelectedChunk(null)}
                className="px-4 py-2 rounded-full bg-white text-black font-mono font-bold text-xs border-2 border-black hover:bg-neutral-100 transition-all shadow-[2px_2px_0px_#000000]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
