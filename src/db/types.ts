import type { Finding, RiskLevel } from "../analysis/types.js";
import type { PullRequestAnalysisResult, RepositoryAnalysisResult } from "../github/types.js";

export type AnalysisTargetType = "repository" | "pull_request";

export interface PersistedAnalysisSummary {
  id: string;
  targetType: AnalysisTargetType;
  owner: string;
  repository: string;
  pullNumber: number | null;
  title: string;
  url: string;
  riskScore: number;
  riskLevel: RiskLevel;
  totalFindings: number;
  createdAt: string;
}

export type PersistableAnalysisResult = RepositoryAnalysisResult | PullRequestAnalysisResult;

export interface PersistAnalysisInput {
  result: PersistableAnalysisResult;
  includeAi: boolean;
}

export interface AnalysisRow {
  id: string;
  target_type: AnalysisTargetType;
  owner: string;
  repository: string;
  pull_number: number | null;
  title: string;
  url: string;
  risk_score: number;
  risk_level: RiskLevel;
  total_findings: number;
  include_ai: boolean;
  created_at: string;
}

export interface FindingInsertRow {
  analysis_id: string;
  filename: string;
  line: number;
  severity: Finding["severity"];
  category: string;
  description: string;
  suggestion: string;
  source: Finding["source"];
}
