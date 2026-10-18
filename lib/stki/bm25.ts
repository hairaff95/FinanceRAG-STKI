import { ChunkItem } from "../types";
import { tokenize } from "./tokenizer";

export interface Posting {
  docIndex: number;
  freq: number;
}

export class BM25Engine {
  private k1: number = 1.5;
  private b: number = 0.75;
  private corpus: ChunkItem[] = [];
  private docLengths: number[] = [];
  private avgdl: number = 0;
  private invertedIndex: Map<string, Posting[]> = new Map();
  private docIdMap: Map<string, number> = new Map();

  constructor(corpus: ChunkItem[], k1: number = 1.5, b: number = 0.75) {
    this.k1 = k1;
    this.b = b;
    this.buildIndex(corpus);
  }

  public buildIndex(corpus: ChunkItem[]): void {
    this.corpus = corpus;
    this.docLengths = new Array(corpus.length);
    this.invertedIndex.clear();
    this.docIdMap.clear();

    let totalLength = 0;

    for (let i = 0; i < corpus.length; i++) {
      const chunk = corpus[i];
      this.docIdMap.set(chunk.chunk_id, i);

      // Gunakan chunk.text yang sudah memuat header metadata
      const tokens = tokenize(chunk.text);
      this.docLengths[i] = tokens.length;
      totalLength += tokens.length;

      // Hitung term frequency dalam dokumen
      const tfMap: Map<string, number> = new Map();
      for (const t of tokens) {
        tfMap.set(t, (tfMap.get(t) || 0) + 1);
      }

      // Masukkan ke Inverted Index
      tfMap.forEach((freq, term) => {
        let postings = this.invertedIndex.get(term);
        if (!postings) {
          postings = [];
          this.invertedIndex.set(term, postings);
        }
        postings.push({ docIndex: i, freq });
      });
    }

    this.avgdl = corpus.length > 0 ? totalLength / corpus.length : 0;
  }

  public search(
    queryTokens: string[],
    filterKodeBank?: string | null,
    topK: number = 15
  ): { chunk_id: string; score: number; rank: number }[] {
    const N = this.corpus.length;
    if (N === 0 || queryTokens.length === 0) return [];

    const scores = new Float32Array(N);

    // Iterasi setiap kata kunci kueri
    for (const term of queryTokens) {
      const postings = this.invertedIndex.get(term);
      if (!postings) continue;

      const n_q = postings.length;
      // Rumus Robertson-Sparck Jones IDF
      const idf = Math.log((N - n_q + 0.5) / (n_q + 0.5) + 1);

      for (const p of postings) {
        const i = p.docIndex;
        // Terapkan filter kode bank jika ada
        if (filterKodeBank && this.corpus[i].metadata.kode_bank !== filterKodeBank) {
          continue;
        }

        const tf = p.freq;
        const dl = this.docLengths[i];
        const numerator = tf * (this.k1 + 1);
        const denominator = tf + this.k1 * (1 - this.b + this.b * (dl / this.avgdl));
        scores[i] += idf * (numerator / denominator);
      }
    }

    // Ambil dokumen dengan skor positif
    const results: { chunk_id: string; score: number }[] = [];
    for (let i = 0; i < N; i++) {
      if (scores[i] > 0) {
        results.push({
          chunk_id: this.corpus[i].chunk_id,
          score: scores[i],
        });
      }
    }

    results.sort((a, b) => b.score - a.score);

    return results.slice(0, topK).map((item, idx) => ({
      chunk_id: item.chunk_id,
      score: Number(item.score.toFixed(4)),
      rank: idx + 1,
    }));
  }

  public getRawScore(chunkId: string, queryTokens: string[]): number {
    const idx = this.docIdMap.get(chunkId);
    if (idx === undefined) return 0;

    const N = this.corpus.length;
    let totalScore = 0;

    for (const term of queryTokens) {
      const postings = this.invertedIndex.get(term);
      if (!postings) continue;

      const p = postings.find((post) => post.docIndex === idx);
      if (!p) continue;

      const n_q = postings.length;
      const idf = Math.log((N - n_q + 0.5) / (n_q + 0.5) + 1);
      const tf = p.freq;
      const dl = this.docLengths[idx];
      const numerator = tf * (this.k1 + 1);
      const denominator = tf + this.k1 * (1 - this.b + this.b * (dl / this.avgdl));
      totalScore += idf * (numerator / denominator);
    }

    return totalScore;
  }
}
