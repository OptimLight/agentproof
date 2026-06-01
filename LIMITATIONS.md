# Limitations

AgentProof is a local evidence gate for AI-generated pull requests.

It is useful because it is boring, local, explainable, and reviewable. It is not magic.

## What AgentProof does not prove

AgentProof does not prove that:

- the software is secure;
- the software is production-ready;
- every bug has been found;
- every accessibility issue has been found;
- every secret has been detected;
- every agent claim is truthful;
- every dependency is safe;
- every generated artifact is safe to publish;
- human review is unnecessary.

AgentProof gives maintainers a stronger signal before merge. It does not replace judgment.

## It does not replace existing tools

Keep using:

- tests;
- type checkers;
- linters;
- code review;
- secret scanners;
- SAST and dependency scanners;
- accessibility tools;
- manual QA;
- security review for sensitive systems.

AgentProof collects some of that evidence and adds agent-specific checks, claim audit, policy gates, and review artifacts.

## Static checks are heuristic

Some checks are pattern-based.

That means AgentProof can:

- miss real issues;
- flag false positives;
- require suppressions for intentional code;
- need rule tuning for specific frameworks.

Use baselines and suppressions with reasons and expiry dates. Do not blindly lower the gate forever.

## Command execution depends on your project

When script execution is enabled, AgentProof runs detected project commands such as tests, lint, typecheck, or build.

Those scripts belong to your project and may:

- be slow;
- fail for environmental reasons;
- access the network;
- require secrets;
- behave differently in CI and local machines.

Use static-only mode for first scans or untrusted repositories:

```bash
npx agentproof --path . --no-run-scripts
```

## Claim audit is evidence matching, not mind reading

AgentProof can flag unsupported claims such as "tests passed" when no passing test evidence was observed.

It cannot know:

- what happened outside the run;
- whether someone manually verified something without writing it down;
- whether an agent omitted important context;
- whether a passing command actually covered the risky behavior.

Good final claims should be scoped to observed evidence.

## Monorepo support is intentionally conservative

AgentProof includes first-pass JavaScript workspace/package support.

Before enforcing a strict monorepo gate, verify that:

- the right packages are detected;
- commands run in the expected package directories;
- changed-file mode matches your branch strategy;
- artifacts are understandable to reviewers.

## GitHub Action behavior depends on workflow setup

GitHub features require correct workflow configuration.

Examples:

- SARIF upload needs `security-events: write`;
- PR comments need `pull-requests: write` through a separate comment action;
- changed-file scans need enough git history, usually `fetch-depth: 0`;
- annotations appear in GitHub UI only when emitted in GitHub Actions.

## Artifacts can be sensitive

Reports, receipts, summaries, SARIF, annotations, and PR comments can include project metadata, paths, command output, claim text, and finding details.

Read `PRIVACY.md` before sharing artifacts outside your team.

## The score is not a universal truth

The score is a policy signal for the configured gate.

Use it to support review decisions, not to replace them.

Recommended interpretation:

- `DO NOT SHIP`: block and inspect evidence;
- `FIX BEFORE MERGE`: fix high-risk findings before merge;
- `SHIP WITH CARE`: review remaining findings deliberately;
- `SHIP`: configured gates did not find active blockers.

Even `SHIP` does not mean "perfect" or "secure".

## Public promise

The honest promise is:

```text
AgentProof helps maintainers demand evidence before trusting AI-generated PRs.
```

The dishonest promise would be:

```text
AgentProof proves AI-generated code is safe.
```

Do not make the dishonest promise.

