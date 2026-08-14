import type { Finding } from "../types.js";
import { getNumberedLines } from "./helpers.js";
import type { AnalysisRule } from "./types.js";

const unsafeFunctionPatterns = [
  {
    functionName: "gets",
    pattern: /\bgets\s*\(/,
    severity: "high" as const,
    suggestion: "Use fgets() with an explicit buffer size instead.",
  },
  {
    functionName: "strcpy",
    pattern: /\bstrcpy\s*\(/,
    severity: "high" as const,
    suggestion: "Use a bounded copy function and validate the destination size.",
  },
  {
    functionName: "strcat",
    pattern: /\bstrcat\s*\(/,
    severity: "high" as const,
    suggestion: "Use a bounded concatenation function and track remaining buffer space.",
  },
  {
    functionName: "sprintf",
    pattern: /\bsprintf\s*\(/,
    severity: "medium" as const,
    suggestion: "Use snprintf() with an explicit output buffer size.",
  },
];

export const unsafeFunctionsRule: AnalysisRule = {
  name: "unsafe-functions",
  analyze(input): Finding[] {
    const findings: Finding[] = [];

    for (const line of getNumberedLines(input.code)) {
      for (const unsafeFunction of unsafeFunctionPatterns) {
        if (unsafeFunction.pattern.test(line.text)) {
          findings.push({
            file: input.file,
            line: line.number,
            severity: unsafeFunction.severity,
            category: "security",
            description: `Potentially unsafe use of ${unsafeFunction.functionName}() detected.`,
            suggestion: unsafeFunction.suggestion,
            source: "static",
          });
        }
      }

      if (/\bscanf\s*\(\s*"[^"]*%s/.test(line.text)) {
        findings.push({
          file: input.file,
          line: line.number,
          severity: "medium",
          category: "security",
          description: "Potentially unsafe scanf(\"%s\") input detected.",
          suggestion: "Limit the input width or use fgets() and parse the result safely.",
          source: "static",
        });
      }
    }

    return findings;
  },
};
