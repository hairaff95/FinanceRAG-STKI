import { NextResponse } from "next/server";
import { executeBenchmarkSuite } from "@/lib/pipeline";

export async function POST() {
  try {
    const report = await executeBenchmarkSuite();
    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
