# PRODUCT REQUIREMENTS DOCUMENT (PRD)

**Nama Sistem:** FIN-CRAG (*Financial Corrective Retrieval-Augmented Generation*)  
**Judul Proyek:** Rancang Bangun Sistem Temu Kembali Informasi Laporan Tahunan Perbankan BEI Berbasis *Hybrid Retrieval* (BM25–LSI), *Financial Ratio Reranking*, dan *Corrective Agentic Verification*  
**Konteks Akademik:** Proyek Akhir Mata Kuliah Sistem Temu Kembali Informasi (STKI) — S1 Teknik Informatika, Universitas Dian Nuswantoro (UDINUS)  
**Tahun Akademik:** 2026  
**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Supabase (PostgreSQL), Vercel (Deployment), & Ollama (Opsional Local LLM)  
**Lisensi & Ketergantungan:** *Zero External AI API Dependency* (Algoritma STKI Murni Mandiri)

---

## 1. Latar Belakang & Identitas Orisinalitas Sistem

### 1.1 Permasalahan Domain Keuangan Pasar Modal
Investor dan analis pasar modal di Bursa Efek Indonesia (BEI) harus menelaah dokumen Laporan Tahunan (*Annual Report*) perbankan yang tebalnya mencapai 600 hingga 1.600+ halaman per bank. Pencarian kata kunci biasa sering gagal menemukan konteks strategi manajemen, sedangkan *Large Language Model* (LLM) standar tanpa verifikasi bukti rentan mengalami halusinasi angka akuntansi, mencampuradukkan data antar-bank, dan tidak tahan terhadap manipulasi instruksi (*prompt injection*).

### 1.2 Solusi Orisinal: FIN-CRAG
**FIN-CRAG** adalah sistem *Financial Corrective Agentic RAG* yang dirancang khusus untuk membedah dokumen laporan tahunan perbankan KBMI 4 di BEI (**BBCA, BBRI, BMRI, BBNI**). Berbeda dari sistem RAG literatur umum, FIN-CRAG mengadopsi cara kerja **Komite Analis Sekuritas & Audit Perbankan** melalui **5 Agen Spesialis Finansial** yang menggabungkan:
1. **Penyisipan Konteks Emiten pada Chunk (*Metadata Header Injection*)** agar angka keuangan antar-bank tidak tertukar.
2. **Pencarian Hibrida Leksikal–Laten (BM25 + TF-IDF + LSI/SVD)** yang disatukan dengan *Reciprocal Rank Fusion* (RRF).
3. **Penilaian Bukti Berbasis Kepadatan Rasio Bank (*Financial Evidence Scorer*)** yang memprioritaskan tabel dan indikator perbankan (`CAR`, `NPL`, `ROE`, `ROA`, `NIM`, `CASA`, `BOPO`, `LDR`).
4. **Mekanisme Korektif & Abstention (*CRAG Guardrail*)** yang berani menolak menjawab jika bukti tidak memadai atau kueri berada di luar ranah perbankan.

---

## 2. Landasan Jurnal Ilmiah (Open Access Literature)

Seluruh komponen algoritma dan arsitektur agen pada aplikasi FIN-CRAG dibangun berdasarkan rujukan jurnal dan *conference paper* internasional bereputasi yang dapat diakses secara gratis (*Open Access*):

