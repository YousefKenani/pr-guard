import type { Finding, RiskLevel, RiskSummary, Severity } from "../types.js";
import {
  categoryWeights,
  riskLevelBands,
  severityWeights,
  sourceWeights,
} from "./weights.js";

const severities: Severity[] = ["low", "medium", "high", "critical"];
const maxRiskScore = 100;

export function calculateRisk(findings: Finding[]): RiskSummary {
  const bySeverity = createEmptySeverityCount();
  let rawScore = 0;

  for (const finding of findings) {
    bySeverity[finding.severity] += 1;
    rawScore += severityWeights[finding.severity];
    rawScore += categoryWeights[finding.category] ?? 0;

    if (finding.source === "ai" && ["high", "critical"].includes(finding.severity)) {
      rawScore += sourceWeights.aiHighConfidenceSignal;
    }
  }

  const score = Math.min(rawScore, maxRiskScore);

  return {
    totalFindings: findings.length,
    bySeverity,
    rawScore,
    riskScore: score,
    riskLevel: getRiskLevel(score),
  };
}

export function getRiskLevel(score: number): RiskLevel {
  const normalizedScore = Math.max(0, Math.min(score, maxRiskScore));
  const band = riskLevelBands.find(
    (candidate) => normalizedScore >= candidate.min && normalizedScore <= candidate.max,
  );

  return band?.level ?? "critical";
}

function createEmptySeverityCount(): Record<Severity, number> {
  return Object.fromEntries(
    severities.map((severity) => [severity, 0]),
  ) as Record<Severity, number>;
}
