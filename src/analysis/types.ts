export type Severity = "low" | "medium" | "high" | "critical";

export type FindingSource = "static" | "ai";

export interface Finding {
  line: number;
  file: string;
  severity: Severity;
  category: string;
  description: string;
  suggestion: string;
  source: FindingSource;
}

export interface AnalysisInput {
  file: string;
  code: string;
}

export interface AnalysisResult {
  file: string;
  findings: Finding[];
  summary: RiskSummary;
}

export interface RiskSummary {
  totalFindings: number;
  bySeverity: Record<Severity, number>;
}
