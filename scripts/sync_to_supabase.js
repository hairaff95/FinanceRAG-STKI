const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Baca .env.local secara otomatis jika ada
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

// Baca environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("ERROR: Harap tentukan NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local");
  console.log("Contoh:");
  console.log("NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co");
  console.log("SUPABASE_SERVICE_ROLE_KEY=your-service-role-key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const jsonPath = path.join(__dirname, '..', 'data_processed', 'chunks_perbankan.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Berkas tidak ditemukan: ${jsonPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, 'utf8');
  const chunks = JSON.parse(raw);
  console.log(`📦 Membaca ${chunks.length} chunks dari JSON...`);

  const batchSize = 100;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize).map(c => ({
      chunk_id: c.chunk_id,
      kode_bank: c.metadata.kode_bank,
      nama_bank: c.metadata.nama_bank,
      tahun: c.metadata.tahun,
      halaman: c.metadata.halaman,
      bab: c.metadata.bab,
      sumber_file: c.metadata.sumber_file,
      raw_text: c.raw_text,
      full_text: c.text
    }));

    const { error } = await supabase.from('perbankan_chunks').upsert(batch, { onConflict: 'chunk_id' });
    if (error) {
      console.error(`[Supabase Error] Gagal pada batch ${i} - ${i + batch.length}:`, error.message);
    } else {
      console.log(`[Supabase Success] Berhasil mengunggah chunks ${i + 1} s/d ${Math.min(i + batchSize, chunks.length)} / ${chunks.length}`);
    }
  }

  console.log("[Supabase Sync] Sinkronisasi ke Supabase Berhasil Selesai!");
}

main().catch(console.error);
