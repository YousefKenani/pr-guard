import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { analyzeCode } from "./analysis/analyzer.js";

const [, , filePath] = process.argv;

if (!filePath) {
  console.error("Usage: npm run analyze:sample -- <path-to-code-file>");
  process.exit(1);
}

const code = await readFile(filePath, "utf8");
const result = analyzeCode({
  file: basename(filePath),
  code,
});

console.log(JSON.stringify(result, null, 2));
