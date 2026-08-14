import type { AnalysisInput } from "../types.js";

export function buildAiReviewPrompt(input: AnalysisInput): string {
  return [
    "Analyze only the supplied C code.",
    "",
    "Identify real risks in these areas:",
    "- correctness bugs",
    "- security risks",
    "- memory or resource lifetime problems",
    "- error handling problems",
    "- maintainability issues that may hide bugs",
    "",
    "Rules:",
    "- Do not report style preferences.",
    "- Do not duplicate obvious static findings unless you can add contextual reasoning.",
    "- Do not claim certainty when the issue depends on missing context.",
    "- Prefer fewer, higher-confidence findings.",
    "- Use the original line number from the supplied code.",
    "",
    `File: ${input.file}`,
    "",
    "Code:",
    "```c",
    input.code,
    "```",
  ].join("\n");
}
