export interface NumberedLine {
  number: number;
  text: string;
}

export function getNumberedLines(code: string): NumberedLine[] {
  return code.split(/\r?\n/).map((text, index) => ({
    number: index + 1,
    text,
  }));
}

export function countMatches(text: string, pattern: RegExp): number {
  return [...text.matchAll(pattern)].length;
}

export function hasObviousNullCheck(code: string, variableName: string): boolean {
  const escapedName = escapeRegExp(variableName);
  const checks = [
    new RegExp(`if\\s*\\(\\s*!\\s*${escapedName}\\s*\\)`),
    new RegExp(`if\\s*\\(\\s*${escapedName}\\s*==\\s*NULL\\s*\\)`),
    new RegExp(`if\\s*\\(\\s*NULL\\s*==\\s*${escapedName}\\s*\\)`),
    new RegExp(`if\\s*\\(\\s*${escapedName}\\s*==\\s*nullptr\\s*\\)`),
    new RegExp(`if\\s*\\(\\s*nullptr\\s*==\\s*${escapedName}\\s*\\)`),
  ];

  return checks.some((check) => check.test(code));
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
