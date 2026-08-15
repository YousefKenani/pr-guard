import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isGithubPullRequestUrl,
  isGithubRepositoryUrl,
  parseGithubPullRequestUrl,
  parseGithubRepositoryUrl,
} from "./parse-url.js";

describe("parseGithubPullRequestUrl", () => {
  it("parses a valid pull request URL", () => {
    assert.deepEqual(parseGithubPullRequestUrl("https://github.com/foo/bar/pull/19"), {
      owner: "foo",
      repo: "bar",
      pullNumber: 19,
    });
  });

  it("accepts trailing URL parts", () => {
    assert.deepEqual(parseGithubPullRequestUrl("https://github.com/foo/bar/pull/19/files"), {
      owner: "foo",
      repo: "bar",
      pullNumber: 19,
    });
  });

  it("rejects non-PR URLs", () => {
    assert.equal(isGithubPullRequestUrl("https://github.com/foo/bar/issues/19"), false);
    assert.throws(() => parseGithubPullRequestUrl("https://github.com/foo/bar/issues/19"));
  });
});

describe("parseGithubRepositoryUrl", () => {
  it("parses a valid repository URL", () => {
    assert.deepEqual(parseGithubRepositoryUrl("https://github.com/foo/bar"), {
      owner: "foo",
      repo: "bar",
    });
  });

  it("accepts .git suffixes", () => {
    assert.deepEqual(parseGithubRepositoryUrl("https://github.com/foo/bar.git"), {
      owner: "foo",
      repo: "bar",
    });
  });

  it("does not treat pull request URLs as repository URLs", () => {
    assert.equal(isGithubRepositoryUrl("https://github.com/foo/bar/pull/19"), false);
    assert.equal(isGithubPullRequestUrl("https://github.com/foo/bar/pull/19"), true);
    assert.throws(() => parseGithubRepositoryUrl("https://github.com/foo/bar/pull/19"));
  });
});
