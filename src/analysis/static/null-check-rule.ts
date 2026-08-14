import type { Finding } from "../types.js";
import { getNumberedLines, hasObviousNullCheck } from "./helpers.js";
import type { AnalysisRule } from "./types.js";

const allocationPattern =
  /\b([A-Za-z_]\w*)\s*=\s*(?:\([^)]+\)\s*)?(malloc|calloc|realloc)\s*\(/;

export const nullCheckRule: AnalysisRule = {
  name: "allocation-null-check",
  analyze(input): Finding[] {
    const findings: Finding[] = [];

    for (const line of getNumberedLines(input.code)) {
      const allocation = line.text.match(allocationPattern);

      if (!allocation) {
        continue;
      }

      const [, variableName] = allocation;

      if (!hasObviousNullCheck(input.code, variableName)) {
        findings.push({
          file: input.file,
          line: line.number,
          severity: "medium",
          category: "correctness",
          description: `Allocation assigned to ${variableName} is not followed by an obvious null check.`,
          suggestion: `Check whether ${variableName} is NULL before dereferencing or passing it to other functions.`,
          source: "static",
        });
      }
    }

    return findings;
  },
};
