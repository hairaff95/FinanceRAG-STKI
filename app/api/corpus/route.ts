import { NextRequest, NextResponse } from "next/server";
import { getCorpusChunks } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const bank = searchParams.get("bank") || "";
    const search = (searchParams.get("search") || "").toLowerCase();

    const corpus = await getCorpusChunks();

    // Hitung statistik per bank
    const stats: { [code: string]: number } = {
      BBCA: 0,
      BBNI: 0,
      BBRI: 0,
      BMRI: 0,
    };
    for (const c of corpus) {
      if (stats[c.metadata.kode_bank] !== undefined) {
        stats[c.metadata.kode_bank]++;
      }
    }

    // Filter
    let filtered = corpus;
    if (bank && bank !== "ALL") {
      filtered = filtered.filter((c) => c.metadata.kode_bank === bank);
    }
    if (search) {
      filtered = filtered.filter(
        (c) =>
          c.text.toLowerCase().includes(search) ||
          c.metadata.bab.toLowerCase().includes(search) ||
          c.chunk_id.toLowerCase().includes(search)
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedChunks = filtered.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      chunks: paginatedChunks,
      total,
      page,
      totalPages,
      bankStats: stats,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
