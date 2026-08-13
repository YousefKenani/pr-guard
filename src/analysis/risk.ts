import type { Finding, RiskSummary, Severity } from "./types.js";

const severities: Severity[] = ["low", "medium", "high", "critical"];

export function summarizeFindings(findings: Finding[]): RiskSummary {
  const bySeverity = Object.fromEntries(
    severities.map((severity) => [severity, 0]),
  ) as Record<Severity, number>;

  for (const finding of findings) {
    bySeverity[finding.severity] += 1;
  }

  return {
    totalFindings: findings.length,
    bySeverity,
  };
}
