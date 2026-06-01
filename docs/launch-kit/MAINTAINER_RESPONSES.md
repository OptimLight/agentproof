# Maintainer Response Bank

Use these snippets during launch week.

## Hacker News / Reddit short answer

```text
AgentProof is not another coding agent. It is a local gate for agent-written PRs: run existing proof commands, catch obvious security/UI/docs smells, audit the agent's final claim, and emit artifacts reviewers can inspect.
```

## "How is this different from lint?"

```text
Linters inspect code style or static correctness. AgentProof ties together verification commands, security smells, UI/documentation slop, claim audit, policy budgets, receipts, SARIF, and GitHub Action output around one question: can this AI-generated PR be trusted enough to merge?
```

## "Can I trust the score?"

```text
The score is not a proof of correctness. It is a merge-risk signal. The useful part is the evidence behind it: commands observed, findings, claim audit, baseline, suppressions, and artifacts.
```

## "Does it run remote AI?"

```text
No. AgentProof is local by default and does not send project source to a remote model. It may run local project commands unless you pass `--no-run-scripts`.
```

## "Can I use it on untrusted repos?"

```text
Start with `--no-run-scripts`. AgentProof does not sandbox project commands, so do not execute scripts from untrusted code unless you are comfortable with that risk.
```

## "Does it support monorepos?"

```text
It has first-pass JavaScript workspace support for common `workspaces`, `apps/*`, and `packages/*` layouts, plus explicit `packages` config. It is not a full monorepo graph engine yet.
```

## "What should I try first?"

```bash
npx agentproof --init --all
npx agentproof --path . --profile strict --claim .agentproof/final-claim.md
```