| No | Peneliti & Tahun | Judul Publikasi & Penerbit | Tautan Akses Gratis (PDF) | Implementasi pada FIN-CRAG |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Setty et al. (2024)** | *Improving Retrieval for RAG based Question Answering Models on Financial Documents* (arXiv Financial NLP) | `https://arxiv.org/pdf/2404.07221` | Teknik pemotongan PDF laporan bank (*chunking*) dengan penyisipan *Metadata Header* (`[Emiten \| Tahun \| Bab \| Hal]`) pada Agen 1. |
| **2** | **Chen et al. (2021)** | *FinQA: A Dataset of Numerical Reasoning over Financial Data* (Proceedings of EMNLP 2021) | `https://aclanthology.org/2021.emnlp-main.296.pdf` | Desain fitur *Financial Numeric & Ratio Density* pada Agen 3 (*Financial Evidence Scorer*) untuk memprioritaskan potongan teks berisi rasio `%`, `bps`, `triliun`, dan `miliar`. |
| **3** | **Yan et al. (2024)** | *Corrective Retrieval Augmented Generation (CRAG)* (arXiv / ICLR 2024) | `https://arxiv.org/pdf/2401.15884` | Desain Agen 4 (*CRAG Auditor & Guardrail*) yang menilai kelayakan bukti (*Correct / Ambiguous / Incorrect*) dan mengeksekusi *Abstention* jika di luar domain. |
| **4** | **Asai et al. (2024)** | *Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection* (ICLR 2024) | `https://arxiv.org/pdf/2310.11511` | Desain Agen 5 (*Cited Financial Synthesizer*) dan fitur deteksi kontradiksi klaim angka keuangan antar-dokumen. |
| **5** | **Robertson & Zaragoza (2009)** | *The Probabilistic Relevance Framework: BM25 and Beyond* (Foundations and Trends in IR) | `https://www.staff.city.ac.uk/~sbrp622/papers/foundations_bm25_review.pdf` | Rumus matematika **Okapi BM25** pada pencarian leksikal untuk menangkap kode *ticker* saham dan singkatan rasio perbankan. |
| **6** | **Cormack, Clarke, & Buettcher (2009)** | *Reciprocal Rank Fusion Outperforms Condorcet and Individual Rank Learning Methods* (ACM SIGIR 2009) | `https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf` | Rumus **Hybrid RRF ($k=60$)** pada Agen 2 untuk menggabungkan peringkat leksikal (BM25) dan semantik ruang laten (LSI/SVD). |
| **7** | **Deerwester et al. (1990)** | *Indexing by Latent Semantic Analysis* (JASIS) | Akses via Google Scholar / Wiley Open Archive | Landasan reduksi dimensi matriks **TF-IDF + Truncated SVD (LSI)** untuk menangkap kemiripan makna tanpa API *embedding* eksternal. |

---

## 3. Pemetaan Capaian Pembelajaran Mata Kuliah STKI (RPS M1–M14)

| Minggu RPS | Topik Materi Kuliah STKI | Implementasi Teknis di FIN-CRAG |
| :--- | :--- | :--- |
| **M1 – M3** | *Text Preprocessing*, Tokenisasi, & *Inverted Index* | Pembersihan teks laporan tahunan (Hal. 1–221), tokenisasi numerik-keuangan, *chunking* (1.000 karakter, *overlap* 200), dan pembangunan *Inverted Index*. |
| **M4** | *Vector Space Model* (VSM) & Pembobotan **TF-IDF** | Perhitungan matriks *Term Frequency–Inverse Document Frequency* dan kemiripan sudut *Cosine Similarity*. |
| **M5** | *Probabilistic Retrieval* & **Okapi BM25** | Pencarian kata kunci dengan normalisasi panjang dokumen ($k_1 = 1.5, b = 0.75$) untuk istilah teknis perbankan. |
| **M6** | *Latent Semantic Indexing* (**LSI / SVD**) | Dekomposisi nilai singular (*Truncated SVD*) untuk memetakan kueri dan *chunk* laporan bank ke ruang konsep laten. |
| **M8** | Evaluasi Sistem Temu Kembali Informasi | Pengujian otomatis metrik **Precision@5 (P@5), Recall@5 (R@5), MAP, MRR,** dan **NDCG@5** terhadap *Ground Truth Qrels* perbankan. |
| **M9 – M11** | *Query Expansion* & *Relevance Reformulation* | Ekspansi kueri otomatis dengan kamus sinonim akuntansi & perbankan Indonesia (contoh: `NPL` $\leftrightarrow$ `kredit bermasalah`). |
| **M12 – M14** | *Hybrid IR*, *Learning-to-Rank*, & *Corrective RAG* | Fusi peringkat **RRF ($k=60$)**, *Financial Reranker* 6-fitur, sintesis bersitasi halaman PDF, dan simulasi audit ketahanan 4 skenario. |

