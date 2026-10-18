import { NextRequest, NextResponse } from "next/server";
import { executeIRComparison } from "@/lib/pipeline";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, bankFilter } = body;

    if (!query) {
      return NextResponse.json({ error: "Query wajib diisi." }, { status: 400 });
    }

    const result = await executeIRComparison(query, bankFilter);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
