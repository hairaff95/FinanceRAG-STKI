import { createClient } from "@supabase/supabase-js";
import { ChunkItem } from "./types";
import fs from "fs";
import path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Cache korpus in-memory agar pencarian super cepat (< 50ms)
let cachedChunks: ChunkItem[] | null = null;

export async function getCorpusChunks(): Promise<ChunkItem[]> {
  if (cachedChunks && cachedChunks.length > 0) {
    return cachedChunks;
  }

  // 1. Coba ambil dari Supabase jika konfigurasi tersedia
  if (isSupabaseConfigured && supabase) {
    try {
      console.log("[Supabase] Mengambil korpus dari Supabase PostgreSQL...");
      let allRows: any[] = [];
      let from = 0;
      const step = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("perbankan_chunks")
          .select("*")
          .range(from, from + step - 1);

        if (error || !data || data.length === 0) {
          hasMore = false;
        } else {
          allRows = allRows.concat(data);
          if (data.length < step) {
            hasMore = false;
          } else {
            from += step;
          }
        }
      }

      if (allRows.length > 0) {
        cachedChunks = allRows.map((row: any) => ({
          chunk_id: row.chunk_id,
          text: row.full_text || row.text,
          raw_text: row.raw_text,
          metadata: {
            kode_bank: row.kode_bank,
            nama_bank: row.nama_bank,
            tahun: row.tahun,
            halaman: row.halaman,
            bab: row.bab,
            sumber_file: row.sumber_file,
          },
        }));
        console.log(`[Supabase] Berhasil memuat ${cachedChunks.length} chunks dari Supabase.`);
        return cachedChunks;
      }
    } catch (err) {
      console.warn("[Supabase] Gagal mengambil dari Supabase, beralih ke korpus lokal:", err);
    }
  }

  // 2. Fallback: Baca dari file data_processed/chunks_perbankan.json lokal
  try {
    const localJsonPath = path.join(process.cwd(), "data_processed", "chunks_perbankan.json");
    if (fs.existsSync(localJsonPath)) {
      const rawData = fs.readFileSync(localJsonPath, "utf-8");
      cachedChunks = JSON.parse(rawData);
      console.log(`[Korpus Lokal] Berhasil memuat ${cachedChunks?.length} chunks dari berkas lokal.`);
      return cachedChunks || [];
    }
  } catch (err) {
    console.error("[Korpus Lokal] Gagal membaca chunks lokal:", err);
  }

  return [];
}
