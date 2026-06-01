# Launch Posts

## GitHub description

Local QA gate for AI-generated code: tests, build, security smells, UI slop, docs drift, claim audit, SARIF, receipts, and PR risk scoring.

## Short tagline

Your AI agent says it is done. AgentProof tells you if it is shippable.

## X / LinkedIn launch post

I built AgentProof.

AI agents are fast. That is the problem.

They can say "done" with the same confidence whether tests passed, build failed, a token leaked, or the UI is still full of placeholders.

AgentProof is a local QA gate for agent-generated PRs:

- test/build/lint/typecheck detection
- Python, Go, Rust, JS/TS support
- security smells
- UI slop
- docs drift
- claim audit
- baseline mode
- SARIF + HTML + PR comment
- JSON evidence receipt

The twist: it can audit the agent's final message.

If the agent says "tests passed" or "ready to ship", AgentProof asks for proof.

Your agent says it is done. AgentProof tells you if it is shippable.

## Hacker News title options

- Show HN: AgentProof - local QA gate for AI-generated code
- Show HN: I built a tool that checks whether AI coding agents actually proved their work
- Show HN: AgentProof asks AI coding agents for receipts before merge

## Reddit title options

- I built a local QA gate for AI-generated PRs
- AgentProof: make coding agents attach proof before saying done
- Open-source tool to catch AI slop, failed builds, leaked secrets, and unproven agent claims

## README hero snippet

```text
Your AI agent says it is done.
AgentProof tells you if it is shippable.
```

## Before / after post

AI agents are fast. That is the problem.

I built AgentProof because agent-written PRs increasingly say:

> tests passed, build passed, ready to ship

while still leaving behind risky code, vague copy, missing accessibility, unsafe HTML, or unproven claims.

The demo is simple:

- Bad agent PR: overconfident final claim, risky code still present.
- Good agent PR: risk removed, receipt generated, final claim scoped to evidence.

AgentProof turns "trust me bro" into a reviewable receipt.

Repo: <github-url>

## Adoption rollout post

The hardest part of adding a new CI gate is not the command.

It is the rollout.

AgentProof now includes a three-phase adoption guide:

- Phase 1: observe only
- Phase 2: baseline and PR gate
- Phase 3: strict agent contract

So a team can start with signal, capture known debt, then require proof before agents claim completion.

Docs: `docs/ADOPTION.md`
Repo: <github-url>

## Monorepo post

A lot of AI coding demos assume a tiny single-package repo.

Real teams often have:

- `apps/web`
- `packages/api`
- `packages/ui`
- package-level tests/builds/lints
- agents claiming the whole workspace is fine

AgentProof now has first-pass JS workspace support:

```bash
npm run demo:monorepo
```

It discovers common `workspaces` layouts, labels package-level proof commands, and audits the agent claim against observed evidence.

Not a full monorepo graph engine yet. Just a practical trust gate for common workspace layouts.

Repo: <github-url>

## Comparison post

AgentProof is not trying to replace CodeQL, Semgrep, Gitleaks, linters, tests, or CI.

Those tools are still useful.

AgentProof answers a different question:

> An AI agent changed this PR. Is there enough local evidence to trust the claim that it is done?

It ties together verification commands, security smells, UI/docs slop, policy budgets, baselines, SARIF, receipts, summaries, and claim audit.

The key feature is not another scanner.

The key feature is that the agent's final message is no longer allowed to float above the evidence.

Repo: <github-url>
