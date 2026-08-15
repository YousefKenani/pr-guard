import { analyzeCode } from "../analysis/analyzer.js";
import { calculateRisk } from "../analysis/risk/index.js";
import type { AnalysisOptions, AnalysisWarning, Finding } from "../analysis/types.js";
import { fetchPullRequestData, fetchRepositoryData } from "./client.js";
import { extractAddedLinesForAnalysis } from "./diff.js";
import { parseGithubPullRequestUrl, parseGithubRepositoryUrl } from "./parse-url.js";
import type { PullRequestAnalysisResult, RepositoryAnalysisResult } from "./types.js";

export async function analyzePullRequestUrl(
  url: string,
  options: AnalysisOptions,
): Promise<PullRequestAnalysisResult> {
  const reference = parseGithubPullRequestUrl(url);
  const pullRequest = await fetchPullRequestData(reference);
  const findings: Finding[] = [];
  const warnings: AnalysisWarning[] = getPreflightWarnings(options);
  const analysisOptions = getEffectiveAnalysisOptions(options, warnings);

  for (const file of pullRequest.files) {
    if (!file.patch) {
      continue;
    }

    const addedLines = extractAddedLinesForAnalysis(file.patch);

    if (!addedLines.trim()) {
      continue;
    }

    const result = await analyzeCode(
      {
        file: file.filename,
        code: addedLines,
      },
      analysisOptions,
    );

    findings.push(...result.findings);
    addWarnings(warnings, result.warnings);
  }

  const analysisResult: PullRequestAnalysisResult = {
    pullRequest,
    findings: findings.sort(compareFindings),
    summary: calculateRisk(findings),
  };

  if (warnings.length > 0) {
    analysisResult.warnings = warnings;
  }

  return analysisResult;
}

export async function analyzeRepositoryUrl(
  url: string,
  options: AnalysisOptions,
): Promise<RepositoryAnalysisResult> {
  const reference = parseGithubRepositoryUrl(url);
  const repository = await fetchRepositoryData(reference);
  const findings: Finding[] = [];
  const warnings: AnalysisWarning[] = getPreflightWarnings(options);
  const analysisOptions = getEffectiveAnalysisOptions(options, warnings);
  const aiFileLimit = getAiFileLimit();
  let aiFilesReviewed = 0;

  console.error(
    `Analyzing repository ${repository.fullName}: ${repository.files.length} source files found.`,
  );

  for (const file of repository.files) {
    if (!file.content.trim()) {
      continue;
    }

    const fileOptions =
      analysisOptions.includeAi && aiFilesReviewed < aiFileLimit
        ? analysisOptions
        : { ...analysisOptions, mode: "static-only" as const };

    console.error(
      `Analyzing ${file.path}${fileOptions.mode === "static-only" ? " (static)" : " (static + AI)"}`,
    );

    const result = await analyzeCode(
      {
        file: file.path,
        code: file.content,
      },
      fileOptions,
    );

    if (fileOptions.mode !== "static-only" && analysisOptions.includeAi) {
      aiFilesReviewed += 1;
    }

    findings.push(...result.findings);
    addWarnings(warnings, result.warnings);
  }

  const analysisResult: RepositoryAnalysisResult = {
    repository: {
      ...repository,
      files: repository.files.map(({ path, size }) => ({ path, size })),
    },
    findings: findings.sort(compareFindings),
    summary: calculateRisk(findings),
  };

  if (repository.files.length === 0) {
    warnings.push({
      source: "static",
      message:
        "No supported source files were found. Repository analysis currently scans C/C++/JavaScript/TypeScript source files.",
    });
  }

  if (analysisOptions.includeAi && repository.files.length > aiFilesReviewed) {
    warnings.push({
      source: "ai",
      message: `AI review was limited to ${aiFilesReviewed} file(s). Set PR_GUARD_AI_MAX_FILES to change this.`,
    });
  }

  if (warnings.length > 0) {
    analysisResult.warnings = warnings;
  }

  return analysisResult;
}

function compareFindings(left: Finding, right: Finding): number {
  return left.file.localeCompare(right.file) || left.line - right.line;
}

function getPreflightWarnings(options: AnalysisOptions): AnalysisWarning[] {
  if (!options.includeAi || process.env.OPENAI_API_KEY) {
    return [];
  }

  return [
    {
      source: "ai",
      message: "OPENAI_API_KEY is required when AI analysis is enabled.",
    },
  ];
}

function getEffectiveAnalysisOptions(
  options: AnalysisOptions,
  warnings: AnalysisWarning[],
): AnalysisOptions {
  return {
    ...options,
    includeAi: options.includeAi && !warnings.some((warning) => warning.source === "ai"),
  };
}

function addWarnings(warnings: AnalysisWarning[], newWarnings?: AnalysisWarning[]): void {
  for (const warning of newWarnings ?? []) {
    const exists = warnings.some(
      (candidate) =>
        candidate.source === warning.source && candidate.message === warning.message,
    );

    if (!exists) {
      warnings.push(warning);
    }
  }
}

function getAiFileLimit(): number {
  const configuredLimit = Number(process.env.PR_GUARD_AI_MAX_FILES ?? 3);

  if (!Number.isInteger(configuredLimit) || configuredLimit < 0) {
    return 3;
  }

  return configuredLimit;
}