---

## 4. Spesifikasi Korpus Data & Skema Database (Supabase)

### 4.1 Distribusi Korpus Perbankan BEI (Tahun Buku 2025)
Korpus diekstraksi dari dokumen resmi **Laporan Tahunan (*Annual Report*) 2025** empat bank KBMI 4 (mencakup Bab Ikhtisar Keuangan, Laporan Manajemen, Profil Perusahaan, dan Analisis & Pembahasan Manajemen / MD&A):
* **`BBCA`** — PT Bank Central Asia Tbk: **832 chunks**
* **`BBNI`** — PT Bank Negara Indonesia (Persero) Tbk: **789 chunks**
* **`BBRI`** — PT Bank Rakyat Indonesia (Persero) Tbk: **754 chunks**
* **`BMRI`** — PT Bank Mandiri (Persero) Tbk: **647 chunks**
* **Total Korpus Terindeks:** **3.022 chunks**

### 4.2 Skema Tabel PostgreSQL di Supabase (`public.perbankan_chunks`)
```sql
create table if not exists public.perbankan_chunks (
  chunk_id text primary key,       -- Contoh: BBCA_2025_p209_c412
  kode_bank text not null,         -- BBCA | BBRI | BMRI | BBNI
  nama_bank text not null,         -- Nama resmi perseroan bank
  tahun int not null,              -- Tahun laporan (2025)
  halaman int not null,            -- Nomor halaman PDF asli
  bab text not null,               -- Kategori bab laporan tahunan
  sumber_file text not null,       -- Nama file PDF sumber
  raw_text text not null,          -- Teks asli potongan dokumen
  full_text text not null          -- Teks dengan injeksi header metadata
);
create index if not exists idx_kode_bank on public.perbankan_chunks(kode_bank);
```

---

## 5. Arsitektur Orkestrasi 5 Agen Analis Perbankan (FIN-CRAG Pipeline)

Setiap kueri pengguna diproses secara sekuensial melalui 5 Agen Spesialis Finansial:

### Agen 1: Ticker & Ratio Decomposer (Rujukan: Setty et al., 2024)
- **Deteksi Entitas Saham:** Mendeteksi entitas kode saham bank yang disebut pengguna (`BBCA`, `BBRI`, `BMRI`, `BBNI`).
- **Penentuan Mode Kueri:**
  - `SINGLE-EMITEN`: Jika hanya 1 bank yang disebut (misal: "laba BBCA").
  - `MULTI-BANK-HEAD-TO-HEAD`: Jika membandingkan $\ge 2$ bank (misal: "bandingkan NPL BBRI dan BMRI").
  - `SECTOR-WIDE`: Jika tidak spesifik menyebut emiten (misal: "bank mana dengan CAR tertinggi?").
- **Query Expansion:** Melakukan ekspansi kueri menggunakan kamus sinonim perbankan Indonesia (misal: *"dana murah"* diperluas menjadi `["casa", "giro", "tabungan"]`; *"kredit bermasalah"* diperluas menjadi `["npl", "non-performing loan", "kolektibilitas"]`).

### Agen 2: Dual-Index Hybrid Retriever (Rujukan: Robertson, 2009; Deerwester, 1990; Cormack et al., 2009)
- **Dual Retrieval Paralel:** Menjalankan pencarian paralel pada:
  1. **Indeks Leksikal:** Okapi BM25 ($k_1=1.5, b=0.75$) & TF-IDF VSM.
  2. **Indeks Semantik Laten:** LSI / Truncated SVD (reduksi dimensi ke ruang konsep laten tanpa API eksternal).
