import type { AnalysisInput, Finding } from "../types.js";
import { complexityRule } from "./complexity-rule.js";
import { mallocRule } from "./malloc-rule.js";
import { nullCheckRule } from "./null-check-rule.js";
import type { AnalysisRule } from "./types.js";
import { unsafeFunctionsRule } from "./unsafe-functions-rule.js";

const staticRules: AnalysisRule[] = [
  unsafeFunctionsRule,
  mallocRule,
  nullCheckRule,
  complexityRule,
];

export function runStaticAnalysis(input: AnalysisInput): Finding[] {
  return staticRules.flatMap((rule) => rule.analyze(input));
}
