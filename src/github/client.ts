import type {
  ChangedFile,
  PullRequestData,
  PullRequestReference,
  RepositoryData,
  RepositoryFile,
  RepositoryReference,
} from "./types.js";

interface GitHubPullRequestResponse {
  html_url: string;
  title: string;
  user: {
    login: string;
  } | null;
}

interface GitHubPullRequestFileResponse {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

interface GitHubRepositoryResponse {
  name: string;
  full_name: string;
  html_url: string;
  default_branch: string;
}

interface GitHubBranchResponse {
  commit: {
    sha: string;
  };
}

interface GitHubTreeResponse {
  truncated: boolean;
  tree: Array<{
    path: string;
    type: "blob" | "tree" | "commit";
    size?: number;
    sha: string;
  }>;
}

interface GitHubBlobResponse {
  content: string;
  encoding: string;
  size: number;
}

const GITHUB_API_URL = "https://api.github.com";
const pageSize = 100;
const maxRepositoryFiles = 50;
const maxRepositoryFileSize = 200_000;

export async function fetchPullRequestData(
  reference: PullRequestReference,
): Promise<PullRequestData> {
  const pullRequest = await githubRequest<GitHubPullRequestResponse>(
    `/repos/${reference.owner}/${reference.repo}/pulls/${reference.pullNumber}`,
  );
  const files = await fetchPullRequestFiles(reference);

  return {
    ...reference,
    title: pullRequest.title,
    author: pullRequest.user?.login ?? "unknown",
    url: pullRequest.html_url,
    files,
  };
}

export async function fetchRepositoryData(
  reference: RepositoryReference,
): Promise<RepositoryData> {
  const repository = await githubRequest<GitHubRepositoryResponse>(
    `/repos/${reference.owner}/${reference.repo}`,
  );
  const branch = await githubRequest<GitHubBranchResponse>(
    `/repos/${reference.owner}/${reference.repo}/branches/${encodeURIComponent(repository.default_branch)}`,
  );
  const tree = await githubRequest<GitHubTreeResponse>(
    `/repos/${reference.owner}/${reference.repo}/git/trees/${branch.commit.sha}?recursive=1`,
  );
  const sourceEntries = tree.tree
    .filter((entry) => entry.type === "blob")
    .filter((entry) => isSupportedSourceFile(entry.path))
    .filter((entry) => !isGeneratedSourceFile(entry.path))
    .filter((entry) => (entry.size ?? 0) <= maxRepositoryFileSize)
    .slice(0, maxRepositoryFiles);
  const files = await Promise.all(
    sourceEntries.map((entry) => fetchRepositoryFile(reference, entry.path, entry.sha)),
  );

  return {
    ...reference,
    name: repository.name,
    fullName: repository.full_name,
    defaultBranch: repository.default_branch,
    url: repository.html_url,
    files,
  };
}

async function fetchPullRequestFiles(reference: PullRequestReference): Promise<ChangedFile[]> {
  const files: ChangedFile[] = [];
  let page = 1;

  while (true) {
    const pageItems = await githubRequest<GitHubPullRequestFileResponse[]>(
      `/repos/${reference.owner}/${reference.repo}/pulls/${reference.pullNumber}/files?per_page=${pageSize}&page=${page}`,
    );

    files.push(...pageItems.map(toChangedFile));

    if (pageItems.length < pageSize) {
      return files;
    }

    page += 1;
  }
}

async function fetchRepositoryFile(
  reference: RepositoryReference,
  path: string,
  sha: string,
): Promise<RepositoryFile> {
  const blob = await githubRequest<GitHubBlobResponse>(
    `/repos/${reference.owner}/${reference.repo}/git/blobs/${sha}`,
  );

  if (blob.encoding !== "base64") {
    throw new Error(`Unsupported GitHub blob encoding for ${path}: ${blob.encoding}`);
  }

  return {
    path,
    size: blob.size,
    content: Buffer.from(blob.content.replace(/\s/g, ""), "base64").toString("utf8"),
  };
}

async function githubRequest<T>(path: string): Promise<T> {
  const token = process.env.GITHUB_TOKEN;
  const response = await fetch(`${GITHUB_API_URL}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "pr-guard-local-analyzer",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(await formatGitHubError(response));
  }

  return (await response.json()) as T;
}

function toChangedFile(file: GitHubPullRequestFileResponse): ChangedFile {
  return {
    filename: file.filename,
    status: file.status,
    additions: file.additions,
    deletions: file.deletions,
    changes: file.changes,
    patch: file.patch,
  };
}

function isSupportedSourceFile(path: string): boolean {
  if (/(^|\/)(node_modules|dist|build|coverage|vendor)\//.test(path)) {
    return false;
  }

  if (/(^|\/)(package-lock|yarn.lock|pnpm-lock|composer.lock|Cargo.lock)$/.test(path)) {
    return false;
  }

  return /\.(c|h|cc|cpp|hpp|js|jsx|ts|tsx|mjs|cjs)$/.test(path);
}

function isGeneratedSourceFile(path: string): boolean {
  return /(^|\/)(generated_|Generated)|generated_plugin_registrant|GeneratedPluginRegistrant/.test(
    path,
  );
}

async function formatGitHubError(response: Response): Promise<string> {
  const body = await response.text();

  try {
    const parsed = JSON.parse(body) as { message?: string };
    return `GitHub API request failed with status ${response.status}: ${parsed.message ?? body}`;
  } catch {
    return `GitHub API request failed with status ${response.status}: ${body}`;
  }
}
