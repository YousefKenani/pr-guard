# PR Guard

AI-powered GitHub pull request reviewer, built one phase at a time.

## Phase 1

This phase creates the local analysis engine foundation:

- A shared `Finding` type used by every future analyzer.
- A basic `analyzeCode` function that accepts source code and returns structured results.
- A simple CLI entry point for testing the engine locally.

Later phases will add deterministic static rules, AI review, risk scoring, GitHub integration, and the web dashboard.

## Phase 2

This phase adds a deterministic static analyzer for C code. The current rules are heuristic, not a full compiler:

- Unsafe C functions such as `gets`, `strcpy`, `strcat`, `sprintf`, and unsafe `scanf("%s")` usage.
- Allocations with `malloc`, `calloc`, or `realloc` that do not have an obvious matching `free`.
- Allocations that do not have an obvious null check.
- Functions with high branch/loop complexity.

## Run locally

```bash
npm install
npm run build
npm run analyze:sample
npm run analyze:vulnerable
npm run analyze:file -- examples/vulnerable.c
```
