import { Agent4Result, CRAGStatus, RerankedCandidate } from "../types";

// Pola Prompt Injection yang harus dikarantina
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous\s+)?instructions/i,
  /abaikan\s+(semua\s+)?(instruksi|perintah)\s+sebelumnya/i,
  /system\s+prompt/i,
  /jailbreak/i,
  /bocorkan\s+(rahasia|instruksi|aturan)/i,
  /you\s+are\s+now\s+a\s+helpful\s+hacker/i,
  /drop\s+table/i,
  /<script>/i,
];

// Pola Out-of-Domain Non-Finansial (Kuliner, Olahraga, Hiburan, Medis, dll)
const OUT_OF_DOMAIN_PATTERNS = [
  /\b(resep|masak|memasak|bumbu|makanan|minuman|kuliner|rendang|nasi|goreng|daging|ayam|sayur|kue|restoran|dapur|chef|piring|garam|gula|pedas)\b/i,
  /\b(film|bioskop|aktor|aktris|sinopsis|movie|drama|lagu|musik|penyanyi|lirik|konser|album|gitar)\b/i,
  /\b(sepak\s*bola|piala\s*dunia|liga|juara|olahraga|atlet|badminton|basket|futsal|motogp|f1|pertandingan|pemain)\b/i,
  /\b(obat|penyakit|dokter|gejala|rumah\s*sakit|kesehatan|terapi|vaksin|medis|infeksi|virus|batuk|demam)\b/i,
  /\b(cuaca|hujan|gempa|tsunami|iklim|prakiraan|panas|dingin|angin|awan)\b/i,
  /\b(zodiak|ramalan|horoskop|jodoh|asmara|cinta|pacar)\b/i,
  /\b(wisata|hotel|penerbangan|turis|liburan|pantai|gunung|destinasi)\b/i,
  /\b(coding|python|javascript|html|css|bug|syntax|sql|git|komputer|game|gaming|mobile\s*legends|playstation|minecraft)\b/i,
];

// Istilah domain perbankan & keuangan untuk verifikasi In-Domain (Pencocokan Batas Kata / \b)
const BANKING_DOMAIN_KEYWORDS = [
  "bank", "bbca", "bbri", "bmri", "bbni", "bca", "bri", "mandiri", "bni",
  "laba", "rugi", "kredit", "aset", "modal", "car", "npl", "lar", "roe", "roa",
  "nim", "bopo", "ldr", "casa", "giro", "tabungan", "deposito", "dpk",
  "keuangan", "tahunan", "laporan", "dividen", "saham", "kinerja", "rasio",
  "umkm", "kur", "digital", "bunga", "pendapatan", "beban", "ckpn", "kolektibilitas",
  "direksi", "komisaris", "tata kelola", "esg", "target", "cabang", "perseroan",
  "pembiayaan", "likuiditas", "permodalan", "ekuitas", "portofolio", "investasi"
];

