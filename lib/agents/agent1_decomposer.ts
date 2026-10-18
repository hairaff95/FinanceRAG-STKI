import { Agent1Result, QueryMode } from "../types";

const BANK_ALIASES: { [code: string]: string[] } = {
  BBCA: ["BBCA", "BCA", "CENTRAL ASIA", "BANK CENTRAL ASIA"],
  BBRI: ["BBRI", "BRI", "RAKYAT INDONESIA", "BANK RAKYAT INDONESIA"],
  BMRI: ["BMRI", "MANDIRI", "BANK MANDIRI"],
  BBNI: ["BBNI", "BNI", "NEGARA INDONESIA", "BANK NEGARA INDONESIA"],
};

const BANKING_SYNONYMS: { [key: string]: string[] } = {
  "dana murah": ["casa", "giro", "tabungan"],
  "casa": ["dana murah", "giro", "tabungan"],
  "kredit bermasalah": ["npl", "non performing loan", "kredit macet", "kolektibilitas"],
  "kualitas aset": ["npl", "lar", "ckpn", "kredit macet"],
  "npl": ["kredit bermasalah", "non performing loan", "kolektibilitas"],
  "modal": ["car", "capital adequacy ratio", "kpmm", "ekuitas"],
  "kecukupan modal": ["car", "kpmm", "tier 1", "atmr"],
  "car": ["kecukupan modal", "kpmm", "tier 1"],
  "profitabilitas": ["laba bersih", "roe", "roa", "nim", "keuntungan"],
  "keuntungan": ["laba bersih", "laba tahun berjalan", "pendapatan bunga"],
  "laba": ["laba bersih", "laba komprehensif", "laba tahun berjalan"],
  "efisiensi": ["bopo", "cost to income", "cir", "beban operasional"],
  "bopo": ["efisiensi operasional", "beban operasional terhadap pendapatan operasional"],
  "likuiditas": ["ldr", "loan to deposit ratio", "lcr", "dpk"],
  "ldr": ["likuiditas", "rasio pinjaman terhadap simpanan"],
  "kredit umkm": ["umkm", "kredit mikro", "kur", "usaha rakyat"],
  "umkm": ["kredit mikro", "ritel", "kur"],
  "nim": ["net interest margin", "margin bunga bersih"],
  "roe": ["return on equity", "imbal hasil ekuitas"],
  "roa": ["return on assets", "imbal hasil aset"],
};

export function runAgent1TickerDecomposer(query: string, manualBankFilter?: string | null): Agent1Result {
  const startTime = performance.now();
  const qUpper = query.toUpperCase();

  // 1. Deteksi Entitas Kode Saham / Nama Bank
  const detected: string[] = [];

  if (manualBankFilter && manualBankFilter !== "ALL") {
    detected.push(manualBankFilter);
  } else {
    for (const [code, aliases] of Object.entries(BANK_ALIASES)) {
      for (const alias of aliases) {
        const regex = new RegExp(`\\b${alias}\\b`, "i");
        if (regex.test(qUpper)) {
          detected.push(code);
          break;
        }
      }
    }
  }

  // 2. Tentukan Mode Kueri
  let mode: QueryMode = "SECTOR-WIDE";
  if (detected.length === 1) {
    mode = "SINGLE-EMITEN";
  } else if (detected.length >= 2) {
    mode = "MULTI-BANK-HEAD-TO-HEAD";
  }

  // 3. Ekspansi Kueri dengan Kamus Sinonim Perbankan (STKI M9-M11)
  const qLower = query.toLowerCase();
  const addedSynonyms: string[] = [];

  for (const [key, synonyms] of Object.entries(BANKING_SYNONYMS)) {
    if (qLower.includes(key)) {
      for (const syn of synonyms) {
        if (!qLower.includes(syn) && !addedSynonyms.includes(syn)) {
          addedSynonyms.push(syn);
        }
      }
    }
  }

  const expandedQuery = addedSynonyms.length > 0 
    ? `${query} ${addedSynonyms.join(" ")}` 
    : query;

  const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

  const log = `[Agent 1: Decomposer] Mode: ${mode} | Deteksi: [${detected.join(", ") || "Semua Bank"}] | Ekspansi (${addedSynonyms.length}): ${addedSynonyms.join(", ") || "Nihil"}`;

  return {
    detectedBanks: detected,
    mode,
    expandedTerms: addedSynonyms,
    originalQuery: query,
    expandedQuery,
    executionTimeMs,
    log,
  };
}
