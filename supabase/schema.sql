-- ====================================================================
-- SKEMA DATABASE FIN-CRAG: SISTEM TEMU KEMBALI LAPORAN TAHUNAN BANK
-- Proyek STKI UDINUS 2026 - Universitas Dian Nuswantoro
-- ====================================================================

-- 1. Buat Tabel public.perbankan_chunks
create table if not exists public.perbankan_chunks (
  chunk_id text primary key,        -- Contoh: BBCA_2025_p209_c412
  kode_bank text not null,          -- BBCA | BBRI | BMRI | BBNI
  nama_bank text not null,          -- Nama resmi perseroan bank
  tahun int not null default 2025,  -- Tahun laporan buku
  halaman int not null,             -- Nomor halaman PDF asli
  bab text not null,                -- Kategori bab (Ikhtisar, MD&A, dll)
  sumber_file text not null,        -- Nama file PDF sumber
  raw_text text not null,           -- Teks asli potongan dokumen
  full_text text not null,          -- Teks dengan injeksi header metadata
  created_at timestamptz default now()
);

-- 2. Indeks untuk optimasi query filter
create index if not exists idx_perbankan_kode_bank on public.perbankan_chunks(kode_bank);
create index if not exists idx_perbankan_halaman on public.perbankan_chunks(halaman);
create index if not exists idx_perbankan_bab on public.perbankan_chunks(bab);

-- 3. Kebijakan Row Level Security (RLS) - Read-Only publik untuk Vercel Serverless
alter table public.perbankan_chunks enable row level security;

create policy "Izinkan akses publik baca ke perbankan_chunks"
  on public.perbankan_chunks
  for select
  using (true);

-- Catatan: Total data yang diunggah adalah 3.022 chunks:
-- BBCA: 832 chunks | BBNI: 789 chunks | BBRI: 754 chunks | BMRI: 647 chunks
