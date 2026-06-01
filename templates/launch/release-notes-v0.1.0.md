# AgentProof v0.1.0

AgentProof is a local QA gate for AI-generated code and agent PRs.

## Highlights

- Claim audit: verify what the agent says it proved.
- Local verification: JS/TS, Python, Go, Rust, and custom commands.
- Static checks: secrets, unsafe HTML, UI slop, placeholder copy, docs readiness.
- Policy layer: relaxed/standard/strict profiles, budgets, suppressions, overrides.
- Baseline mode: adopt on legacy repos without blocking on known debt.
- Outputs: Markdown, JSON, HTML, SARIF, badge SVG, PR comment, evidence receipt.
- CI scaffold: `agentproof --init --ci`.
- Doctor mode: inspect what AgentProof will do before it runs.

## Install

```bash
npx agentproof --init --ci
npx agentproof --doctor
```

## Demo

```bash
npm run demo:claim
npm run demo:sarif
```

## The promise

Your AI agent says it is done. AgentProof tells you if it is shippable.
