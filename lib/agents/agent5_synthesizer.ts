import { Agent4Result, Agent5Result, CitationItem, RerankedCandidate } from "../types";

export interface SynthesizerOptions {
  useOllama?: boolean;
  ollamaModel?: string;
  ollamaEndpoint?: string;
}

interface ExtractedRatio {
  name: string;
  value: string;
  citationId: number;
}

interface CleanSentence {
  text: string;
  citationId: number;
  halaman: number;
  bab: string;
  score: number;
}

/**
 * Normalisasi teks mentah PDF:
 * Menghilangkan noise header/footer laporan tahunan dan menyambung soft-newline antar kata.
 */
function cleanAndNormalizeRawText(rawText: string): string {
  return rawText
    .replace(/\r\n/g, "\n")
    .replace(/PT\s+Bank\s+[^\n]+\s+Tbk\.?/gi, "")
    .replace(/Laporan\s+(Tahunan|Direksi|Manajemen|Dewan\s+Komisaris)[^\n]*/gi, "")
    .replace(/PENGUNGKAPAN\s+KUANTITATIF[^\n]*/gi, "")
    .replace(/^\s*\d{1,3}\s*$/gm, "") // nomor halaman terisolasi
    // Sambung baris yang terputus di tengah kalimat (soft wrap PDF)
    .replace(/([^\n;.!?:\-–])\s*\n\s*([a-zA-Z0-9(])/g, "$1 $2")
    .replace(/[\t ]+/g, " ")
    .trim();
}

/**
 * Format angka, mata uang, dan persentase dengan Markdown Bold secara aman
 */
function highlightNumbers(text: string): string {
  return text
    .replace(
      /(?<!\*\*)\b(Rp\s*[\d.,]+(?:\s*(?:triliun|miliar|juta))?|\d+[\d.,]*%|\d+[\d.,]*\s*(?:triliun|miliar|juta|bps|debitur|user))(?!\*\*)/gi,
      "**$1**"
    )
    .replace(/\*\*\*\*/g, "");
}

/**
 * Ekstraksi rasio finansial dari teks/tabel laporan
 */
function extractRatios(text: string, citationId: number): ExtractedRatio[] {
  const ratios: ExtractedRatio[] = [];

  // Pola A: <NUMBER>% <NAMA_RASIO> (Contoh: 3,07% NPL, 178,06% NPL Coverage, 7,81% NIM)
  const p1 = /(\d+[\d.,]*%)\s*\n*\s*(NPL\s+Coverage|NPL|NIM|CAR|LDR|BOPO|CASA|ROE|ROA|COF)/gi;
  let m1;
  while ((m1 = p1.exec(text)) !== null) {
    ratios.push({
      name: m1[2].toUpperCase().trim(),
      value: m1[1],
      citationId,
    });
  }

  // Pola B: <NAMA_RASIO> ... <NUMBER>% (Contoh: Rasio NPL tercatat sebesar 3,07%)
  const p2 = /(NPL\s+Coverage|NPL|NIM|CAR|LDR|BOPO|CASA|ROE|ROA|COF)\s*(?:Coverage)?\s*(?:sebesar|mencapai|tercatat|adalah|:)?\s*(\d+[\d.,]*%)/gi;
  let m2;
  while ((m2 = p2.exec(text)) !== null) {
    const name = m2[1].toUpperCase().trim();
    if (!ratios.find((r) => r.name === name)) {
      ratios.push({
        name,
        value: m2[2],
        citationId,
      });
    }
  }

  return ratios;
}

/**
 * Ekstraksi kalimat & paragraf faktual bersih dari kandidat
 */
function extractCleanUnits(candidates: RerankedCandidate[], query: string): CleanSentence[] {
  const units: CleanSentence[] = [];
  const qTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);

  candidates.forEach((cand) => {
    const cleaned = cleanAndNormalizeRawText(cand.chunk.raw_text);

    // Pisahkan berdasarkan jeda paragraf ganda atau terminasi kalimat
    const rawBlocks = cleaned.split(/(?<=[.!?])\s+|\n{2,}/);

    rawBlocks.forEach((block) => {
      let s = block.trim().replace(/^[-•*]\s*/, "");

      // Pisahkan sisa header tabel rasio jika ada di awal kalimat
      const splitStar = s.split(/(?<=[A-Z]{2,}\*?)\s+(?=[A-Z][a-z])/);
      if (splitStar.length > 1) {
        s = splitStar[1];
      }

      // Bersihkan artefak nomor urut di awal/akhir kalimat (contoh: "2. Penyaluran...", "; 3.")
      s = s
        .replace(/^\d+[\s.)-]+\s*/, "")
        .replace(/[;:,]\s*\d+[\s.)-]*$/, "")
        .trim();

      // Filter noise tabel dan baris pendek
      if (
        s.length >= 35 &&
        !/^[\d\s.,%]+$/.test(s) &&
        !/Tabel\s+Suku\s+Bunga/i.test(s) &&
        !/PENGUNGKAPAN/i.test(s)
      ) {
        // Hitung relevansi unit kalimat
        const sLower = s.toLowerCase();
        let matchCount = 0;
        for (const qt of qTerms) {
          if (sLower.includes(qt)) matchCount++;
        }

        const numFigures = (s.match(/triliun|miliar|juta|%|rp|\b\d{2,}\b/gi) || []).length;
        const verbBonus = /menyalurkan|penyaluran|mencapai|tercatat|tumbuh|meningkat|sebesar/i.test(s) ? 2 : 0;
        const score = matchCount * 3 + Math.min(numFigures, 5) * 2 + verbBonus;

        units.push({
          text: s,
          citationId: cand.citationId || 1,
          halaman: cand.chunk.metadata.halaman,
          bab: cand.chunk.metadata.bab,
          score,
        });
      }
    });
  });

  return units;
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

  // 2. Siapkan data sitasi dari Top kandidat (hingga 5 sitasi)
  const citations: CitationItem[] = candidates.slice(0, 5).map((c, idx) => ({
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
        .slice(0, 4)
        .map(
          (c, idx) =>
            `[Sitasi ${idx + 1}] (${c.chunk.metadata.kode_bank} Hal. ${c.chunk.metadata.halaman} - ${c.chunk.metadata.bab}):\n${c.chunk.raw_text}`
        )
        .join("\n\n");

      const prompt = `Anda adalah Analis Finansial Senior Pasar Modal BEI. Berdasarkan bukti Laporan Tahunan resmi berikut, jawab pertanyaan pengguna secara komprehensif, terstruktur, dan objektif dalam Bahasa Indonesia.
WAJIB menyertakan nomor sitasi ([1], [2], dst) di setiap klaim angka, rasio, atau fakta.
Gunakan format bullet points dan tebalkan angka-angka penting.

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

  // 4. Extractive Financial Synthesizer (Standalone, Multiaspect & Deterministic)
  const paragraphs: string[] = [];

  // Peringatan jika status AMBIGUOUS
  if (agent4Result.status === "AMBIGUOUS") {
    paragraphs.push(
      `> Catatan Audit Keterbatasan Bukti: Pertanyaan ini diproses dengan tingkat keyakinan sedang (${agent4Result.confidenceScore}). Temuan di bawah dirangkum dari bagian laporan yang paling relevan, namun disarankan memeriksa halaman asli PDF.`
    );
  }

  // Klasifikasi domain topik dari kueri
  const isNPL = /npl|non-performing|kredit bermasalah|kolektibilitas|kualitas aset|macet|coverage|pencadangan/i.test(query);
  const isCredit = /kredit|pembiayaan|umkm|kur|mikro|ritel|kecil|penyaluran|portofolio/i.test(query);
  const isProfit = /laba|rugi|profit|keuntungan|roe|roa|margin|pendapatan|nim/i.test(query);
  const isCapital = /car|modal|kpmm|tier 1|ekuitas|solvabilitas/i.test(query);
  const isLiquidity = /likuiditas|dpk|dana pihak ketiga|casa|giro|tabungan|deposito|ldr/i.test(query);
  const isEfficiency = /bopo|cir|efisiensi|biaya operasional/i.test(query);
  const isDigital = /digital|transaksi|mobile|brimo|livin|qris/i.test(query);

  // Kelompokkan kandidat per emiten bank
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

    // Kumpulkan rasio finansial terverifikasi untuk bank ini
    const allRatios: ExtractedRatio[] = [];
    bankCandidates.forEach((c, idx) => {
      allRatios.push(...extractRatios(c.chunk.raw_text, c.citationId || idx + 1));
    });

    const ratioMap = new Map<string, ExtractedRatio>();
    allRatios.forEach((r) => {
      if (!ratioMap.has(r.name)) ratioMap.set(r.name, r);
    });

    // Kumpulkan unit kalimat terstruktur
    const sentences = extractCleanUnits(bankCandidates, query);
    const bullets: string[] = [];

    // ASPEK 1: Penyaluran Kredit UMKM / KUR / Portofolio
    if (isCredit) {
      const creditSents = sentences.filter(
        (s) =>
          /penyaluran|kur|kredit|umkm|debitur|portofolio/i.test(s.text) &&
          /triliun|miliar|juta|%|rp/i.test(s.text)
      );

      creditSents.sort((a, b) => b.score - a.score);

      if (creditSents.length > 0) {
        const topSent = creditSents[0];
        const secondSent = creditSents.find(
          (s) =>
            s.citationId !== topSent.citationId &&
            /penjaminan|mikro|ritel|kur|pembiayaan/i.test(s.text)
        );

        let text = highlightNumbers(topSent.text);
        if (!/[.!?]$/.test(text)) text += ".";
        text += ` [${topSent.citationId}]`;

        if (secondSent) {
          const secText = secondSent.text.replace(/^(Selain itu|Juga|Adapun)[,\s]*/i, "");
          text += " Selain itu, " + highlightNumbers(secText);
          if (!/[.!?]$/.test(text)) text += ".";
          text += ` [${secondSent.citationId}]`;
        }
        bullets.push(`• **Penyaluran Kredit UMKM & Realisasi KUR**: ${text}`);
      }
    }

    // ASPEK 2: Kualitas Aset & Rasio NPL
    if (isNPL) {
      const nplRatio = ratioMap.get("NPL");
      const nplCov = ratioMap.get("NPL COVERAGE");

      if (nplRatio) {
        let text = `Rasio *Non-Performing Loan* (NPL) konsolidasi ${bankCode} tercatat sebesar **${nplRatio.value}**`;
        if (nplCov) {
          text += `, didukung rasio pencadangan kerugian (*NPL Coverage*) yang sangat kokoh mencapai **${nplCov.value}**`;
        }
        text += ` [${nplRatio.citationId}]. Kualitas aset yang terkendali ini membuktikan penerapan prinsip kehati-hatian (*prudential banking*) dan ketahanan manajemen risiko kredit.`;
        bullets.push(`• **Kualitas Aset & Rasio NPL**: ${text}`);
      } else {
        // Cari kalimat yang membahas NPL/kualitas aset
        const assetSents = sentences.filter((s) => /npl|non-performing|kualitas aset|kredit macet/i.test(s.text));
        if (assetSents.length > 0) {
          bullets.push(`• **Kualitas Aset & Pengelolaan NPL**: ${highlightNumbers(assetSents[0].text)} [${assetSents[0].citationId}]`);
        }
      }
    }

    // ASPEK 3: Profitabilitas & Margin (Laba / NIM / ROE)
    if (isProfit) {
      const nimRatio = ratioMap.get("NIM");
      const roeRatio = ratioMap.get("ROE");
      const roaRatio = ratioMap.get("ROA");
      const profitRatios: string[] = [];
      if (nimRatio) profitRatios.push(`Net Interest Margin (NIM) sebesar **${nimRatio.value}** [${nimRatio.citationId}]`);
      if (roeRatio) profitRatios.push(`Return on Equity (ROE) **${roeRatio.value}** [${roeRatio.citationId}]`);
      if (roaRatio) profitRatios.push(`Return on Assets (ROA) **${roaRatio.value}** [${roaRatio.citationId}]`);

      const profitSent = sentences.find((s) => /laba bersih|laba komprehensif|keuntungan|pendapatan bunga/i.test(s.text));

      let content = "";
      if (profitSent) {
        content = highlightNumbers(profitSent.text) + ` [${profitSent.citationId}]`;
        if (profitRatios.length > 0) {
          content += ` Di sisi rasio profitabilitas, tercatat ${profitRatios.join(", ")}.`;
        }
      } else if (profitRatios.length > 0) {
        content = `Rasio profitabilitas ${bankCode} mencatatkan ${profitRatios.join(", ")}.`;
      }

      if (content) {
        bullets.push(`• **Profitabilitas & Kinerja Margin**: ${content}`);
      }
    }

    // ASPEK 4: Solvabilitas & Permodalan (CAR)
    if (isCapital) {
      const carRatio = ratioMap.get("CAR");
      if (carRatio) {
        bullets.push(
          `• **Permodalan & Rasio Solvabilitas**: Capital Adequacy Ratio (CAR) ${bankCode} berada pada level sangat kuat sebesar **${carRatio.value}** [${carRatio.citationId}], memberikan bantalan permodalan yang memadai untuk ekspansi bisnis jangka panjang.`
        );
      }
    }

    // ASPEK 5: Likuiditas & Dana Murah (CASA / LDR / DPK)
    if (isLiquidity) {
      const ldrRatio = ratioMap.get("LDR");
      const casaRatio = ratioMap.get("CASA");
      const liqParts: string[] = [];
      if (ldrRatio) liqParts.push(`Loan to Deposit Ratio (LDR) sebesar **${ldrRatio.value}** [${ldrRatio.citationId}]`);
      if (casaRatio) liqParts.push(`Rasio CASA sebesar **${casaRatio.value}** [${casaRatio.citationId}]`);

      const dpkSent = sentences.find((s) => /dana pihak ketiga|dpk|tabungan|giro|deposito/i.test(s.text));
      let content = "";
      if (dpkSent) {
        content = highlightNumbers(dpkSent.text) + ` [${dpkSent.citationId}]`;
        if (liqParts.length > 0) content += ` Rasio likuiditas tercatat ${liqParts.join(", ")}.`;
      } else if (liqParts.length > 0) {
        content = `Kondisi likuiditas tercermin dari ${liqParts.join(", ")}.`;
      }

      if (content) {
        bullets.push(`• **Likuiditas & Struktur DPK**: ${content}`);
      }
    }

    // ASPEK 6: Efisiensi Operasional (BOPO / CIR)
    if (isEfficiency) {
      const bopoRatio = ratioMap.get("BOPO");
      const cirRatio = ratioMap.get("CIR");
      const effParts: string[] = [];
      if (bopoRatio) effParts.push(`Rasio BOPO sebesar **${bopoRatio.value}** [${bopoRatio.citationId}]`);
      if (cirRatio) effParts.push(`Cost to Income Ratio (CIR) **${cirRatio.value}** [${cirRatio.citationId}]`);
      if (effParts.length > 0) {
        bullets.push(`• **Efisiensi Operasional**: Tingkat efisiensi perseroan tercermin melalui ${effParts.join(", ")}.`);
      }
    }

    // ASPEK 7: Indikator Rasio Pendukung (Jika rasio belum ditampilkan di atas)
    const unusedRatios: string[] = [];
    if (!isProfit && ratioMap.has("NIM")) {
      unusedRatios.push(`Net Interest Margin (NIM) **${ratioMap.get("NIM")!.value}** [${ratioMap.get("NIM")!.citationId}]`);
    }
    if (!isCapital && ratioMap.has("CAR")) {
      unusedRatios.push(`Capital Adequacy Ratio (CAR) **${ratioMap.get("CAR")!.value}** [${ratioMap.get("CAR")!.citationId}]`);
    }
    if (ratioMap.has("COF")) {
      unusedRatios.push(`Cost of Funds (COF) **${ratioMap.get("COF")!.value}** [${ratioMap.get("COF")!.citationId}]`);
    }
    if (unusedRatios.length > 0) {
      bullets.push(`• **Indikator Rasio Finansial Pendukung**: Kinerja konsolidasi diperkuat oleh ${unusedRatios.join(", ")}.`);
    }

    // ASPEK 8: Inisiatif Pemberdayaan / Transformasi Digital
    const progSent = sentences.find((s) =>
      /Desa BRILiaN|Rumah BUMN|Klaster Usaha|Holding Ultra Mikro|BRILink|BRImo|Livin|Kopra|pemberdayaan/i.test(s.text)
    );
    if (progSent && (isCredit || isDigital)) {
      bullets.push(`• **Ekosistem Pemberdayaan & Akselerasi**: ${highlightNumbers(progSent.text)} [${progSent.citationId}]`);
    }

    // FALLBACK: Jika kueri umum atau bullet < 2, ambil 2 kalimat paling relevan dari kandidat utama
    if (bullets.length < 2) {
      const fallbackSents = sentences
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);

      if (fallbackSents.length > 0) {
        fallbackSents.forEach((fs) => {
          bullets.push(`• **Ikhtisar Temuan Laporan (${meta.bab} Hal. ${fs.halaman})**: ${highlightNumbers(fs.text)} [${fs.citationId}]`);
        });
      } else {
        const keyLines = firstCand.chunk.raw_text
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 25)
          .slice(0, 3)
          .join("; ");
        bullets.push(`• **Ikhtisar Utama (${meta.bab} Hal. ${meta.halaman})**: "${keyLines}" [${firstCand.citationId}]`);
      }
    }

    paragraphs.push(
      `### Analisis Kinerja ${bankCode} (${meta.nama_bank})\n` +
      `Berdasarkan data resmi Laporan Tahunan 2025, berikut temuan kinerja utama terkait kueri Anda:\n\n` +
      bullets.join("\n\n")
    );
  });

  // Komparasi antar bank jika kueri multi-emiten
  if (emitenGroups.size >= 2) {
    paragraphs.push(
      `### Komparasi & Sintesis Antar-Emiten\n` +
      `• **Evaluasi Lintas Bank**: Hasil ekstraksi menunjukkan perbedaan fokus dan profil kinerja di antara ${Array.from(emitenGroups.keys()).join(" dan ")}. Periksa masing-masing kartu bukti bersitasi di atas untuk detail perbandingan rasio dan nominal resmi.`
    );
  }

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
