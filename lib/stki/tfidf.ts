import { ChunkItem } from "../types";
import { tokenize } from "./tokenizer";

export class TFIDFEngine {
  private corpus: ChunkItem[] = [];
  private docVectors: Map<string, Map<string, number>> = new Map();
  private docNorms: Map<string, number> = new Map();
  private idfMap: Map<string, number> = new Map();

  constructor(corpus: ChunkItem[]) {
    this.buildIndex(corpus);
  }

  public buildIndex(corpus: ChunkItem[]): void {
    this.corpus = corpus;
    this.docVectors.clear();
    this.docNorms.clear();
    this.idfMap.clear();

    const N = corpus.length;
    if (N === 0) return;

    // 1. Hitung Document Frequency (DF)
    const dfMap: Map<string, number> = new Map();
    const docTfMap: Map<string, Map<string, number>> = new Map();

    for (const chunk of corpus) {
      const tokens = tokenize(chunk.text);
      const tf: Map<string, number> = new Map();

      for (const t of tokens) {
        tf.set(t, (tf.get(t) || 0) + 1);
      }
      docTfMap.set(chunk.chunk_id, tf);

      // Hitung DF (berapa dokumen yang memuat token t)
      for (const t of tf.keys()) {
        dfMap.set(t, (dfMap.get(t) || 0) + 1);
      }
    }

    // 2. Hitung IDF: log(1 + N / df)
    dfMap.forEach((df, term) => {
      this.idfMap.set(term, Math.log(1 + N / df));
    });

    // 3. Bangun vektor dokumen berbobot TF-IDF & norm-nya
    for (const chunk of corpus) {
      const cid = chunk.chunk_id;
      const tf = docTfMap.get(cid) || new Map();
      const vec: Map<string, number> = new Map();
      let sumSq = 0;

      tf.forEach((count, term) => {
        const idf = this.idfMap.get(term) || 0;
        const weight = (1 + Math.log(count)) * idf;
        vec.set(term, weight);
        sumSq += weight * weight;
      });

      this.docVectors.set(cid, vec);
      this.docNorms.set(cid, Math.sqrt(sumSq));
    }
  }

  public search(
    queryTokens: string[],
    filterKodeBank?: string | null,
    topK: number = 15
  ): { chunk_id: string; score: number; rank: number }[] {
    if (queryTokens.length === 0 || this.corpus.length === 0) return [];

    // 1. Buat vektor kueri
    const qTf: Map<string, number> = new Map();
    for (const t of queryTokens) {
      qTf.set(t, (qTf.get(t) || 0) + 1);
    }

    const qVec: Map<string, number> = new Map();
    let qSumSq = 0;

    qTf.forEach((count, term) => {
      const idf = this.idfMap.get(term) || 0;
      if (idf > 0) {
        const weight = (1 + Math.log(count)) * idf;
        qVec.set(term, weight);
        qSumSq += weight * weight;
      }
    });

    const qNorm = Math.sqrt(qSumSq);
    if (qNorm === 0) return [];

    // 2. Hitung Cosine Similarity terhadap seluruh dokumen
    const scores: { chunk_id: string; score: number }[] = [];

    for (const chunk of this.corpus) {
      if (filterKodeBank && chunk.metadata.kode_bank !== filterKodeBank) {
        continue;
      }

      const cid = chunk.chunk_id;
      const dVec = this.docVectors.get(cid);
      const dNorm = this.docNorms.get(cid) || 0;

      if (!dVec || dNorm === 0) continue;

      let dotProduct = 0;
      qVec.forEach((qWeight, term) => {
        const dWeight = dVec.get(term);
        if (dWeight !== undefined) {
          dotProduct += qWeight * dWeight;
        }
      });

      const cosine = dotProduct / (qNorm * dNorm);
      if (cosine > 0) {
        scores.push({
          chunk_id: cid,
          score: Number(cosine.toFixed(4)),
        });
      }
    }

    scores.sort((a, b) => b.score - a.score);

    return scores.slice(0, topK).map((item, idx) => ({
      chunk_id: item.chunk_id,
      score: item.score,
      rank: idx + 1,
    }));
  }
}
