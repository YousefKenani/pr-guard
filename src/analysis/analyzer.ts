import { summarizeFindings } from "./risk.js";
import type { AnalysisInput, AnalysisResult, Finding } from "./types.js";

export function analyzeCode(input: AnalysisInput): AnalysisResult {
  const findings: Finding[] = [];

  return {
    file: input.file,
    findings,
    summary: summarizeFindings(findings),
  };
}
