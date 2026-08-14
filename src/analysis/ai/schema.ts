import type { Finding, Severity } from "../types.js";

export interface AiFinding {
  line: number;
  severity: Severity;
  category: string;
  description: string;
  suggestion: string;
}

export interface AiReviewResponse {
  findings: AiFinding[];
}

export const aiReviewResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          line: {
            type: "integer",
            minimum: 1,
          },
          severity: {
            type: "string",
            enum: ["low", "medium", "high", "critical"],
          },
          category: {
            type: "string",
          },
          description: {
            type: "string",
          },
          suggestion: {
            type: "string",
          },
        },
        required: ["line", "severity", "category", "description", "suggestion"],
      },
    },
  },
  required: ["findings"],
} as const;

const severities = new Set(["low", "medium", "high", "critical"]);

export function toAiFindings(value: unknown): AiFinding[] {
  if (!isObject(value) || !Array.isArray(value.findings)) {
    throw new Error("AI response did not include a findings array.");
  }

  return value.findings.map((finding, index) => {
    if (!isObject(finding)) {
      throw new Error(`AI finding at index ${index} is not an object.`);
    }

    const line = finding.line;
    const severity = finding.severity;
    const category = finding.category;
    const description = finding.description;
    const suggestion = finding.suggestion;

    if (
      typeof line !== "number" ||
      !Number.isInteger(line) ||
      line < 1 ||
      typeof severity !== "string" ||
      !severities.has(severity) ||
      typeof category !== "string" ||
      typeof description !== "string" ||
      typeof suggestion !== "string"
    ) {
      throw new Error(`AI finding at index ${index} has an invalid shape.`);
    }

    return {
      line,
      severity: severity as Severity,
      category,
      description,
      suggestion,
    };
  });
}

export function toProjectFinding(file: string, finding: AiFinding): Finding {
  return {
    file,
    line: finding.line,
    severity: finding.severity,
    category: finding.category,
    description: finding.description,
    suggestion: finding.suggestion,
    source: "ai",
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
