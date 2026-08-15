import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateRisk, getRiskLevel } from "./calculator.js";
import type { Finding } from "../types.js";

describe("calculateRisk", () => {
  it("counts findings by severity and calculates a score", () => {
    const findings: Finding[] = [
      makeFinding("critical", "security"),
      makeFinding("high", "memory"),
      makeFinding("medium", "complexity"),
      makeFinding("low", "maintainability"),
    ];

    const result = calculateRisk(findings);

    assert.equal(result.totalFindings, 4);
    assert.deepEqual(result.bySeverity, {
      low: 1,
      medium: 1,
      high: 1,
      critical: 1,
    });
    assert.equal(result.rawScore, 52);
    assert.equal(result.riskScore, 52);
    assert.equal(result.riskLevel, "high");
  });

  it("caps the risk score at 100", () => {
    const findings = Array.from({ length: 8 }, () => makeFinding("critical", "security"));

    const result = calculateRisk(findings);

    assert.equal(result.riskScore, 100);
    assert.equal(result.riskLevel, "critical");
  });
});

describe("getRiskLevel", () => {
  it("maps scores to risk levels", () => {
    assert.equal(getRiskLevel(0), "low");
    assert.equal(getRiskLevel(25), "medium");
    assert.equal(getRiskLevel(50), "high");
    assert.equal(getRiskLevel(75), "critical");
  });
});

function makeFinding(severity: Finding["severity"], category: string): Finding {
  return {
    file: "example.c",
    line: 1,
    severity,
    category,
    description: "Example finding",
    suggestion: "Fix the example finding",
    source: "static",
  };
}
