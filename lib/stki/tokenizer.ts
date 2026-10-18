/**
 * Tokenizer Khusus Domain Perbankan & Finansial Indonesia
 * Mempertahankan angka, persentase, bps, singkatan rasio, dan kode emiten
 */

const STOPWORDS_ID = new Set([
  "yang", "di", "dan", "dari", "untuk", "pada", "adalah", "ini", "itu", "atau",
  "dengan", "oleh", "dalam", "ke", "sebagai", "akan", "telah", "bisa", "dapat",
  "juga", "ada", "karena", "tentang", "kepada", "saat", "bahwa", "serta", "secara",
  "kami", "mereka", "kita", "ia", "dia", "hal", "para", "namun", "seperti"
]);

export function tokenize(text: string): string[] {
  if (!text) return [];

  // 1. Lowercase
  const lower = text.toLowerCase();

  // 2. Normalisasi format angka dan simbol finansial
  // Contoh: Rp 12,5 Triliun -> rp 12.5 triliun
  const normalized = lower
    .replace(/rp\.?/g, " rp ")
    .replace(/(\d+),(\d+)/g, "$1.$2") // ubah koma desimal ke titik
    .replace(/[^a-z0-9%.\s]/g, " ");

  // 3. Pemisahan token berdasarkan whitespace
  const rawTokens = normalized.split(/\s+/).filter(Boolean);

  // 4. Filter stopwords umum (kecuali jika token adalah angka atau istilah finansial)
  const tokens: string[] = [];
  for (const t of rawTokens) {
    if (t.length <= 1 && !/\d/.test(t)) continue;
    if (STOPWORDS_ID.has(t)) continue;
    tokens.push(t);
  }

  return tokens;
}

export function extractFinancialTerms(text: string): {
  ratios: string[];
  numbers: string[];
  currencies: string[];
} {
  const ratios: string[] = [];
  const numbers: string[] = [];
  const currencies: string[] = [];

  const ratioMatches = text.match(/\b(car|npl|roe|roa|nim|casa|bopo|ldr|lcr|nsfr|cir|dpk|umkm)\b/gi);
  if (ratioMatches) {
    ratios.push(...ratioMatches.map(r => r.toUpperCase()));
  }

  const numMatches = text.match(/\b\d+(\.\d+)?%|\b\d+(\.\d+)?\s*(bps|basis poin|triliun|miliar|juta)\b/gi);
  if (numMatches) {
    numbers.push(...numMatches);
  }

  const currMatches = text.match(/rp\s*[\d.,]+/gi);
  if (currMatches) {
    currencies.push(...currMatches);
  }

  return { ratios, numbers, currencies };
}
