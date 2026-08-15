import type { AnalysisWarning, Finding, RiskSummary } from "../analysis/types.js";

export interface PullRequestReference {
  owner: string;
  repo: string;
  pullNumber: number;
}

export interface RepositoryReference {
  owner: string;
  repo: string;
}

export interface RepositoryData extends RepositoryReference {
  name: string;
  fullName: string;
  defaultBranch: string;
  url: string;
  files: RepositoryFile[];
}

export interface RepositoryAnalysisData extends Omit<RepositoryData, "files"> {
  files: RepositoryAnalyzedFile[];
}

export interface RepositoryFile {
  path: string;
  size: number;
  content: string;
}

export interface RepositoryAnalyzedFile {
  path: string;
  size: number;
}

export interface PullRequestData extends PullRequestReference {
  title: string;
  author: string;
  url: string;
  files: ChangedFile[];
}

export interface ChangedFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

export interface PullRequestAnalysisResult {
  pullRequest: PullRequestData;
  findings: Finding[];
  summary: RiskSummary;
  warnings?: AnalysisWarning[];
}

export interface RepositoryAnalysisResult {
  repository: RepositoryAnalysisData;
  findings: Finding[];
  summary: RiskSummary;
  warnings?: AnalysisWarning[];
}
