import type { AnalysisInput, Finding } from "../types.js";

export interface AnalysisRule {
  name: string;
  analyze(input: AnalysisInput): Finding[];
}
