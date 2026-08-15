import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseEnvLine } from "./env.js";

describe("parseEnvLine", () => {
  it("parses plain key value lines", () => {
    assert.deepEqual(parseEnvLine("OPENAI_MODEL=gpt-5-nano"), {
      key: "OPENAI_MODEL",
      value: "gpt-5-nano",
    });
  });

  it("parses exported and quoted values", () => {
    assert.deepEqual(parseEnvLine('export GITHUB_TOKEN="secret"'), {
      key: "GITHUB_TOKEN",
      value: "secret",
    });
  });

  it("ignores comments and invalid keys", () => {
    assert.equal(parseEnvLine("# comment"), null);
    assert.equal(parseEnvLine("BAD-KEY=value"), null);
  });
});
