# AgentProof Comparison

AgentProof is not a linter, not a test runner, not a secret scanner, not a SAST platform, and not another coding agent.

It is a local trust gate for AI-generated pull requests.

The core question is different:

```text
Can this agent-written PR be trusted enough to merge?
```

## Positioning matrix

| Adjacent tool | What it does well | What it usually does not own | AgentProof role |
|---|---|---|---|
| Test runners | Prove covered behavior still works | Agent final claims, policy receipts, UI/docs slop | Runs or records tests as evidence in a broader verdict. |
| Linters | Enforce style and static correctness | Claim audit, baseline rollout, security/doc/UI trust signals | Treats lint as one signal, not the whole gate. |
| Type checkers | Catch broken contracts | Runtime proof, agent overclaims, review artifacts | Treats typecheck as evidence before merge. |
| Secret scanners | Catch credential exposure | Build/test proof, UI quality, agent claims | Adds secret findings to PR shippability context. |
| SAST / code scanning | Find security patterns at depth | Agent workflow and final-answer honesty | Emits SARIF and complements deeper scanners. |
| CI pipelines | Execute commands reliably | A human-readable agent-quality narrative | Turns scattered CI signals into a verdict and artifacts. |
| Code review bots | Comment on diffs | Local proof and agent-specific claim audit | Produces deterministic local evidence for bots to consume. |
| Danger-style automation | Enforce PR conventions | Security/UI/docs/claim evidence by default | Can consume AgentProof artifacts as one input. |
| AI coding agents | Generate and modify code quickly | Honest proof that the work is complete | Checks what agents leave behind and what they claim. |

## Named adjacent tools

These tools are useful. AgentProof is designed to sit beside them, not replace them.

| Tool family | Examples | How AgentProof complements it |
|---|---|---|
| Code scanning | CodeQL, Semgrep | AgentProof can emit SARIF and add claim/policy context around findings. |
| Secret scanning | Gitleaks, TruffleHog, platform secret scanning | AgentProof catches simple credential-shaped mistakes and reminds teams to use dedicated secret tooling. |
| Linters/typecheckers | ESLint, TypeScript, Ruff, mypy | AgentProof runs or records these commands as proof signals. |
| Test/build CI | GitHub Actions, CircleCI, Buildkite | AgentProof packages command results into receipts, summaries, PR comments, and history. |
| PR automation | Danger, review bots, custom GitHub Actions | AgentProof provides structured artifacts those tools can consume. |

## What makes AgentProof different

### 1. Claim audit

Most tools inspect files. AgentProof also inspects the agent's final message.

If an agent says:

```text
Tests passed, build passed, lint is clean, ready to ship.
```

AgentProof asks whether the evidence actually supports that claim.

### 2. Evidence receipts

AgentProof can emit a portable JSON receipt for final answers, PR metadata, audit trails, and dashboards.

Receipts are useful because agents and reviewers can refer to evidence instead of vibes.

### 3. Baseline adoption

Legacy repos can adopt AgentProof without pretending historical debt does not exist.

Known findings remain visible, but the active gate can focus on new risk.

### 4. Policy layer

Teams can tune profiles, budgets, suppressions, severity overrides, custom commands, baselines, and policy packs.

This turns a pile of warnings into an explicit team decision.

### 5. Agent workflow integration

AgentProof ships instruction templates for Codex, Claude Code, Cursor, Copilot, OpenCode, and internal harnesses.

The contract is simple:

```text
Before you claim completion, write the final claim, run AgentProof, and include the proof.
```

### 6. Multi-artifact output

AgentProof can write:

- Markdown report;
- HTML report;
- SARIF;
- PR comment Markdown;
- receipt JSON;
- summary JSON;
- SVG badge;
- history JSONL;
- baseline JSON.

See `docs/ARTIFACTS.md` for the artifact map.

## When not to use AgentProof

AgentProof is probably not the right primary tool if you only need:

- deep static application security testing;
- dependency vulnerability scanning;
- license compliance scanning;
- runtime monitoring;
- cloud posture management;
- code formatting;
- a full monorepo dependency graph engine.

Use the dedicated tool for those jobs.

Use AgentProof when the problem is:

```text
An AI agent changed code. Before merge, we need a local, reviewable trust gate.
```

## Non-goals

- AgentProof does not replace project tests.
- AgentProof does not replace human review.
- AgentProof does not replace dedicated secret scanners or SAST tools.
- AgentProof does not auto-fix code by default.
- AgentProof does not require a cloud service.
- AgentProof does not send source code to an LLM in the default path.
- AgentProof does not prove software is secure.

## The category

AgentProof is a local trust gate for agent-generated code.

A useful shorthand:

```text
CI tells you what ran.
AgentProof tells you whether the agent's PR is shippable enough to review or merge.
```
