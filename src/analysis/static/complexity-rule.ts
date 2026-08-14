import type { Finding, Severity } from "../types.js";
import { countMatches, getNumberedLines, type NumberedLine } from "./helpers.js";
import type { AnalysisRule } from "./types.js";

interface FunctionBlock {
  name: string;
  startLine: number;
  body: string;
}

const functionStartPattern =
  /^\s*(?:static\s+)?(?:inline\s+)?[A-Za-z_][\w\s*]*\s+([A-Za-z_]\w*)\s*\([^;]*\)\s*\{/;

export const complexityRule: AnalysisRule = {
  name: "function-complexity",
  analyze(input): Finding[] {
    return findFunctionBlocks(input.code)
      .map((block) => buildComplexityFinding(input.file, block))
      .filter((finding): finding is Finding => finding !== null);
  },
};

function buildComplexityFinding(file: string, block: FunctionBlock): Finding | null {
  const complexity =
    1 +
    countMatches(block.body, /\bif\b/g) +
    countMatches(block.body, /\bfor\b/g) +
    countMatches(block.body, /\bwhile\b/g) +
    countMatches(block.body, /\bswitch\b/g) +
    countMatches(block.body, /\bcase\b/g);

  const severity = getComplexitySeverity(complexity);

  if (!severity) {
    return null;
  }

  return {
    file,
    line: block.startLine,
    severity,
    category: "complexity",
    description: `Function ${block.name} has heuristic complexity ${complexity}.`,
    suggestion: "Consider splitting the function or simplifying nested branches.",
    source: "static",
  };
}

function getComplexitySeverity(complexity: number): Severity | null {
  if (complexity > 10) {
    return "high";
  }

  if (complexity >= 6) {
    return "medium";
  }

  return null;
}

function findFunctionBlocks(code: string): FunctionBlock[] {
  const lines = getNumberedLines(code);
  const blocks: FunctionBlock[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = line.text.match(functionStartPattern);

    if (!match || isControlStatement(match[1])) {
      continue;
    }

    const block = collectFunctionBlock(match[1], line, lines, index);
    blocks.push(block);
    index = block.endIndex;
  }

  return blocks;
}

function collectFunctionBlock(
  name: string,
  startLine: NumberedLine,
  lines: NumberedLine[],
  startIndex: number,
): FunctionBlock & { endIndex: number } {
  let depth = 0;
  const bodyLines: string[] = [];

  for (let index = startIndex; index < lines.length; index += 1) {
    const text = lines[index].text;
    bodyLines.push(text);
    depth += countMatches(text, /\{/g);
    depth -= countMatches(text, /\}/g);

    if (depth === 0) {
      return {
        name,
        startLine: startLine.number,
        body: bodyLines.join("\n"),
        endIndex: index,
      };
    }
  }

  return {
    name,
    startLine: startLine.number,
    body: bodyLines.join("\n"),
    endIndex: lines.length - 1,
  };
}

function isControlStatement(name: string): boolean {
  return ["if", "for", "while", "switch"].includes(name);
}
