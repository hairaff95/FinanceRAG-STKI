export interface ChunkMetadata {
  kode_bank: string;
  nama_bank: string;
  tahun: number;
  halaman: number;
  bab: string;
  sumber_file: string;
}

export interface ChunkItem {
  chunk_id: string;
  text: string;     // full_text with metadata header
  raw_text: string; // original raw text
  metadata: ChunkMetadata;
}

export type QueryMode = "SINGLE-EMITEN" | "MULTI-BANK-HEAD-TO-HEAD" | "SECTOR-WIDE";

export interface Agent1Result {
  detectedBanks: string[];
  mode: QueryMode;
  expandedTerms: string[];
  originalQuery: string;
  expandedQuery: string;
  executionTimeMs: number;
  log: string;
}

export interface CandidateRank {
  chunk_id: string;
  rank: number;
  score: number;
}

export interface Agent2Result {
  topLexical: CandidateRank[];
  topLatent: CandidateRank[];
  topRRF: { chunk_id: string; rank: number; rrf_score: number }[];
  executionTimeMs: number;
  log: string;
}

export interface ScoreBreakdown {
  f1_bm25: number;          // 25%
  f2_lsi: number;           // 25%
  f3_rrf: number;           // 20%
  f4_term_coverage: number; // 15%
  f5_numeric_density: number; // 10%
  f6_priority_boost: number;  // 5%
  totalScore: number;
}

export interface RerankedCandidate {
  rank: number;
  chunk: ChunkItem;
  scores: ScoreBreakdown;
  citationId?: number;
}

export interface Agent3Result {
  candidates: RerankedCandidate[];
  executionTimeMs: number;
  log: string;
}

export type CRAGStatus = "CORRECT" | "AMBIGUOUS" | "INCORRECT_ABSTAIN";

export interface Agent4Result {
  status: CRAGStatus;
  confidenceScore: number;
  isOutOfDomain: boolean;
  isPromptInjection: boolean;
  quarantinedCount: number;
  statusBadge: string;
  reason: string;
  executionTimeMs: number;
  log: string;
}

export interface CitationItem {
  citationNumber: number;
  chunk_id: string;
  kode_bank: string;
  nama_bank: string;
  halaman: number;
  bab: string;
  snippet: string;
}

export interface Agent5Result {
  citedSummary: string;
  citations: CitationItem[];
  engineUsed: "Extractive Financial Synthesizer" | "Local Ollama LLM";
  executionTimeMs: number;
  log: string;
}

export interface FINCRAGResponse {
  query: string;
  selectedBank: string | null;
  agent1: Agent1Result;
  agent2: Agent2Result;
  agent3: Agent3Result;
  agent4: Agent4Result;
  agent5: Agent5Result;
  totalLatencyMs: number;
  timestamp: string;
}

// Untuk IR Comparison (Workspace 2)
export interface IRComparisonResult {
  query: string;
  tfidf: { rank: number; chunk: ChunkItem; score: number }[];
  bm25: { rank: number; chunk: ChunkItem; score: number }[];
  lsi: { rank: number; chunk: ChunkItem; score: number }[];
  rrf: { rank: number; chunk: ChunkItem; score: number }[];
  reranker: { rank: number; chunk: ChunkItem; score: number; scores: ScoreBreakdown }[];
  executionTimeMs: number;
}

// Untuk Benchmark & Ablasi (Workspace 3)
export interface MetricScore {
  precisionAt5: number;
  recallAt5: number;
  map: number;
  mrr: number;
  ndcgAt5: number;
  abstentionAccuracy: number;
}

export interface BenchmarkReport {
  overall: MetricScore;
  withNumericDensity: MetricScore;
  withoutNumericDensity: MetricScore;
  deltaNDCG: number;
  deltaMRR: number;
  evaluatedQueriesCount: number;
}
