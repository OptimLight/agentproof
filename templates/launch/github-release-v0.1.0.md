# AgentProof v0.1.0

Your AI agent says it is done. AgentProof tells you if it is shippable.

AgentProof is a local QA gate for AI-generated code and agent PRs.

## What is included

- Claim audit for agent final messages.
- Local verification for JS/TS, Python, Go, Rust, and custom commands.
- Static checks for secrets, unsafe HTML, UI slop, placeholder copy, docs readiness, and hygiene.
- Policy profiles: relaxed, standard, strict.
- Severity budgets, overrides, suppressions.
- Baseline mode for legacy repos.
- Markdown, JSON, HTML, SARIF, badge SVG, PR comment, and evidence receipt outputs.
- Receipt verification.
- Run history and trend reports.
- Doctor mode.
- Rule explain mode.
- Config and receipt JSON schemas.
- GitHub Actions scaffold.
- Agent contract scaffold.

## Quick start

```bash
npx agentproof --init --ci --agent
npx agentproof --doctor
```

## Demo

```bash
npm run demo:claim
npm run demo:sarif
```

## Why it matters

AI agents can say "done" with confidence even when the proof is missing. AgentProof turns that confidence into evidence: commands, findings, verdicts, receipts, and policy gates.
