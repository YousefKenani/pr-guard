"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type RiskLevel = "low" | "medium" | "high" | "critical";
type Mode = "repo" | "pr";

interface Finding {
  file: string;
  line: number;
  severity: RiskLevel;
  category: string;
  description: string;
  suggestion: string;
  source: "static" | "ai";
}

interface AnalysisSummary {
  totalFindings: number;
  bySeverity: Record<RiskLevel, number>;
  rawScore: number;
  riskScore: number;
  riskLevel: RiskLevel;
}

interface AnalysisWarning {
  source: string;
  message: string;
}

interface PersistedAnalysisSummary {
  id: string;
  targetType: "repository" | "pull_request";
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

interface RepositoryResult {
  repository: {
    fullName: string;
    defaultBranch: string;
    url: string;
    files: Array<{ path: string; size: number }>;
  };
  findings: Finding[];
  summary: AnalysisSummary;
  warnings?: AnalysisWarning[];
  savedAnalysis?: PersistedAnalysisSummary | null;
}

interface PullRequestResult {
  pullRequest: {
    owner: string;
    repo: string;
    pullNumber: number;
    title: string;
    author: string;
    url: string;
    files: Array<{ filename: string; additions: number; deletions: number; changes: number }>;
  };
  findings: Finding[];
  summary: AnalysisSummary;
  warnings?: AnalysisWarning[];
  savedAnalysis?: PersistedAnalysisSummary | null;
}

type AnalysisResult = RepositoryResult | PullRequestResult;

const defaultRepoUrl = "https://github.com/YousefKenani/princess_coloring-1";

export function Dashboard() {
  const [mode, setMode] = useState<Mode>("repo");
  const [target, setTarget] = useState(defaultRepoUrl);
  const [includeAi, setIncludeAi] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<PersistedAnalysisSummary[]>([]);
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    void loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const response = await fetch("/api/history");
      const data = (await response.json()) as { analyses?: PersistedAnalysisSummary[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "History failed to load.");
      }

      setHistory(data.analyses ?? []);
      setHistoryError("");
    } catch (caught) {
      setHistory([]);
      setHistoryError(caught instanceof Error ? caught.message : "History failed to load.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, mode, includeAi }),
      });
      const data = (await response.json()) as AnalysisResult | { error?: string };

      if (!response.ok) {
        throw new Error("error" in data && data.error ? data.error : "Analysis failed.");
      }

      setResult(data as AnalysisResult);
      await loadHistory();
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "Analysis failed.");
    } finally {
      setIsLoading(false);
    }
  }

  const findings = result?.findings ?? [];
  const sortedFindings = useMemo(
    () => [...findings].sort((left, right) => severityRank[right.severity] - severityRank[left.severity]),
    [findings],
  );

  return (
    <main className="shell">
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">PR Guard</p>
            <h1>Pull Request Risk Review</h1>
          </div>
          <div className="status-pill">Phase 7</div>
        </header>

        <form className="analysis-form" onSubmit={handleSubmit}>
          <div className="mode-control" role="tablist" aria-label="Analysis mode">
            <button
              type="button"
              className={mode === "repo" ? "active" : ""}
              onClick={() => setMode("repo")}
            >
              Repository
            </button>
            <button type="button" className={mode === "pr" ? "active" : ""} onClick={() => setMode("pr")}>
              Pull Request
            </button>
          </div>

          <label className="url-field">
            <span>GitHub URL</span>
            <input
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              placeholder={mode === "repo" ? "https://github.com/owner/repo" : "https://github.com/owner/repo/pull/42"}
            />
          </label>

          <label className="switch">
            <input
              type="checkbox"
              checked={includeAi}
              onChange={(event) => setIncludeAi(event.target.checked)}
            />
            <span>AI review</span>
          </label>

          <button className="analyze-button" type="submit" disabled={isLoading}>
            {isLoading ? "Analyzing..." : "Analyze"}
          </button>
        </form>

        {error ? <div className="error-banner">{error}</div> : null}

        {result ? (
          <section className="results-grid">
            <RiskPanel summary={result.summary} />
            <TargetPanel result={result} />
            <FindingsPanel findings={sortedFindings} />
            <WarningsPanel warnings={result.warnings ?? []} />
          </section>
        ) : (
          <section className="empty-state">
            <div className="score-preview">0</div>
            <div>
              <h2>Ready for analysis</h2>
              <p>Choose a repository or pull request URL and run the reviewer.</p>
            </div>
          </section>
        )}

        <HistoryPanel history={history} error={historyError} />
      </section>
    </main>
  );
}

