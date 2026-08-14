import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { analyzeCode } from "./analysis/analyzer.js";

const args = process.argv.slice(2);
const includeAi = args.includes("--ai");
const filePath = args.find((arg) => arg !== "--ai");

if (!filePath) {
  console.error("Usage: npm run analyze:file -- <path-to-code-file> [--ai]");
  process.exit(1);
}

const code = await readFile(filePath, "utf8");
const result = await analyzeCode(
  {
    file: basename(filePath),
    code,
  },
  {
    includeAi,
  },
);

console.log(JSON.stringify(result, null, 2));
