import { runAiAnalysis } from "./ai/analyzer.js";
import { calculateRisk } from "./risk/index.js";
import { runStaticAnalysis } from "./static/index.js";
import type {
  AnalysisInput,
  AnalysisOptions,
  AnalysisResult,
  AnalysisWarning,
  Finding,
} from "./types.js";

const defaultOptions: AnalysisOptions = {
  includeAi: false,
};

export async function analyzeCode(
  input: AnalysisInput,
  options: AnalysisOptions = defaultOptions,
): Promise<AnalysisResult> {
  const staticFindings = runStaticAnalysis(input);
  const warnings: AnalysisWarning[] = [];
  let aiFindings: Finding[] = [];

  if (options.includeAi && options.mode !== "static-only") {
    try {
      aiFindings = await runAiAnalysis(input);
    } catch (error) {
      warnings.push({
        source: "ai",
        message: error instanceof Error ? error.message : "AI analysis failed.",
      });
    }
  }

  const findings: Finding[] = [...staticFindings, ...aiFindings].sort(compareFindings);

  const result: AnalysisResult = {
    file: input.file,
    findings,
    summary: calculateRisk(findings),
  };

  if (warnings.length > 0) {
    result.warnings = warnings;
  }

  return result;
}

function compareFindings(left: Finding, right: Finding): number {
  return left.line - right.line || left.severity.localeCompare(right.severity);
}
