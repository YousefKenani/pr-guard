import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { analyzeCode } from "./analysis/analyzer.js";
import { loadEnvFile } from "./config/env.js";
import { analyzePullRequestUrl, analyzeRepositoryUrl } from "./github/analyzer.js";
import { isGithubPullRequestUrl, isGithubRepositoryUrl } from "./github/parse-url.js";

loadEnvFile();

const args = process.argv.slice(2);
const includeAi = args.includes("--ai");
const analyzePr = args.includes("--pr");
const analyzeRepo = args.includes("--repo");
const target = args.find((arg) => !arg.startsWith("--"));

if (!target) {
  console.error("Usage: npm run analyze:file -- <path-to-code-file> [--ai]");
  console.error("   or: npm run analyze:pr -- <github-pr-url> [--ai]");
  console.error("   or: npm run analyze:repo -- <github-repo-url> [--ai]");
  process.exit(1);
}

const options = {
  includeAi,
};

const result = await analyzeTarget(target, {
  includeAi,
  analyzePr,
  analyzeRepo,
});

console.log(JSON.stringify(result, null, 2));

async function analyzeTarget(
  target: string,
  options: { includeAi: boolean; analyzePr: boolean; analyzeRepo: boolean },
): Promise<unknown> {
  if (options.analyzePr || isGithubPullRequestUrl(target)) {
    return analyzePullRequestUrl(target, options);
  }

  if (options.analyzeRepo || isGithubRepositoryUrl(target)) {
    return analyzeRepositoryUrl(target, options);
  }

  return analyzeLocalFile(target, options);
}

async function analyzeLocalFile(
  filePath: string,
  options: { includeAi: boolean },
): Promise<Awaited<ReturnType<typeof analyzeCode>>> {
  const code = await readFile(filePath, "utf8");

  return analyzeCode(
    {
      file: basename(filePath),
      code,
    },
    options,
  );
}
