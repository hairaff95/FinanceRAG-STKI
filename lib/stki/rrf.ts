import { CandidateRank } from "../types";

/**
 * Reciprocal Rank Fusion (RRF) - Cormack, Clarke, & Buettcher (2009)
 * Menggabungkan daftar peringkat dari leksikal (BM25) dan semantik laten (LSI).
 * Nilai default konstanta k = 60 sesuai standar literatur SIGIR.
 */
export function reciprocalRankFusion(
  lexicalRanks: CandidateRank[],
  latentRanks: CandidateRank[],
  k: number = 60,
  topK: number = 15
): { chunk_id: string; rank: number; rrf_score: number }[] {
  const rrfMap: Map<string, number> = new Map();

  // Fusi peringkat BM25
  for (const item of lexicalRanks) {
    const current = rrfMap.get(item.chunk_id) || 0;
    rrfMap.set(item.chunk_id, current + 1.0 / (k + item.rank));
  }

  // Fusi peringkat LSI
  for (const item of latentRanks) {
    const current = rrfMap.get(item.chunk_id) || 0;
    rrfMap.set(item.chunk_id, current + 1.0 / (k + item.rank));
  }

  const sorted = Array.from(rrfMap.entries())
    .map(([chunk_id, rrf_score]) => ({
      chunk_id,
      rrf_score: Number(rrf_score.toFixed(6)),
    }))
    .sort((a, b) => b.rrf_score - a.rrf_score);

  return sorted.slice(0, topK).map((item, idx) => ({
    chunk_id: item.chunk_id,
    rank: idx + 1,
    rrf_score: item.rrf_score,
  }));
}
