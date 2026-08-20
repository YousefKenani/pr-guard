import { NextResponse } from "next/server";
import { loadEnvFile } from "../../../src/config/env";
import { listAnalyses } from "../../../src/db/supabase";

export const runtime = "nodejs";

loadEnvFile();

export async function GET() {
  try {
    return NextResponse.json({ analyses: await listAnalyses() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "History failed to load." },
      { status: 500 },
    );
  }
}
