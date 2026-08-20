import { NextResponse } from "next/server";
import { loadEnvFile } from "../../../src/config/env";
import { saveAnalysis } from "../../../src/db/supabase";
import type { PersistableAnalysisResult } from "../../../src/db/types";
import { analyzePullRequestUrl, analyzeRepositoryUrl } from "../../../src/github/analyzer";
import { isGithubPullRequestUrl, isGithubRepositoryUrl } from "../../../src/github/parse-url";

export const runtime = "nodejs";

interface AnalyzeRequest {
  target?: unknown;
  mode?: unknown;
  includeAi?: unknown;
}

loadEnvFile();

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AnalyzeRequest;
    const target = typeof body.target === "string" ? body.target.trim() : "";
    const mode = body.mode === "repo" || body.mode === "pr" || body.mode === "auto" ? body.mode : "auto";
    const includeAi = body.includeAi === true;

    if (!target) {
      return NextResponse.json({ error: "A GitHub URL is required." }, { status: 400 });
    }

    const options = { includeAi };

    if (mode === "pr" || (mode === "auto" && isGithubPullRequestUrl(target))) {
      const result = await analyzePullRequestUrl(target, options);

      return NextResponse.json(await withSavedAnalysis(result, includeAi));
    }

    if (mode === "repo" || (mode === "auto" && isGithubRepositoryUrl(target))) {
      const result = await analyzeRepositoryUrl(target, options);

      return NextResponse.json(await withSavedAnalysis(result, includeAi));
    }

    return NextResponse.json(
      { error: "Enter a GitHub repository URL or pull request URL." },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed." },
      { status: 500 },
    );
  }
}

async function withSavedAnalysis(result: PersistableAnalysisResult, includeAi: boolean) {
  try {
    return {
      ...result,
      savedAnalysis: await saveAnalysis({ result, includeAi }),
    };
  } catch (error) {
    return {
      ...result,
      savedAnalysis: null,
      warnings: [
        ...(result.warnings ?? []),
        {
          source: "database",
          message:
            error instanceof Error
              ? `Analysis completed, but history was not saved: ${error.message}`
              : "Analysis completed, but history was not saved.",
        },
      ],
    };
  }
}
