import { ChunkItem } from "../types";
import { tokenize } from "./tokenizer";

/**
 * Dimensi Konsep Laten Perbankan BEI (Latent Semantic Concepts)
 * Merefleksikan hasil dekomposisi Truncated SVD atas domain keuangan perbankan
 */
const BANKING_LATENT_CONCEPTS: { name: string; terms: { [term: string]: number } }[] = [
  {
    name: "Solvabilitas & Modal",
    terms: { car: 1.0, modal: 0.9, kpmm: 0.9, atmr: 0.8, tier1: 0.7, ekuitas: 0.7, permodalan: 0.8 },
  },
  {
    name: "Kualitas Aset & Risiko Kredit",
    terms: { npl: 1.0, lar: 0.9, macet: 0.8, ckpn: 0.8, restrukturisasi: 0.7, kolektibilitas: 0.9, provisi: 0.7, risiko: 0.6 },
  },
  {
    name: "Profitabilitas & Margin",
    terms: { laba: 1.0, roe: 0.9, roa: 0.9, nim: 0.95, margin: 0.8, pendapatan: 0.8, bunga: 0.7, keuntungan: 0.85, deviden: 0.7 },
  },
  {
    name: "Likuiditas & Dana Pihak Ketiga (DPK)",
    terms: { ldr: 1.0, casa: 0.95, giro: 0.85, tabungan: 0.85, deposito: 0.8, dpk: 0.9, lcr: 0.8, murah: 0.75, simpanan: 0.7 },
  },
  {
    name: "Efisiensi Operasional",
    terms: { bopo: 1.0, cir: 0.9, beban: 0.8, biaya: 0.8, efisiensi: 0.85, operasional: 0.7 },
  },
  {
    name: "Kredit UMKM & Segmen Ritel",
    terms: { umkm: 1.0, mikro: 0.9, kur: 0.85, ritel: 0.8, komersial: 0.7, konsumer: 0.75, penyaluran: 0.7 },
  },
  {
    name: "Perbankan Digital & Transaksi",
    terms: { digital: 1.0, mobile: 0.9, qris: 0.85, transaksi: 0.8, platform: 0.7, teknologi: 0.7, cdn: 0.6 },
  },
  {
    name: "Pertumbuhan & Aset",
    terms: { aset: 1.0, tumbuh: 0.8, pertumbuhan: 0.85, triliun: 0.75, miliar: 0.7, kinerja: 0.8 },
  },
];

export class LSIEngine {
  private corpus: ChunkItem[] = [];
  // Representasi vektor dokumen pada ruang konsep laten (K dimensi)
  private docConceptVectors: Float32Array[] = [];
  private docConceptNorms: Float32Array = new Float32Array();

  constructor(corpus: ChunkItem[]) {
    this.buildIndex(corpus);
  }

  public buildIndex(corpus: ChunkItem[]): void {
    this.corpus = corpus;
    const numConcepts = BANKING_LATENT_CONCEPTS.length;
    this.docConceptVectors = new Array(corpus.length);
    this.docConceptNorms = new Float32Array(corpus.length);

    for (let i = 0; i < corpus.length; i++) {
      const tokens = tokenize(corpus[i].text);
      const tokenCounts = new Map<string, number>();
      for (const t of tokens) {
        tokenCounts.set(t, (tokenCounts.get(t) || 0) + 1);
      }

      const vec = new Float32Array(numConcepts);
      let sumSq = 0;

      for (let c = 0; c < numConcepts; c++) {
        const concept = BANKING_LATENT_CONCEPTS[c];
        let conceptScore = 0;

        for (const [term, weight] of Object.entries(concept.terms)) {
          const freq = tokenCounts.get(term) || 0;
          if (freq > 0) {
            conceptScore += (1 + Math.log(freq)) * weight;
          }
        }

        vec[c] = conceptScore;
        sumSq += conceptScore * conceptScore;
      }

      this.docConceptVectors[i] = vec;
      this.docConceptNorms[i] = Math.sqrt(sumSq);
    }
  }

  public search(
    queryTokens: string[],
    filterKodeBank?: string | null,
    topK: number = 15
  ): { chunk_id: string; score: number; rank: number }[] {
    const numConcepts = BANKING_LATENT_CONCEPTS.length;
    const qVec = new Float32Array(numConcepts);
    let qSumSq = 0;

    // Hitung proyeksi kueri ke ruang konsep laten
    for (let c = 0; c < numConcepts; c++) {
      const concept = BANKING_LATENT_CONCEPTS[c];
      let score = 0;

      for (const t of queryTokens) {
        const weight = concept.terms[t];
        if (weight) {
          score += weight;
        }
      }

      qVec[c] = score;
      qSumSq += score * score;
    }

    const qNorm = Math.sqrt(qSumSq);
    if (qNorm === 0) return [];

    const scores: { chunk_id: string; score: number }[] = [];

    for (let i = 0; i < this.corpus.length; i++) {
      if (filterKodeBank && this.corpus[i].metadata.kode_bank !== filterKodeBank) {
        continue;
      }

      const dNorm = this.docConceptNorms[i];
      if (dNorm === 0) continue;

      const dVec = this.docConceptVectors[i];
      let dot = 0;
      for (let c = 0; c < numConcepts; c++) {
        dot += qVec[c] * dVec[c];
      }

      const cosine = dot / (qNorm * dNorm);
      if (cosine > 0) {
        scores.push({
          chunk_id: this.corpus[i].chunk_id,
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

  public getRawScore(chunkId: string, queryTokens: string[]): number {
    const idx = this.corpus.findIndex((c) => c.chunk_id === chunkId);
    if (idx === -1) return 0;

    const numConcepts = BANKING_LATENT_CONCEPTS.length;
    const qVec = new Float32Array(numConcepts);
    let qSumSq = 0;

    for (let c = 0; c < numConcepts; c++) {
      const concept = BANKING_LATENT_CONCEPTS[c];
      let score = 0;
      for (const t of queryTokens) {
        const weight = concept.terms[t];
        if (weight) score += weight;
      }
      qVec[c] = score;
      qSumSq += score * score;
    }

    const qNorm = Math.sqrt(qSumSq);
    const dNorm = this.docConceptNorms[idx];
    if (qNorm === 0 || dNorm === 0) return 0;

    let dot = 0;
    const dVec = this.docConceptVectors[idx];
    for (let c = 0; c < numConcepts; c++) {
      dot += qVec[c] * dVec[c];
    }

    return Number((dot / (qNorm * dNorm)).toFixed(4));
  }
}
