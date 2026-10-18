import os
import json
import fitz  # PyMuPDF
from langchain_text_splitters import RecursiveCharacterTextSplitter
from tqdm import tqdm

# Konfigurasi Direktori
PDF_DIR = "data_pdf"
OUTPUT_DIR = "data_processed"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "chunks_perbankan.json")

# Kamus Nama Bank (Bisa ditambah sesuai file PDF yang kamu kumpulkan)
KAMUS_BANK = {
    "BBCA": "PT Bank Central Asia Tbk",
    "BBRI": "PT Bank Rakyat Indonesia (Persero) Tbk",
    "BMRI": "PT Bank Mandiri (Persero) Tbk",
    "BBNI": "PT Bank Negara Indonesia (Persero) Tbk",
    "BRIS": "PT Bank Syariah Indonesia Tbk",
    "BDMN": "PT Bank Danamon Indonesia Tbk",
    "BNGA": "PT Bank CIMB Niaga Tbk",
    "NISP": "PT Bank OCBC NISP Tbk",
    "BBTN": "PT Bank Tabungan Negara (Persero) Tbk",
    "ARTO": "PT Bank Jago Tbk"
}

def tentukan_bab(nomor_halaman: int) -> str:
    """
    Menentukan kategori bab berdasarkan rentang halaman Annual Report
    (Mengacu pada struktur Daftar Isi Annual Report seperti BBCA 2025)
    """
    if nomor_halaman <= 18:
        return "Ikhtisar Utama & Rasio Keuangan"
    elif 19 <= nomor_halaman <= 31:
        return "Laporan Manajemen (Direksi & Komisaris)"
    elif 32 <= nomor_halaman <= 81:
        return "Profil Perusahaan"
    elif 82 <= nomor_halaman <= 225:
        return "Analisis dan Pembahasan Manajemen (MD&A)"
    else:
        return "Informasi Lainnya"

def ekstrak_dan_chunk_pdf(filepath: str, max_halaman: int = 221):
    """
    Membaca PDF per halaman, mengekstrak teks & tabel, lalu memotong menjadi chunks
    lengkap dengan metadata STKI.
    """
    nama_file = os.path.basename(filepath)
    # Format nama file yang diharapkan: KODE_TAHUN.pdf (Contoh: BBCA_2025.pdf)
    parts = nama_file.replace(".pdf", "").split("_")
    kode_bank = parts[0].upper() if len(parts) > 0 else "UNKNOWN"
    tahun = parts[1] if len(parts) > 1 else "2025"
    nama_bank = KAMUS_BANK.get(kode_bank, f"Bank {kode_bank}")

    doc = fitz.open(filepath)
    batas_baca = min(len(doc), max_halaman)

    # Konfigurasi Text Splitter (Ukuran chunk 1000 karakter dengan overlap 200 karakter)
    # Overlap penting agar konteks kalimat/tabel yang terpotong tetap nyambung
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", ". ", " ", ""]
    )

    daftar_chunks = []
    chunk_counter = 0

    print(f"\n📄 Memproses: {nama_file} ({nama_bank} - Tahun {tahun})")
    print(f"   Membaca Halaman 1 s/d {batas_baca} dari total {len(doc)} halaman...")

    for page_idx in tqdm(range(batas_baca), desc=f"Ekstraksi {kode_bank}"):
        nomor_halaman = page_idx + 1
        page = doc[page_idx]
        
        # Ekstrak teks dengan mempertahankan tata letak (blocks/tabel)
        teks_halaman = page.get_text("text").strip()

        # Lewati halaman jika kosong atau hanya berisi gambar sampul tanpa teks
        if len(teks_halaman) < 50:
            continue

        kategori_bab = tentukan_bab(nomor_halaman)

        # Potong teks halaman menjadi beberapa chunk
        potongan_teks = text_splitter.split_text(teks_halaman)

        for teks_chunk in potongan_teks:
            chunk_counter += 1
            
            # Menyisipkan konteks header di setiap chunk agar Vector & BM25
            # selalu tahu chunk ini milik bank apa dan tahun berapa
            teks_terkaya = (
                f"[Emiten: {kode_bank} - {nama_bank} | Tahun: {tahun} | "
                f"Bab: {kategori_bab} | Hal: {nomor_halaman}]\n"
                f"{teks_chunk}"
            )

            data_chunk = {
                "chunk_id": f"{kode_bank}_{tahun}_p{nomor_halaman}_c{chunk_counter}",
                "text": teks_terkaya,
                "raw_text": teks_chunk,
                "metadata": {
                    "kode_bank": kode_bank,
                    "nama_bank": nama_bank,
                    "tahun": int(tahun) if tahun.isdigit() else 2025,
                    "halaman": nomor_halaman,
                    "bab": kategori_bab,
                    "sumber_file": nama_file
                }
            }
            daftar_chunks.append(data_chunk)

    doc.close()
    print(f"✅ Selesai {kode_bank}: Menghasilkan {len(daftar_chunks)} chunks.")
    return daftar_chunks

def main():
    os.makedirs(PDF_DIR, exist_ok=True)
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    semua_pdf = [f for f in os.listdir(PDF_DIR) if f.lower().endswith(".pdf")]

    if not semua_pdf:
        print(f"⚠️ Tidak ada file PDF di dalam folder '{PDF_DIR}/'.")
        print("   Silakan masukkan file PDF (misal: BBCA_2025.pdf) ke folder tersebut lalu jalankan ulang.")
        return

    total_chunks = []
    for pdf_file in semua_pdf:
        jalur_file = os.path.join(PDF_DIR, pdf_file)
        chunks_bank = ekstrak_dan_chunk_pdf(jalur_file, max_halaman=221)
        total_chunks.extend(chunks_bank)

    # Simpan semua hasil chunking ke JSON
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(total_chunks, f, indent=2, ensure_ascii=False)

    print("\n" + "="*55)
    print(f"🎉 PROSES TAHAP 1 & 2 SELESAI!")
    print(f"📊 Total Dokumen PDF Diproses : {len(semua_pdf)} file")
    print(f"🧩 Total Chunks Dihasilkan    : {len(total_chunks)} chunks")
    print(f"💾 Lokasi File Output         : {OUTPUT_FILE}")
    print("="*55)

    # Tampilkan 1 contoh chunk untuk verifikasi
    if total_chunks:
        print("\n🔍 Contoh Isi Chunk Pertama:")
        print(json.dumps(total_chunks[0], indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()