function RiskPanel({ summary }: { summary: AnalysisSummary }) {
  return (
    <section className={`panel risk-panel risk-${summary.riskLevel}`}>
      <div>
        <p className="panel-label">Risk Score</p>
        <div className="risk-number">{summary.riskScore}</div>
        <p className="risk-level">{summary.riskLevel.toUpperCase()}</p>
      </div>
      <div className="severity-grid">
        {(["critical", "high", "medium", "low"] as RiskLevel[]).map((severity) => (
          <div key={severity}>
            <span>{severity}</span>
            <strong>{summary.bySeverity[severity]}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function TargetPanel({ result }: { result: AnalysisResult }) {
  const isPr = "pullRequest" in result;
  const title = isPr
    ? `${result.pullRequest.repo} #${result.pullRequest.pullNumber}`
    : result.repository.fullName;
  const subtitle = isPr
    ? result.pullRequest.title
    : `${result.repository.files.length} files on ${result.repository.defaultBranch}`;

  return (
    <section className="panel target-panel">
      <p className="panel-label">{isPr ? "Pull Request" : "Repository"}</p>
      <h2>{title}</h2>
      <p>{subtitle}</p>
      <a href={isPr ? result.pullRequest.url : result.repository.url} target="_blank" rel="noreferrer">
        Open on GitHub
      </a>
    </section>
  );
}

function FindingsPanel({ findings }: { findings: Finding[] }) {
  return (
    <section className="panel findings-panel">
      <div className="panel-heading">
        <p className="panel-label">Findings</p>
        <strong>{findings.length}</strong>
      </div>
      {findings.length === 0 ? (
        <p className="quiet">No findings returned.</p>
      ) : (
        <div className="findings-list">
          {findings.map((finding, index) => (
            <article className="finding-row" key={`${finding.file}-${finding.line}-${index}`}>
              <div className={`severity-dot ${finding.severity}`} />
              <div>
                <div className="finding-meta">
                  <span>{finding.severity.toUpperCase()}</span>
                  <span>{finding.source}</span>
                  <span>{finding.category}</span>
                </div>
                <h3>{finding.description}</h3>
                <p>{finding.suggestion}</p>
                <code>
                  {finding.file}:{finding.line}
                </code>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function WarningsPanel({ warnings }: { warnings: AnalysisWarning[] }) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <section className="panel warnings-panel">
      <p className="panel-label">Warnings</p>
      {warnings.map((warning, index) => (
        <p key={`${warning.source}-${index}`}>{warning.message}</p>
      ))}
    </section>
  );
}

function HistoryPanel({
  history,
  error,
}: {
  history: PersistedAnalysisSummary[];
  error: string;
}) {
  return (
    <section className="panel history-panel">
      <div className="panel-heading">
        <p className="panel-label">Analysis History</p>
        <strong>{history.length}</strong>
      </div>

      {error ? <p className="quiet">{error}</p> : null}

      {!error && history.length === 0 ? (
        <p className="quiet">No saved analyses yet.</p>
      ) : (
        <div className="history-list">
          {history.map((analysis) => (
            <a className="history-row" href={analysis.url} target="_blank" rel="noreferrer" key={analysis.id}>
              <div>
                <strong>{formatHistoryTitle(analysis)}</strong>
                <span>{formatDate(analysis.createdAt)}</span>
              </div>
              <div className={`history-risk risk-text-${analysis.riskLevel}`}>
                <strong>{analysis.riskScore}</strong>
                <span>{analysis.riskLevel.toUpperCase()}</span>
              </div>
              <span>{analysis.totalFindings} findings</span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

function formatHistoryTitle(analysis: PersistedAnalysisSummary): string {
  if (analysis.targetType === "pull_request" && analysis.pullNumber !== null) {
    return `${analysis.owner}/${analysis.repository} #${analysis.pullNumber}`;
  }

  return `${analysis.owner}/${analysis.repository}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

const severityRank: Record<RiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};
