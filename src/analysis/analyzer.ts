import { summarizeFindings } from "./risk.js";
import { runStaticAnalysis } from "./static/index.js";
import type { AnalysisInput, AnalysisResult, Finding } from "./types.js";

export function analyzeCode(input: AnalysisInput): AnalysisResult {
  const findings: Finding[] = runStaticAnalysis(input).sort(compareFindings);

  return {
    file: input.file,
    findings,
    summary: summarizeFindings(findings),
  };
}

function compareFindings(left: Finding, right: Finding): number {
  return left.line - right.line || left.severity.localeCompare(right.severity);
}
