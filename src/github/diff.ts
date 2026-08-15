export function extractAddedLinesForAnalysis(patch: string): string {
  const outputLines: string[] = [];
  let newLineNumber: number | null = null;

  for (const line of patch.split(/\r?\n/)) {
    const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);

    if (hunk) {
      newLineNumber = Number(hunk[1]);
      continue;
    }

    if (newLineNumber === null || line.startsWith("\\ No newline")) {
      continue;
    }

    if (line.startsWith("+")) {
      padUntilLine(outputLines, newLineNumber);
      outputLines[newLineNumber - 1] = line.slice(1);
      newLineNumber += 1;
      continue;
    }

    if (line.startsWith(" ")) {
      newLineNumber += 1;
    }
  }

  return outputLines.join("\n");
}

function padUntilLine(lines: string[], lineNumber: number): void {
  while (lines.length < lineNumber) {
    lines.push("");
  }
}
