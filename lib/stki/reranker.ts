import { ChunkItem, RerankedCandidate, ScoreBreakdown } from "../types";
import { BM25Engine } from "./bm25";
import { LSIEngine } from "./lsi";
import { tokenize } from "./tokenizer";

export interface RerankerOptions {
  disableNumericDensity?: boolean; // Untuk studi ablasi M8
  targetBank?: string | null;
}

export function rerankFinancialCandidates(
  candidateIds: string[],
  chunkMap: Map<string, ChunkItem>,
  queryTokens: string[],
  bm25Engine: BM25Engine,
  lsiEngine: LSIEngine,
  rrfScoreMap: Map<string, number>,
  options: RerankerOptions = {}
): RerankedCandidate[] {
  if (candidateIds.length === 0) return [];

  // 1. Ekstrak skor mentah untuk setiap kandidat
  const rawData: {
    chunk: ChunkItem;
    bm25: number;
    lsi: number;
    rrf: number;
    termCoverage: number;
    numericDensity: number;
    priorityBoost: number;
  }[] = [];

  let maxBm25 = 0.0001;
  let maxRrf = 0.0001;

  for (const cid of candidateIds) {
    const chunk = chunkMap.get(cid);
    if (!chunk) continue;

    const bm25Score = bm25Engine.getRawScore(cid, queryTokens);
    const lsiScore = Math.max(0, lsiEngine.getRawScore(cid, queryTokens));
    const rrfScore = rrfScoreMap.get(cid) || 0;

    if (bm25Score > maxBm25) maxBm25 = bm25Score;
    if (rrfScore > maxRrf) maxRrf = rrfScore;

    // F4: Query Term Coverage (Berapa persen kata kueri yang muncul di teks chunk)
    const chunkTokens = new Set(tokenize(chunk.text));
    let matchedTerms = 0;
    for (const qt of queryTokens) {
      if (chunkTokens.has(qt)) matchedTerms++;
    }
    const termCoverage = queryTokens.length > 0 ? matchedTerms / queryTokens.length : 0;

    // F5: Financial Numeric & Ratio Density (FinQA)
    // Hitung kemunculan simbol %, bps, triliun, miliar, rp, serta digit angka
    const textToAnalyze = chunk.raw_text;
    const numMatches = textToAnalyze.match(/\b\d+(\.\d+)?%|\b\d+(\.\d+)?\s*(bps|triliun|miliar|juta)\b|rp\s*[\d.,]+|\b\d{2,}\b/gi);
    const countNumeric = numMatches ? numMatches.length : 0;
    // Normalisasi density: 10 angka dalam satu chunk dianggap saturasi penuh (1.0)
    const numericDensity = Math.min(1.0, countNumeric / 10);

    // F6: Emiten & Bab Priority Boost
    let priorityBoost = 0.0;
    const babLower = chunk.metadata.bab.toLowerCase();
    if (babLower.includes("ikhtisar") || babLower.includes("rasio")) {
      priorityBoost += 0.6;
    } else if (babLower.includes("md&a") || babLower.includes("analisis") || babLower.includes("pembahasan")) {
      priorityBoost += 0.4;
    }
    if (options.targetBank && chunk.metadata.kode_bank === options.targetBank) {
      priorityBoost += 0.4;
    }
    priorityBoost = Math.min(1.0, priorityBoost);

    rawData.push({
      chunk,
      bm25: bm25Score,
      lsi: lsiScore,
      rrf: rrfScore,
      termCoverage,
      numericDensity,
      priorityBoost,
    });
  }

  // 2. Tentukan pembobotan fitur (6-Fitur FinQA)
  // Default: W1=0.25, W2=0.25, W3=0.20, W4=0.15, W5=0.10, W6=0.05
  let w1 = 0.25;
  let w2 = 0.25;
  const w3 = 0.20;
  const w4 = 0.15;
  let w5 = 0.10;
  const w6 = 0.05;

  if (options.disableNumericDensity) {
    // Studi ablasi: Matikan bobot W5 dan distribusikan ke leksikal & laten
    w5 = 0.0;
    w1 += 0.05;
    w2 += 0.05;
  }

  // 3. Hitung skor gabungan akhir
  const rerankedList: { chunk: ChunkItem; scores: ScoreBreakdown; totalScore: number }[] = [];

  for (const item of rawData) {
    const f1 = item.bm25 / maxBm25;
    const f2 = Math.min(1.0, item.lsi);
    const f3 = item.rrf / maxRrf;
    const f4 = item.termCoverage;
    const f5 = item.numericDensity;
    const f6 = item.priorityBoost;

    const total = w1 * f1 + w2 * f2 + w3 * f3 + w4 * f4 + w5 * f5 + w6 * f6;

    rerankedList.push({
      chunk: item.chunk,
      scores: {
        f1_bm25: Number((w1 * f1).toFixed(4)),
        f2_lsi: Number((w2 * f2).toFixed(4)),
        f3_rrf: Number((w3 * f3).toFixed(4)),
        f4_term_coverage: Number((w4 * f4).toFixed(4)),
        f5_numeric_density: Number((w5 * f5).toFixed(4)),
        f6_priority_boost: Number((w6 * f6).toFixed(4)),
        totalScore: Number(total.toFixed(4)),
      },
      totalScore: total,
    });
  }

  rerankedList.sort((a, b) => b.totalScore - a.totalScore);

  return rerankedList.map((item, idx) => ({
    rank: idx + 1,
    chunk: item.chunk,
    scores: item.scores,
  }));
}
