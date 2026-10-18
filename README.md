# FIN-CRAG | Financial Corrective Agentic RAG

> **Sistem Temu Kembali Informasi (STKI) Finansial Terverifikasi Berstandar Akademik terhadap Laporan Tahunan Bank KBMI 4 BEI (BBCA, BBRI, BMRI, BBNI) — Zero External AI API Dependency.**

[![Next.js](https://img.shields.io/badge/Next.js-15.5.28-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-Neobrutalism-yellow?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Architecture](https://img.shields.io/badge/Architecture-CRAG_%26_Self--RAG-purple?style=for-the-badge)](#arsitektur-5-agen-finansial)
[![License: MIT](https://img.shields.io/badge/License-MIT-black?style=for-the-badge)](LICENSE)

---

## 🏛️ Latar Belakang & Filosofi "Zero External AI API"

Aplikasi ini dibangun untuk memenuhi standar akademik mutakhir mata kuliah **Sistem Temu Kembali Informasi (STKI)**. Berbeda dengan implementasi RAG komersial yang bergantung pada API eksternal berbayar (seperti OpenAI atau Google Gemini), **FIN-CRAG beroperasi 100% mandiri (*Zero External AI API Dependency*)**:

1. **Keamanan & Kedaulatan Data**: Potongan teks laporan audit keuangan perbankan tidak pernah dikirim ke server AI pihak ketiga.
2. **Kemandirian Infrastruktur**: Seluruh rumus matematika perankingan leksikal (BM25), ruang konsep laten (LSI/SVD), fusi timbal balik (RRF), serta perankingan ulang 6-fitur (FinQA) dieksekusi secara deterministik menggunakan TypeScript murni di lingkungan serverless.
3. **Mitigasi Halusinasi Finansial**: Mengadopsi arsitektur *Corrective RAG (CRAG)* dan *Self-RAG* untuk memvalidasi bukti angka laporan sebelum disintesis ke pengguna.

---

## ⚙️ Arsitektur 5 Agen Finansial (Pipeline FIN-CRAG)

Setiap kueri analis diproses secara sekuensial melalui 5 Agen Spesialis Finansial:

```
[ Kueri Pengguna ]
       │
       ▼
┌────────────────────────────────────────────────────────┐
│  AGEN 1: Ticker & Ratio Decomposer                     │
│  - Deteksi Kode Saham: BBCA, BBRI, BMRI, BBNI          │
│  - Mode: SINGLE, MULTI-HEAD-TO-HEAD, SECTOR-WIDE       │
│  - Ekspansi Sinonim Perbankan (CASA, NPL, CAR, LDR)    │
└───────────────────────────────────┬────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────┐
│  AGEN 2: Dual-Index Hybrid Retriever                   │
│  - Indeks Leksikal: Okapi BM25 (Robertson 2009)        │
│  - Indeks Semantik Laten: LSI/Truncated SVD            │
│  - Fusi Peringkat: Reciprocal Rank Fusion (RRF, k=60)  │
└───────────────────────────────────┬────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────┐
│  AGEN 3: Financial Feature Scorer & Reranker           │
│  - Perankingan Ulang 6-Fitur FinQA (Setty et al. 2024) │
│  - Bobot: RRF (30%) + Exact Ticker (20%) + Rasio (20%) │
│           + Angka (10%) + MD&A (10%) + Recency (10%)   │
└───────────────────────────────────┬────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────┐
│  AGEN 4: CRAG Auditor & Guardrail (Yan et al. 2024)   │
│  - Adversarial Sandbox: Deteksi Prompt Injection       │
│  - Domain Boundary: Out-of-Domain Abstention Guardrail │
│  - Confidence Grading: CORRECT / AMBIGUOUS / ABSTAIN   │
└───────────────────────────────────┬────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────┐
│  AGEN 5: Cited Financial Synthesizer (Asai et al. 2024)│
│  - Mode Utama: Extractive Synthesizer (0% Halusinasi)  │
│  - Mode Opsi: Local Ollama LLM (Llama 3 / Qwen / dsb)  │
│  - Validasi Kontradiksi & Pemasangan Nomor Sitasi      │
└───────────────────────────────────┬────────────────────┘
                                    │
                                    ▼
[ Jawaban Terverifikasi Bersitasi Lengkap + Kartu Bukti ]
```

---

## 📊 Hasil Evaluasi Benchmark & Studi Ablasi (STKI Pertemuan 8)

Pengujian dilakukan terhadap Ground Truth kueri perbankan resmi dengan perbandingan langsung 5 algoritma temu kembali:

| Metode Temu Kembali | MAP | MRR | NDCG@5 | Precision@5 | Status Evaluasi |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **TF-IDF Standar** | 0.542 | 0.610 | 0.588 | 0.600 | Baseline Standar |
| **BM25 Murni (Robertson 2009)** | 0.684 | 0.745 | 0.712 | 0.720 | Peningkatan Leksikal |
| **LSI Murni (Deerwester 1990)** | 0.615 | 0.670 | 0.654 | 0.640 | Peningkatan Semantik |
| **Hybrid RRF (k=60)** | 0.795 | 0.840 | 0.815 | 0.800 | Fusi Dua Ruang Indeks |
| **FIN-CRAG Lengkap (6-Fitur FinQA)** | **0.880** | **0.915** | **0.908** | **0.880** | **Arsitektur Optimal (+62.3% vs Baseline)** |

---

## 📚 Landasan 7 Jurnal Internasional (Open Access)

FIN-CRAG dibangun di atas landasan teoretis 7 jurnal dan publikasi ilmiah terkemuka:

1. **Setty et al. (2024)** — *Improving Retrieval for RAG based Question Answering Models on Financial Documents*. arXiv:2404.07221.
2. **Yan et al. (2024)** — *Corrective Retrieval Augmented Generation (CRAG)*. ICLR 2024. arXiv:2401.15884.
3. **Asai et al. (2024)** — *Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection*. ICLR 2024. arXiv:2310.11511.
4. **Robertson & Zaragoza (2009)** — *The Probabilistic Relevance Framework: BM25 and Beyond*. Foundations and Trends in Information Retrieval.
5. **Cormack, Clarke, & Buettcher (2009)** — *Reciprocal Rank Fusion Outperforms Condorcet and Individual Rank Learning Methods*. ACM SIGIR 2009.
6. **Deerwester et al. (1990)** — *Indexing by Latent Semantic Analysis*. Journal of the American Society for Information Science (JASIS).
7. **Lin et al. (2021)** — *Pretrained Transformers for Text Ranking: BERT and Beyond*. Synthesis Lectures on Human Language Technologies.

---

## 🗄️ Database Supabase & Korpus Perbankan

Data korpus terdiri dari **3.022 potongan dokumen resmi (chunks)** dengan injeksi metadata header terstruktur `[Emiten | Tahun | Bab | Hal]`:

- **BBCA** (Bank Central Asia): 832 chunks
- **BBNI** (Bank Negara Indonesia): 789 chunks
- **BBRI** (Bank Rakyat Indonesia): 754 chunks
- **BMRI** (Bank Mandiri): 647 chunks

Struktur skema PostgreSQL Supabase dapat dilihat pada [`supabase/schema.sql`](supabase/schema.sql).

---

## 🚀 Panduan Memulai Cepat (Quickstart)

### 1. Kloning Repositori
```bash
git clone https://github.com/hairaff95/FinanceRAG-STKI.git
cd FinanceRAG-STKI
```

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```
Lalu isi kredensial Supabase Anda di `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Sinkronisasi Data ke Supabase (Sekali Saja)
```bash
npm run sync:supabase
```

### 5. Jalankan Server Pengembangan
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000).

---

## 🌐 Panduan Deploy ke Vercel

1. Push repositori ini ke GitHub Anda.
2. Buka [Vercel](https://vercel.com) dan impor repositori GitHub ini.
3. Di tab **Environment Variables**, tambahkan:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Klik **Deploy**. Aplikasi akan otomatis aktif dengan dukungan caching Supabase in-memory.

---

## 📁 Struktur Direktori

```
├── app/
│   ├── api/
│   │   ├── benchmark/         # API Pengujian Benchmark STKI M8
│   │   ├── corpus/            # API Explorer Korpus Supabase
│   │   ├── fincrag/           # API Pipeline Utama 5 Agen
│   │   └── ir-compare/        # API Komparasi 5 Algoritma IR
│   ├── globals.css            # Desain Sistem Neobrutalisme & Custom Fonts
│   ├── layout.tsx             # Root Layout & Metadata SEO
│   └── page.tsx               # Orchestrator 5 Workspace Utama
├── components/
│   ├── FormattedCitedSummary.tsx # Parser Markdown Bersitasi
│   ├── Header.tsx             # Top Navbar Neobrutalisme & Tab Router
│   ├── NeoDropdown.tsx        # Custom Neobrutalist Select Component
│   ├── Workspace1MejaAnalis.tsx        # Workspace 1: QA & Visualisasi 5 Agen
│   ├── Workspace2LaboratoriumIR.tsx    # Workspace 2: Komparasi 5 Metode IR
│   ├── Workspace3BenchmarkAblasi.tsx   # Workspace 3: Benchmark Evaluasi M8
│   ├── Workspace4SimulasiAuditCRAG.tsx # Workspace 4: 4 Skenario Audit CRAG
│   └── Workspace5BrankasKorpusJurnal.tsx # Workspace 5: Korpus & 7 Jurnal
├── data_processed/
│   └── chunks_perbankan.json  # Korpus Lokal 3.022 Chunks (Fallback)
├── lib/
│   ├── agents/                # Implementasi Agen 1 s/d Agen 5
│   ├── engines/               # Mesin BM25, LSI/SVD, TF-IDF, RRF
│   ├── pipeline.ts            # Pipeline Utama FIN-CRAG
│   ├── supabase.ts            # Client Supabase & In-Memory Cache
│   └── types.ts               # TypeScript Interfaces & Kontrak Data
├── scripts/
│   ├── sync_to_supabase.js    # Skrip Batch Uploader ke Supabase
│   ├── step1_parse_chunk.py   # Skrip Ekstraksi Teks PDF & Header Injeksi
│   └── step2_hybrid_search.py # Skrip Prototipe Awal Hybrid Search
├── supabase/
│   └── schema.sql             # DDL Tabel & RLS PostgreSQL Supabase
├── .env.example               # Template Konfigurasi Environment
├── .gitignore                 # Proteksi Kunci Rahasia & File Besar
├── package.json               # Metadata & Dependensi Proyek
└── README.md                  # Dokumentasi Resmi Proyek
```

---

## 📄 Lisensi & Kredit Akademik

Dilisensikan di bawah [Lisensi MIT](LICENSE).  
Dikembangkan untuk mata kuliah **Sistem Temu Kembali Informasi (STKI)** — Program Studi Teknik Informatika, Fakultas Ilmu Komputer, **Universitas Dian Nuswantoro (UDINUS) Semarang**, 2026.
