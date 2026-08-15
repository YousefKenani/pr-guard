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

## Phase 3

This phase adds an optional AI reviewer using the OpenAI Responses API with structured JSON output.

The AI reviewer:

- Reviews the supplied code for contextual correctness, security, memory/resource, error-handling, and maintainability risks.
- Returns the same `Finding` shape as the static analyzer.
- Is opt-in, so local static analysis still works without an API key.

## Phase 4

This phase adds the risk engine. The risk engine converts all findings into:

- `riskScore`: a 0-100 score.
- `riskLevel`: `low`, `medium`, `high`, or `critical`.
- `rawScore`: the uncapped score before limiting to 100.
- severity counts for the dashboard and future GitHub comments.

The score uses severity weights plus small category/source adjustments, so security and memory findings affect the result more than simple maintainability findings.

To enable AI review, set:

```bash
export OPENAI_API_KEY="your_api_key_here"
export OPENAI_MODEL="gpt-5-nano"
```

Then run:

```bash
npm run analyze:file -- examples/vulnerable.c --ai
```

## Run locally

```bash
npm install
npm run build
npm run analyze:sample
npm run analyze:vulnerable
npm run analyze:file -- examples/vulnerable.c
npm run analyze:file -- examples/vulnerable.c --ai
npm test
```
