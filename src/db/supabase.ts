import type { Finding } from "../analysis/types.js";
import type {
  AnalysisRow,
  FindingInsertRow,
  PersistAnalysisInput,
  PersistedAnalysisSummary,
} from "./types.js";

const historyLimit = 20;

export function isDatabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseKey());
}

export async function saveAnalysis(
  input: PersistAnalysisInput,
): Promise<PersistedAnalysisSummary | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const analysis = toAnalysisInsert(input);
  const rows = await supabaseRequest<AnalysisRow[]>("/analyses?select=*", {
    method: "POST",
    body: JSON.stringify(analysis),
    headers: {
      Prefer: "return=representation",
    },
  });
  const savedAnalysis = rows.at(0);

  if (!savedAnalysis) {
    throw new Error("Supabase did not return the saved analysis.");
  }

  if (input.result.findings.length > 0) {
    await supabaseRequest("/findings", {
      method: "POST",
      body: JSON.stringify(toFindingRows(savedAnalysis.id, input.result.findings)),
      headers: {
        Prefer: "return=minimal",
      },
    });
  }

  return toPersistedAnalysisSummary(savedAnalysis);
}

export async function listAnalyses(): Promise<PersistedAnalysisSummary[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const rows = await supabaseRequest<AnalysisRow[]>(
    `/analyses?select=*&order=created_at.desc&limit=${historyLimit}`,
  );

  return rows.map(toPersistedAnalysisSummary);
}

function toAnalysisInsert(input: PersistAnalysisInput): Omit<AnalysisRow, "id" | "created_at"> {
  if ("pullRequest" in input.result) {
    const pullRequest = input.result.pullRequest;

    return {
      target_type: "pull_request",
      owner: pullRequest.owner,
      repository: pullRequest.repo,
      pull_number: pullRequest.pullNumber,
      title: pullRequest.title,
      url: pullRequest.url,
      risk_score: input.result.summary.riskScore,
      risk_level: input.result.summary.riskLevel,
      total_findings: input.result.summary.totalFindings,
      include_ai: input.includeAi,
    };
  }

  const repository = input.result.repository;

  return {
    target_type: "repository",
    owner: repository.owner,
    repository: repository.name,
    pull_number: null,
    title: repository.fullName,
    url: repository.url,
    risk_score: input.result.summary.riskScore,
    risk_level: input.result.summary.riskLevel,
    total_findings: input.result.summary.totalFindings,
    include_ai: input.includeAi,
  };
}

function toFindingRows(analysisId: string, findings: Finding[]): FindingInsertRow[] {
  return findings.map((finding) => ({
    analysis_id: analysisId,
    filename: finding.file,
    line: finding.line,
    severity: finding.severity,
    category: finding.category,
    description: finding.description,
    suggestion: finding.suggestion,
    source: finding.source,
  }));
}

function toPersistedAnalysisSummary(row: AnalysisRow): PersistedAnalysisSummary {
  return {
    id: row.id,
    targetType: row.target_type,
    owner: row.owner,
    repository: row.repository,
    pullNumber: row.pull_number,
    title: row.title,
    url: row.url,
    riskScore: row.risk_score,
    riskLevel: row.risk_level,
    totalFindings: row.total_findings,
    createdAt: row.created_at,
  };
}

async function supabaseRequest<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();

  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for history.");
  }

  const response = await fetch(`${url}/rest/v1${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase request failed with status ${response.status}: ${await response.text()}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  if (!text.trim()) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

function getSupabaseUrl(): string | undefined {
  return process.env.SUPABASE_URL?.replace(/\/$/, "");
}

function getSupabaseKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
}
