import { BM25Engine } from "../stki/bm25";
import { LSIEngine } from "../stki/lsi";
import { rerankFinancialCandidates, RerankerOptions } from "../stki/reranker";
import { tokenize } from "../stki/tokenizer";
import { Agent3Result, ChunkItem, RerankedCandidate } from "../types";

export function runAgent3FinancialScorer(
  candidateRRF: { chunk_id: string; rank: number; rrf_score: number }[],
  chunkMap: Map<string, ChunkItem>,
  query: string,
  bm25Engine: BM25Engine,
  lsiEngine: LSIEngine,
  targetBank?: string | null,
  options?: RerankerOptions
): Agent3Result {
  const startTime = performance.now();
  const queryTokens = tokenize(query);

  const candidateIds = candidateRRF.map((c) => c.chunk_id);
  const rrfScoreMap = new Map<string, number>();
  for (const c of candidateRRF) {
    rrfScoreMap.set(c.chunk_id, c.rrf_score);
  }

  const reranked = rerankFinancialCandidates(
    candidateIds,
    chunkMap,
    queryTokens,
    bm25Engine,
    lsiEngine,
    rrfScoreMap,
    {
      targetBank,
      disableNumericDensity: options?.disableNumericDensity,
    }
  );

  // Ambil Top-5 kandidat bukti terbaik dan sematkan nomor sitasi [1], [2], ...
  const topCandidates: RerankedCandidate[] = reranked.slice(0, 5).map((item, idx) => ({
    ...item,
    citationId: idx + 1,
  }));

  const executionTimeMs = Number((performance.now() - startTime).toFixed(2));
  const topScore = topCandidates[0]?.scores.totalScore || 0;
  const log = `[Agent 3: Financial Scorer] Reranking 6-Fitur FinQA selesai | Skor Tertinggi: ${topScore.toFixed(4)} | Terpilih ${topCandidates.length} bukti terverifikasi`;

  return {
    candidates: topCandidates,
    executionTimeMs,
    log,
  };
}
