import os
import re
import json
import pickle
import chromadb
from sentence_transformers import SentenceTransformer
from rank_bm25 import BM25Okapi
from tqdm import tqdm

# Konfigurasi Lokasi File & Database
CHUNKS_FILE = "data_processed/chunks_perbankan.json"
DB_DIR = "vector_db"
BM25_FILE = "data_processed/bm25_index.pkl"
COLLECTION_NAME = "koleksi_bank_bei"

# Model Embedding Multibahasa (Mendukung Bahasa Indonesia dengan sangat baik & ringan)
EMBEDDING_MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

def tokenisasi_sederhana(teks: str):
    """Fungsi tokenisasi STKI untuk BM25: lowercase & ambil kata/angka penting"""
    teks_bersih = re.sub(r"[^a-zA-Z0-9%\.,]", " ", teks.lower())
    return teks_bersih.split()

class MesinPencariSTKI:
    def __init__(self):
        print("⚙️ Memuat model Embedding (SentenceTransformer)...")
        # Otomatis menggunakan MPS (Apple Silicon GPU) jika tersedia, atau CPU
        self.embed_model = SentenceTransformer(EMBEDDING_MODEL_NAME)
        self.chroma_client = chromadb.PersistentClient(path=DB_DIR)
        
        with open(CHUNKS_FILE, "r", encoding="utf-8") as f:
            self.chunks = json.load(f)
            
        # Buat dictionary lookup cepat berdasarkan chunk_id
        self.chunk_map = {c["chunk_id"]: c for c in self.chunks}

    def bangun_indeks(self, paksa_buat_ulang=False):
        """Membangun Vector Index (ChromaDB) dan Lexical Index (BM25)"""
        existing_collections = [c.name for c in self.chroma_client.list_collections()]
        
        if COLLECTION_NAME in existing_collections and os.path.exists(BM25_FILE) and not paksa_buat_ulang:
            print("✅ Indeks Vector & BM25 sudah ada! Langsung memuat dari penyimpanan lokal...")
            self.collection = self.chroma_client.get_collection(COLLECTION_NAME)
            with open(BM25_FILE, "rb") as f:
                self.bm25 = pickle.load(f)
            return

        print("\n🚀 Membangun Indeks Baru untuk 3.022 Chunks...")
        if COLLECTION_NAME in existing_collections:
            self.chroma_client.delete_collection(COLLECTION_NAME)
        
        self.collection = self.chroma_client.create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"} # Menggunakan Cosine Similarity
        )

        # 1. Bangun Indeks BM25 (Sparse Retrieval)
        print("1️⃣ Membangun Indeks Kata Kunci (BM25)...")
        tokenized_corpus = [tokenisasi_sederhana(c["text"]) for c in tqdm(self.chunks, desc="Tokenisasi BM25")]
        self.bm25 = BM25Okapi(tokenized_corpus)
        with open(BM25_FILE, "wb") as f:
            pickle.dump(self.bm25, f)

        # 2. Bangun Indeks Vektor di ChromaDB (Dense Retrieval) per Batch
        print("2️⃣ Menghitung Vector Embedding & Menyimpan ke ChromaDB...")
        batch_size = 128
        for i in tqdm(range(0, len(self.chunks), batch_size), desc="Indexing Vector"):
            batch = self.chunks[i : i + batch_size]
            ids = [c["chunk_id"] for c in batch]
            texts = [c["text"] for c in batch]
            metadatas = [c["metadata"] for c in batch]
            
            embeddings = self.embed_model.encode(texts, show_progress_bar=False).tolist()
            
            self.collection.add(
                ids=ids,
                embeddings=embeddings,
                documents=texts,
                metadatas=metadatas
            )
        print("🎉 Indeks Vector & BM25 Berhasil Dibuat dan Disimpan!")

    def deteksi_filter_bank(self, query: str):
        """Mendeteksi otomatis apakah pertanyaan pengguna menyebut bank tertentu"""
        q_upper = query.upper()
        alias_bank = {
            "BBCA": ["BBCA", "BCA", "CENTRAL ASIA"],
            "BBRI": ["BBRI", "BRI", "RAKYAT INDONESIA"],
            "BMRI": ["BMRI", "MANDIRI"],
            "BBNI": ["BBNI", "BNI", "NEGARA INDONESIA"]
        }
        bank_terdeteksi = []
        for kode, daftar_kata in alias_bank.items():
            for kata in daftar_kata:
                if re.search(rf"\b{kata}\b", q_upper):
                    bank_terdeteksi.append(kode)
                    break
        
        # Jika hanya menyebut 1 bank spesifik, kunci pencarian ke bank tersebut
        if len(bank_terdeteksi) == 1:
            return bank_terdeteksi[0]
        return None # Jika menyebut >1 bank (membandingkan) atau tidak menyebut bank

    def hybrid_search(self, query: str, top_k: int = 5, filter_kode_bank: str = None):
        """
        Algoritma Inti STKI: Menggabungkan Vector Search (Cosine Similarity)
        dan BM25 menggunakan metode Reciprocal Rank Fusion (RRF).
        """
        # Deteksi otomatis kode bank jika tidak difilter manual dari UI
        if not filter_kode_bank:
            filter_kode_bank = self.deteksi_filter_bank(query)

        # --- A. PENCARIAN VEKTOR (DENSE) ---
        query_embedding = self.embed_model.encode([query]).tolist()
        where_filter = {"kode_bank": filter_kode_bank} if filter_kode_bank else None
        
        hasil_vector = self.collection.query(
            query_embeddings=query_embedding,
            n_results=top_k * 3,
            where=where_filter
        )
        
        vector_ids = hasil_vector["ids"][0]
        vector_distances = hasil_vector["distances"][0] # Jarak Cosine (makin kecil makin mirip)
        
        # Konversi jarak ke skor Cosine Similarity (1 - distance)
        skor_cosine_map = {
            cid: round(1 - dist, 4) 
            for cid, dist in zip(vector_ids, vector_distances)
        }

        # --- B. PENCARIAN KATA KUNCI (BM25 / SPARSE) ---
        tokenized_query = tokenisasi_sederhana(query)
        bm25_scores = self.bm25.get_scores(tokenized_query)
        
        # Urutkan indeks BM25 tertinggi (dengan filter bank jika aktif)
        bm25_pasangan = []
        for idx, score in enumerate(bm25_scores):
            chunk = self.chunks[idx]
            if filter_kode_bank and chunk["metadata"]["kode_bank"] != filter_kode_bank:
                continue
            if score > 0:
                bm25_pasangan.append((chunk["chunk_id"], float(score)))
                
        bm25_pasangan.sort(key=lambda x: x[1], reverse=True)
        bm25_top = bm25_pasangan[:top_k * 3]
        bm25_ids = [item[0] for item in bm25_top]
        skor_bm25_map = {item[0]: round(item[1], 2) for item in bm25_top}

        # --- C. PENGGABUNGAN RRF (RECIPROCAL RANK FUSION) ---
        # Rumus RRF: Score = 1 / (k + rank_vector) + 1 / (k + rank_bm25)
        k_rrf = 60
        rrf_scores = {}
        semua_kandidat_id = set(vector_ids) | set(bm25_ids)

        for cid in semua_kandidat_id:
            skor = 0.0
            if cid in vector_ids:
                rank_v = vector_ids.index(cid) + 1
                skor += 1.0 / (k_rrf + rank_v)
            if cid in bm25_ids:
                rank_b = bm25_ids.index(cid) + 1
                skor += 1.0 / (k_rrf + rank_b)
            rrf_scores[cid] = skor

        # Urutkan berdasarkan skor RRF tertinggi
        urut_terbaik = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)[:top_k]

        hasil_akhir = []
        for rank, (cid, rrf_val) in enumerate(urut_terbaik, start=1):
            data_asli = self.chunk_map[cid]
            hasil_akhir.append({
                "rank": rank,
                "chunk_id": cid,
                "rrf_score": round(rrf_val, 5),
                "cosine_similarity": skor_cosine_map.get(cid, 0.0),
                "bm25_score": skor_bm25_map.get(cid, 0.0),
                "metadata": data_asli["metadata"],
                "raw_text": data_asli["raw_text"],
                "full_text": data_asli["text"]
            })

        return hasil_akhir, filter_kode_bank


