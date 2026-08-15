import type { PullRequestReference, RepositoryReference } from "./types.js";

const githubPullRequestPattern =
  /^https:\/\/github\.com\/([^/\s]+)\/([^/\s]+)\/pull\/(\d+)(?:[/?#].*)?$/;
const githubRepositoryPattern =
  /^https:\/\/github\.com\/([^/\s]+)\/([^/\s]+?)(?:\.git)?(?:[/?#].*)?$/;

export function parseGithubPullRequestUrl(url: string): PullRequestReference {
  const trimmedUrl = url.trim();
  const match = trimmedUrl.match(githubPullRequestPattern);

  if (!match) {
    throw new Error("Expected a GitHub pull request URL like https://github.com/owner/repo/pull/42.");
  }

  const [, owner, repo, pullNumber] = match;

  return {
    owner,
    repo,
    pullNumber: Number(pullNumber),
  };
}

export function isGithubPullRequestUrl(value: string): boolean {
  return githubPullRequestPattern.test(value.trim());
}

export function parseGithubRepositoryUrl(url: string): RepositoryReference {
  const trimmedUrl = url.trim();
  const match = trimmedUrl.match(githubRepositoryPattern);

  if (!match || trimmedUrl.includes("/pull/")) {
    throw new Error("Expected a GitHub repository URL like https://github.com/owner/repo.");
  }

  const [, owner, repo] = match;

  return {
    owner,
    repo,
  };
}

export function isGithubRepositoryUrl(value: string): boolean {
  const trimmedValue = value.trim();
  return githubRepositoryPattern.test(trimmedValue) && !trimmedValue.includes("/pull/");
}