- **Reciprocal Rank Fusion (RRF, $k=60$):** Menggabungkan kedua daftar peringkat kandidat dokumen:
  $$\text{RRF}(d) = \frac{1}{60 + \text{rank}_{\text{BM25}}(d)} + \frac{1}{60 + \text{rank}_{\text{LSI}}(d)}$$

### Agen 3: Financial Evidence Scorer (Rujukan: FinQA — Chen et al., 2021)
Mengurutkan ulang (*reranking*) kandidat hasil RRF menggunakan **6 Fitur Berbobot Khusus Keuangan**:
* **$F_1$ (25%): Skor Normalisasi Leksikal BM25** — Kesesuaian leksikal kata kunci kueri.
* **$F_2$ (25%): Skor Kemiripan Kosinus Ruang Laten LSI** — Kedekatan sudut vektor pada ruang semantik laten.
* **$F_3$ (20%): Skor Konsensus Peringkat RRF** — Kekuatan konsensus dari fusi leksikal dan laten.
* **$F_4$ (15%): Query Term Coverage** — Persentase kata kunci pertanyaan yang muncul di dalam dokumen.
* **$F_5$ (10%): Financial Numeric & Ratio Density** — Kepadatan kemunculan indikator angka akuntansi (`%`, `bps`, `triliun`, `miliar`, `Rp`).
* **$F_6$ (5%): Emiten & Bab Priority Boost** — Prioritas ekstra untuk bab *Ikhtisar Keuangan* dan *Analisis & Pembahasan Manajemen (MD&A)*.

### Agen 4: CRAG Auditor & Guardrail (Rujukan: CRAG — Yan et al., 2024)
- **Prompt Injection Defense & Quarantine:** Menyaring dan mengkarantina dokumen yang terindikasi mengandung instruksi manipulatif (seperti *"Ignore previous instructions..."*).
- **Confidence Grading & Abstention Mechanism:**
  - **Status `CORRECT`** ($\text{Skor} \ge 0.25$ & domain perbankan cocok) $\rightarrow$ Lanjut ke sintesis jawaban.
  - **Status `AMBIGUOUS`** ($0.15 \le \text{Skor} < 0.25$) $\rightarrow$ Sintesis jawaban disertai peringatan (*disclaimer*) keterbatasan bukti.
  - **Status `INCORRECT / ABSTAIN`** ($\text{Skor} < 0.15$ atau kueri di luar domain perbankan) $\rightarrow$ Menolak menjawab secara tegas (*Abstain*) demi mencegah halusinasi.

### Agen 5: Cited Financial Synthesizer (Rujukan: Self-RAG — Asai et al., 2024)
- **Sintesis Bersitasi:** Merangkum jawaban analisis perbankan dalam Bahasa Indonesia dengan kewajiban menyertakan badge sitasi halaman asli (`[1]`, `[2]`) di setiap klaim angka atau fakta.
- **Dual Synthesis Engine:**
  1. **Extractive Financial Synthesizer:** Berjalan instan 100% serverless di Vercel tanpa API luar (*Zero API Dependency*).
  2. **Local Ollama LLM:** Opsi integrasi model lokal saat dijalankan di lingkungan localhost.

---

## 6. Desain Antarmuka Pengguna (5 Workspace Utama)

Aplikasi mengusung tema visual **Executive Financial Terminal** (palet warna *Emerald Green*, *Deep Slate*, dan *Clean White*) yang dirancang elegan, profesional, dan interaktif:

### Workspace 1: Meja Analis (Agentic QA & Multi-Bank Head-to-Head)
- **Input Analitis & Pemilih Emiten:** Input kueri dengan filter cepat (`Semua Bank`, `BBCA`, `BBRI`, `BMRI`, `BBNI`) dan 4 tombol skenario cepat (*Kinerja Laba & Kredit*, *Komparasi 2 Bank*, *Target 2026*, *Uji Abstain Luar Topik*).
- **Visualisasi Pipa 5 Agen FIN-CRAG:** Indikator progres real-time Agen 1 s/d Agen 5 lengkap dengan waktu eksekusi (ms) dan log keputusan setiap agen.
- **Kartu Bukti & Sitasi Terverifikasi:** Ringkasan jawaban bersitasi, diikuti kartu bukti dokumen asli (Kode Bank, Nomor Halaman PDF, Nama Bab, visualisasi bar 6 fitur skor Financial Scorer, dan kutipan teks asli PDF).