# --- PENGUJIAN LANGSUNG DI TERMINAL ---
if __name__ == "__main__":
    mesin = MesinPencariSTKI()
    mesin.bangun_indeks()

    # Daftar pertanyaan uji coba untuk mengecek akurasi STKI
    pertanyaan_uji = [
        "Berapa laba bersih dan pertumbuhan kredit BBCA pada tahun 2025?",
        "Berapa rasio NPL dan CAR Bank Mandiri (BMRI) tahun 2025?",
        "Bagaimana kinerja penyaluran kredit UMKM di BRI (BBRI)?"
    ]

    print("\n" + "="*65)
    print("🔎 UJI COBA MESIN TEMU KEMBALI INFORMASI (HYBRID SEARCH)")
    print("="*65)

    for q in pertanyaan_uji:
        print(f"\n❓ QUERY: '{q}'")
        hasil, filter_aktif = mesin.hybrid_search(q, top_k=3)
        print(f"🎯 Auto-Filter Emiten: {filter_aktif if filter_aktif else 'Semua Bank'}")
        print("-" * 65)
        for h in hasil:
            meta = h["metadata"]
            cuplikan = h["raw_text"].replace("\n", " ")[:180]
            print(f"  #{h['rank']} [{meta['kode_bank']} - Hal. {meta['halaman']} | {meta['bab']}]")
            print(f"     📊 Skor -> RRF: {h['rrf_score']} | Cosine: {h['cosine_similarity']} | BM25: {h['bm25_score']}")
            print(f"     📝 Cuplikan: \"{cuplikan}...\"\n")