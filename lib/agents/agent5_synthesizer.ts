import { Agent4Result, Agent5Result, CitationItem, RerankedCandidate } from "../types";

export interface SynthesizerOptions {
  useOllama?: boolean;
  ollamaModel?: string;
  ollamaEndpoint?: string;
}

export async function runAgent5Synthesizer(
  query: string,
  candidates: RerankedCandidate[],
  agent4Result: Agent4Result,
  options: SynthesizerOptions = {}
): Promise<Agent5Result> {
  const startTime = performance.now();

  // 1. Jika Agen 4 memutuskan ABSTAIN, sistem menolak menjawab demi kepatuhan audit
  if (agent4Result.status === "INCORRECT_ABSTAIN") {
    const executionTimeMs = Number((performance.now() - startTime).toFixed(2));
    let abstentionMessage = "";

    if (agent4Result.isPromptInjection) {
      abstentionMessage = `PERINGATAN AUDIT CRAG: Kueri Anda atau bukti dokumen terindikasi mengandung instruksi manipulasi (Prompt Injection). Sistem mengkarantina proses ini dan menolak merespons untuk menjaga keandalan data finansial.`;
    } else if (agent4Result.isOutOfDomain) {
      abstentionMessage = `PENOLAKAN KUERI (ABSTAIN): Pertanyaan "${query}" terdeteksi berada di luar lingkup domain analisis Laporan Tahunan Perbankan BEI (BBCA, BBRI, BMRI, BBNI). FIN-CRAG hanya memproses pertanyaan seputar kinerja finansial, rasio, dan strategi perbankan resmi demi mencegah halusinasi.`;
    } else {
      abstentionMessage = `BUKTI TIDAK MEMADAI (ABSTAIN): Sistem tidak menemukan bukti yang cukup kuat pada korpus Laporan Tahunan 2025 untuk menjawab pertanyaan Anda dengan tingkat keyakinan yang dapat dipertanggungjawabkan (Skor Keyakinan: ${agent4Result.confidenceScore} < 0.15).`;
    }

    return {
      citedSummary: abstentionMessage,
      citations: [],
      engineUsed: "Extractive Financial Synthesizer",
      executionTimeMs,
      log: `[Agent 5: Synthesizer] Eksekusi dihentikan oleh guardrail Agen 4 (${agent4Result.statusBadge}). Abstention response disajikan.`,
    };
  }

  // 2. Siapkan data sitasi dari Top kandidat
  const citations: CitationItem[] = candidates.slice(0, 4).map((c, idx) => ({
    citationNumber: idx + 1,
    chunk_id: c.chunk.chunk_id,
    kode_bank: c.chunk.metadata.kode_bank,
    nama_bank: c.chunk.metadata.nama_bank,
    halaman: c.chunk.metadata.halaman,
    bab: c.chunk.metadata.bab,
    snippet: c.chunk.raw_text.slice(0, 200).replace(/\n+/g, " ") + "...",
  }));

  // 3. Coba Sintesis via Local Ollama jika diaktifkan
  if (options.useOllama) {
    try {
      const endpoint = options.ollamaEndpoint || "http://127.0.0.1:11434/api/generate";
      const model = options.ollamaModel || "llama3";

      const contextText = candidates
        .slice(0, 3)
        .map(
          (c, idx) =>
            `[Sitasi ${idx + 1}] (${c.chunk.metadata.kode_bank} Hal. ${c.chunk.metadata.halaman} - ${c.chunk.metadata.bab}):\n${c.chunk.raw_text}`
        )
        .join("\n\n");

      const prompt = `Anda adalah Analis Finansial Senior Pasar Modal BEI. Berdasarkan bukti Laporan Tahunan resmi berikut, jawab pertanyaan pengguna secara objektif dalam Bahasa Indonesia.
WAJIB menyertakan nomor sitasi ([1], [2], dst) di setiap klaim angka atau rasio.
Jika ada keterbatasan data, sampaikan secara transparan.

BUKTI TERVERIFIKASI:
${contextText}

PERTANYAAN: ${query}

JAWABAN ANALISIS BERSITASI:`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 detik timeout

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt, stream: false }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        const citedSummary = json.response;
        const executionTimeMs = Number((performance.now() - startTime).toFixed(2));
        return {
          citedSummary,
          citations,
          engineUsed: "Local Ollama LLM",
          executionTimeMs,
          log: `[Agent 5: Synthesizer] Sintesis berhasil menggunakan model lokal Ollama (${model}) dengan ${citations.length} rujukan sitasi.`,
        };
      }
    } catch (err) {
      console.warn("[FIN-CRAG] Ollama tidak merespons, beralih ke Extractive Financial Synthesizer:", err);
    }
  }

  // 4. Extractive Financial Synthesizer (Mandiri & Instan di Vercel Serverless)
  const paragraphs: string[] = [];

  // Peringatan jika status AMBIGUOUS
  if (agent4Result.status === "AMBIGUOUS") {
    paragraphs.push(
      `> Catatan Audit Keterbatasan Bukti: Pertanyaan ini diproses dengan tingkat keyakinan sedang (${agent4Result.confidenceScore}). Temuan di bawah dirangkum dari bagian laporan yang relevan namun disarankan memeriksa halaman asli PDF.`
    );
  }

  // Rangkum temuan per emiten dari bukti terbaik
  const emitenGroups = new Map<string, RerankedCandidate[]>();
  for (const c of candidates) {
    const bank = c.chunk.metadata.kode_bank;
    if (!emitenGroups.has(bank)) {
      emitenGroups.set(bank, []);
    }
    emitenGroups.get(bank)!.push(c);
  }

  emitenGroups.forEach((bankCandidates, bankCode) => {
    const firstCand = bankCandidates[0];
    const meta = firstCand.chunk.metadata;

    // Ambil kalimat-kalimat yang memuat rasio atau angka
    const rawLines = firstCand.chunk.raw_text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 25);

    const keyFacts = rawLines.slice(0, 3).join("; ");

    paragraphs.push(
      `### Analisis Kinerja ${bankCode} (${meta.nama_bank})\n` +
      `Berdasarkan Laporan Tahunan 2025 Bab **${meta.bab}** (Halaman ${meta.halaman}) [${firstCand.citationId}]:\n\n` +
      `"${keyFacts || firstCand.chunk.raw_text.slice(0, 280)}..." [${firstCand.citationId}]`
    );
  });

  paragraphs.push(
    `\n---\n*Rangkuman di atas disintesis secara deterministik oleh **Extractive Financial Synthesizer** dengan memprioritaskan dokumen ber-skor FinQA tertinggi. Seluruh klaim dapat diverifikasi langsung pada Kartu Bukti di bawah.*`
  );

  const citedSummary = paragraphs.join("\n\n");
  const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

  return {
    citedSummary,
    citations,
    engineUsed: "Extractive Financial Synthesizer",
    executionTimeMs,
    log: `[Agent 5: Synthesizer] Sintesis ekstraktif bersitasi selesai (${candidates.length} kandidat) dalam ${executionTimeMs} ms.`,
  };
}
