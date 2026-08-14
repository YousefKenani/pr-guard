import type { Finding } from "../types.js";
import { escapeRegExp, getNumberedLines } from "./helpers.js";
import type { AnalysisRule } from "./types.js";

const allocationPattern =
  /\b([A-Za-z_]\w*)\s*=\s*(?:\([^)]+\)\s*)?(malloc|calloc|realloc)\s*\(/;

export const mallocRule: AnalysisRule = {
  name: "malloc-free",
  analyze(input): Finding[] {
    const findings: Finding[] = [];
    const lines = getNumberedLines(input.code);

    for (const line of lines) {
      const allocation = line.text.match(allocationPattern);

      if (!allocation) {
        continue;
      }

      const [, variableName, allocator] = allocation;
      const freePattern = new RegExp(`\\bfree\\s*\\(\\s*${escapeRegExp(variableName)}\\s*\\)`);

      if (!freePattern.test(input.code)) {
        findings.push({
          file: input.file,
          line: line.number,
          severity: "medium",
          category: "memory",
          description: `${allocator}() allocation assigned to ${variableName} may not be freed.`,
          suggestion: `Call free(${variableName}) on every path after the allocation is no longer needed.`,
          source: "static",
        });
      }
    }

    return findings;
  },
};
