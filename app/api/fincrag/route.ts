import { NextRequest, NextResponse } from "next/server";
import { executeFINCRAGPipeline, initializeFINCRAGEngine } from "@/lib/pipeline";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  try {
    const info = await initializeFINCRAGEngine();
    return NextResponse.json({
      status: "ONLINE",
      supabaseConnected: isSupabaseConfigured,
      engine: "FIN-CRAG Deterministic STKI Engine",
      totalChunks: info.totalChunks,
      bankDistribution: info.bankDistribution,
      version: "2026.1",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "ERROR", message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, bankFilter, useOllama, ollamaModel } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Parameter 'query' wajib diisi." },
        { status: 400 }
      );
    }

    const response = await executeFINCRAGPipeline(query, bankFilter, {
      useOllama,
      ollamaModel,
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Pipeline Execution Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan komputasi pada FIN-CRAG pipeline", details: error.message },
      { status: 500 }
    );
  }
}
