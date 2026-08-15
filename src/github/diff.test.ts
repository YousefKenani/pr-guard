import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractAddedLinesForAnalysis } from "./diff.js";

describe("extractAddedLinesForAnalysis", () => {
  it("keeps added code on its GitHub new-file line numbers", () => {
    const patch = [
      "@@ -7,5 +7,6 @@ int main(void) {",
      " int value = 1;",
      "+char *name = malloc(128);",
      " if (value) {",
      "-  puts(\"old\");",
      "+  gets(buffer);",
      " }",
    ].join("\n");

    const lines = extractAddedLinesForAnalysis(patch).split("\n");

    assert.equal(lines[7], "char *name = malloc(128);");
    assert.equal(lines[9], "  gets(buffer);");
  });
});
