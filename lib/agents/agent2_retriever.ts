import { BM25Engine } from "../stki/bm25";
import { LSIEngine } from "../stki/lsi";
import { reciprocalRankFusion } from "../stki/rrf";
import { tokenize } from "../stki/tokenizer";
import { Agent2Result, CandidateRank } from "../types";

export function runAgent2HybridRetriever(
  expandedQuery: string,
  targetBank: string | null,
  bm25Engine: BM25Engine,
  lsiEngine: LSIEngine,
  topK: number = 20
): Agent2Result {
  const startTime = performance.now();
  const queryTokens = tokenize(expandedQuery);

  // 1. Pencarian Leksikal Okapi BM25 ( Robertson & Zaragoza, 2009 )
  const bm25Results = bm25Engine.search(queryTokens, targetBank, topK);
  const topLexical: CandidateRank[] = bm25Results.map((r) => ({
    chunk_id: r.chunk_id,
    rank: r.rank,
    score: r.score,
  }));

  // 2. Pencarian Semantik Ruang Laten LSI ( Deerwester et al., 1990 )
  const lsiResults = lsiEngine.search(queryTokens, targetBank, topK);
  const topLatent: CandidateRank[] = lsiResults.map((r) => ({
    chunk_id: r.chunk_id,
    rank: r.rank,
    score: r.score,
  }));

  // 3. Fusi Peringkat Hibrida RRF k=60 ( Cormack et al., 2009 )
  const topRRF = reciprocalRankFusion(topLexical, topLatent, 60, topK);

  const executionTimeMs = Number((performance.now() - startTime).toFixed(2));
  const log = `[Agent 2: Hybrid Retriever] Leksikal BM25: ${topLexical.length} kandidat | Semantik LSI: ${topLatent.length} kandidat | Fusi RRF (k=60): ${topRRF.length} kandidat`;

  return {
    topLexical,
    topLatent,
    topRRF,
    executionTimeMs,
    log,
  };
}
