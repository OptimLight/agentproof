# Maintainer Playbook

AgentProof is built for a noisy launch environment: developers, security folks, agent-tool users, and skeptics will all ask different questions.

This playbook helps maintainers convert launch attention into useful issues, safe fixes, and a credible roadmap.

## First 48 hours

Primary goals:

- keep the README promise clear;
- answer install and CI friction quickly;
- turn vague feedback into reproducible issues;
- protect rule ids, schemas, and CLI flags from accidental churn;
- avoid overclaiming maturity.

Do not claim AgentProof is a complete security scanner, full monorepo graph engine, or replacement for tests and review.

## Triage priority

| Priority | Handle first when | Examples |
|---|---|---|
| P0 | AgentProof exposes sensitive values or breaks public install | secret leaked in report, CLI cannot start, npm package unusable |
| P1 | Core launch promise fails | claim audit broken, demo broken, GitHub Action unusable, receipt invalid |
| P2 | Adoption friction | confusing docs, workspace edge case, noisy false positive, missing policy pack |
| P3 | Expansion ideas | new language checks, richer dashboards, rule suggestions, UI polish |

## Labels

Recommended labels:

| Label | Use for |
|---|---|
| `bug` | Reproducible broken behavior. |
| `security` | Sensitive output, command execution risk, or scanner safety. |
| `rule request` | A proposed static check or claim audit rule. |
| `false positive` | A rule fires in a reasonable safe case. |
| `github-action` | Composite action, workflow, outputs, SARIF upload. |
| `agent workflow` | Codex, Claude Code, Cursor, Copilot, OpenCode, or harness behavior. |
| `policy-pack` | Starter config profiles, budgets, thresholds. |
| `monorepo` | Workspace detection, package-level commands, package cwd. |
| `schema` | Config, receipt, summary, or public JSON contract. |
| `demo` | Fixtures, launch story, before/after examples. |
| `docs` | README, guides, launch copy, examples. |
| `good first issue` | Small, bounded contribution. |
| `needs reproduction` | Interesting but not actionable yet. |

## Response templates

### Bug report needs reproduction

```text
Thanks for reporting this. To make it actionable, can you share:

- AgentProof version or commit;
- exact command;
- project shape, for example single package or workspace;
- smallest relevant output;
- whether `--no-run-scripts` changes the behavior?

Please redact secrets and private customer data before posting.
```

### False positive

```text
Thanks, this is exactly the kind of feedback that makes AgentProof better.

Can you share the smallest safe snippet that triggers the finding, plus why the code is safe in this context?

A good fix may be one of:

- tune the rule;
- improve the suggestion;
- document a narrow suppression;
- add a policy-pack recommendation.
```

### Rule request

```text
Good rule candidate. To evaluate it, we need:

- bad example;
- expected finding title/severity;
- why a human reviewer would care;
- safer alternative;
- likely false positives.

If you can put that into the Rule Gallery style, it will be much easier to review.
```

### Security-sensitive report

```text
Thanks for raising this. If the report includes secrets, credentials, private data, or an exploit path in AgentProof itself, please avoid posting more detail publicly.

Use a private GitHub security advisory if available, or contact the maintainers through the repository profile.
```

### Feature request beyond scope

```text
This is useful, but it is beyond AgentProof's current core loop.

AgentProof should stay focused on local, explainable proof for AI-generated PRs. If we add this, it needs a small MVP path with clear evidence, low noise, and no cloud dependency in the default path.
```

## Merge policy

Do not merge changes that:

- rename rule ids without migration notes;
- change receipt or summary schemas without docs;
- make default scans slower by requiring network calls;
- hide failed verification commands;
- weaken secret redaction;
- encourage agents to claim completion without evidence.

Prefer changes that:

- catch a real agent failure mode;
- reduce false positives;
- improve adoption in GitHub Actions;
- make artifacts easier for humans or bots to consume;
- keep the CLI predictable.

## Release checklist owner flow

Before cutting a release:

1. Review `templates/release-checklist.md`.
2. Confirm public schemas are intentionally stable.
3. Confirm demos still tell the before/after story.
4. Confirm launch copy avoids overclaims.
5. Confirm artifacts do not expose obvious sensitive values.
6. Run validation intentionally.

## Public positioning guardrails

Say:

```text
AgentProof is a local QA gate for AI-generated PRs.
```

Say:

```text
It turns agent confidence into reviewable proof.
```

Do not say:

```text
AgentProof proves your code is secure.
```

Do not say:

```text
AgentProof replaces review, tests, or dedicated security tooling.
```