### Workspace 2: Laboratorium IR (Komparasi 5 Metode Temu Kembali)
Memungkinkan pengguna menguji 1 kueri perbankan dan membandingkan secara berdampingan (*side-by-side*) peringkat Top-5 Chunks dari 5 metode STKI:
1. **TF-IDF** (*Vector Space Model Cosine* - Pertemuan M4)
2. **Okapi BM25** (*Probabilistic Lexical* - Pertemuan M5)
3. **LSI / Truncated SVD** (*Latent Semantic Indexing* - Pertemuan M6)
4. **Hybrid RRF** ($k=60$ - Pertemuan M14)
5. **Financial Reranker** (6-Fitur FinQA - Pertemuan M14)

### Workspace 3: Benchmark & Ablasi (Evaluasi Metrik STKI M8)
- **Evaluasi Otomatis:** Pengujian terotomatisasi terhadap daftar kueri *answerable* dan *unanswerable* (luar topik).
- **Tabel & Grafik Metrik:** Menampilkan metrik **P@5, R@5, MAP, MRR, NDCG@5,** serta **Akurasi Abstention**.
- **Tabel Studi Ablasi:** Mengukur kontribusi penambahan fitur *Financial Numeric Density* terhadap kenaikan skor NDCG dan MRR.

### Workspace 4: Simulasi Audit CRAG (Uji Ketahanan 4 Skenario)
Pengujian interaktif 4 skenario keamanan dan keandalan sistem RAG (Rujukan: Yan et al., 2024 & Asai et al., 2024):
1. **Out-of-Domain Abstention:** Kueri resep masakan / konsultasi medis $\rightarrow$ Wajib ditolak oleh Agen 4.
2. **Financial Claim Contradiction:** Dua dokumen dengan klaim angka Laba vs Rugi yang bertentangan $\rightarrow$ Wajib dideteksi konfliknya.
3. **Temporal Staleness Detection:** Dokumen tahun laporan usang (misal 2019 vs permintaan 2025) $\rightarrow$ Wajib diberi peringatan keusangan waktu.
4. **Prompt Injection Quarantine:** Dokumen disusupi instruksi manipulasi (*"Ignore previous instructions..."*) $\rightarrow$ Wajib dikarantina sebelum masuk ke Reranker.

### Workspace 5: Brankas Korpus & Jurnal (Supabase Explorer & Referensi Ilmiah)
- **Penjelajah Korpus Supabase:** Eksplorasi interaktif 3.022 chunks (BBCA, BBRI, BMRI, BBNI), pencarian isi teks/bab, dan pagination langsung dari Supabase.
- **Katalog Jurnal & Pemetaan RPS M1–M14:** Menampilkan kartu rujukan 7 jurnal internasional dengan ringkasan metodologi, tautan unduh PDF Open Access, dan tabel pemetaan materi perkuliahan STKI Minggu 1–14.

---

## 7. Arsitektur Deployment (Next.js + Supabase + Vercel)

- **Penyimpanan Cloud (Supabase PostgreSQL):** Menyimpan seluruh 3.022 chunks beserta metadata perbankan sehingga aplikasi selalu memiliki akses data 24/7 tanpa perlu mengunggah file PDF ratusan MB ke Vercel.
- **Komputasi STKI Mandiri di Next.js API Routes:** Saat server API Next.js berjalan, sistem memuat korpus dari Supabase, melakukan *in-memory caching* atas struktur *Inverted Index* BM25, TF-IDF, dan proyeksi laten LSI.
- **Performa Tinggi:** Eksekusi pencarian berlangsung di bawah 150 ms dan status sistem selalu menampilkan indikator `● ENGINE & SUPABASE ONLINE`.