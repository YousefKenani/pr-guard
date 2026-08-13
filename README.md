# PR Guard

AI-powered GitHub pull request reviewer, built one phase at a time.

## Phase 1

This phase creates the local analysis engine foundation:

- A shared `Finding` type used by every future analyzer.
- A basic `analyzeCode` function that accepts source code and returns structured results.
- A simple CLI entry point for testing the engine locally.

Later phases will add deterministic static rules, AI review, risk scoring, GitHub integration, and the web dashboard.

## Run locally

```bash
npm install
npm run build
npm run analyze:sample
```
