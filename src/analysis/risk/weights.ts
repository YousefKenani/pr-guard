import type { RiskLevel, Severity } from "../types.js";

export const severityWeights: Record<Severity, number> = {
  low: 1,
  medium: 4,
  high: 10,
  critical: 25,
};

export const riskLevelBands: Array<{
  level: RiskLevel;
  min: number;
  max: number;
}> = [
  { level: "low", min: 0, max: 24 },
  { level: "medium", min: 25, max: 49 },
  { level: "high", min: 50, max: 74 },
  { level: "critical", min: 75, max: 100 },
];

export const sourceWeights = {
  aiHighConfidenceSignal: 2,
};

export const categoryWeights: Record<string, number> = {
  security: 6,
  memory: 4,
  correctness: 3,
  robustness: 3,
  complexity: 2,
};