function isWordInText(text: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escaped}\\b`, "i");
  return regex.test(text);
}

export function runAgent4CRAGAuditor(
  query: string,
  candidates: RerankedCandidate[]
): Agent4Result {
  const startTime = performance.now();
  const qLower = query.toLowerCase();

  // 1. Deteksi Serangan Prompt Injection
  let isPromptInjection = false;
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(query)) {
      isPromptInjection = true;
      break;
    }
  }

  // Periksa juga apakah ada potongan teks kandidat yang disusupi injeksi
  let quarantinedCount = 0;
  for (const c of candidates) {
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(c.chunk.raw_text)) {
        quarantinedCount++;
        isPromptInjection = true;
        break;
      }
    }
  }

  if (isPromptInjection) {
    const executionTimeMs = Number((performance.now() - startTime).toFixed(2));
    return {
      status: "INCORRECT_ABSTAIN",
      confidenceScore: 0.0,
      isOutOfDomain: false,
      isPromptInjection: true,
      quarantinedCount: Math.max(1, quarantinedCount),
      statusBadge: "PROMPT INJECTION QUARANTINED",
      reason: "Terdeteksi instruksi berbahaya manipulasi prompt. Dokumen telah dikarantina oleh Agen 4 untuk melindungi integritas sistem.",
      executionTimeMs,
      log: `[Agent 4: CRAG Auditor] PERINGATAN KEAMANAN: Terdeteksi pola Prompt Injection! Dokumen segera dikarantina. Status: INCORRECT_ABSTAIN`,
    };
  }

  // 2. Evaluasi Domain Keuangan (Out-of-Domain Abstention - Yan et al., 2024)
  // a. Cek apakah kueri memuat topik non-finansial eksplisit (resep memasak, olahraga, film, dll)
  let isExplicitOutOfDomain = false;
  for (const pattern of OUT_OF_DOMAIN_PATTERNS) {
    if (pattern.test(query)) {
      isExplicitOutOfDomain = true;
      break;
    }
  }

  // b. Cek apakah kueri memiliki kata kunci perbankan yang valid secara batas kata (\b)
  const isFinancialDomain = BANKING_DOMAIN_KEYWORDS.some((kw) => isWordInText(query, kw));

  if (isExplicitOutOfDomain || !isFinancialDomain) {
    const executionTimeMs = Number((performance.now() - startTime).toFixed(2));
    return {
      status: "INCORRECT_ABSTAIN",
      confidenceScore: 0.05,
      isOutOfDomain: true,
      isPromptInjection: false,
      quarantinedCount: 0,
      statusBadge: "ABSTAIN: OUT-OF-DOMAIN",
      reason: "Pertanyaan berada di luar domain Laporan Tahunan Perbankan BEI. FIN-CRAG menolak menjawab untuk mencegah halusinasi non-keuangan.",
      executionTimeMs,
      log: `[Agent 4: CRAG Auditor] Kueri berada di luar domain perbankan ('${query}'). Guardrail mengeksekusi ABSTAIN (Skor: 0.05).`,
    };
  }

  // 3. Evaluasi Tingkat Keyakinan Bukti (Confidence Grading - Yan et al., 2024)
  const topCandidate = candidates[0];
  const topScore = topCandidate ? topCandidate.scores.totalScore : 0;
  
  // Guardrail Overlap Bukti: jika bukti tidak memiliki kecocokan leksikal sama sekali dengan kueri
  const hasZeroOverlap = !topCandidate || (topCandidate.scores.f1_bm25 <= 0 && topCandidate.scores.f4_term_coverage <= 0);
  const confidenceScore = hasZeroOverlap ? 0.0 : Number(topScore.toFixed(4));

  let status: CRAGStatus = "INCORRECT_ABSTAIN";
  let statusBadge = "ABSTAIN: BUKTI TIDAK MEMADAI";
  let reason = "Bukti dalam laporan tahunan tidak cukup kuat untuk menjawab klaim angka ini secara terverifikasi.";

  if (!hasZeroOverlap && confidenceScore >= 0.25) {
    status = "CORRECT";
    statusBadge = "CORRECT (Bukti Kuat & Terverifikasi)";
    reason = "Bukti dokumen memiliki skor relevansi dan kepadatan rasio tinggi. Aman untuk dilanjutkan ke sintesis jawaban bersitasi.";
  } else if (!hasZeroOverlap && confidenceScore >= 0.15) {
    status = "AMBIGUOUS";
    statusBadge = "AMBIGUOUS (Keterbatasan Bukti)";
    reason = "Kandidat bukti memiliki relevansi parsial. Jawaban disintesis dengan catatan peringatan keterbatasan data laporan.";
  }

  const executionTimeMs = Number((performance.now() - startTime).toFixed(2));
  const log = `[Agent 4: CRAG Auditor] Confidence Grading: ${status} (Skor: ${confidenceScore}) | Status: ${statusBadge}`;

  return {
    status,
    confidenceScore,
    isOutOfDomain: false,
    isPromptInjection: false,
    quarantinedCount: 0,
    statusBadge,
    reason,
    executionTimeMs,
    log,
  };
}
