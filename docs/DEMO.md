# AgentProof Demo Script

This is the canonical launch demo. It should take less than 90 seconds.

## Story

AI agents are fast. That is the problem.

A coding agent can say:

> Done. Tests passed, build passed, lint is clean, and this is ready to ship.

AgentProof asks one question:

> Where is the proof?

## Demo path

### 1. Show the bad PR fixture

Open:

```text
examples/bad-agent-pr/src/App.jsx
examples/agent-claim.md
```

Point out the mismatch:

- The agent claims everything passed.
- The code contains a token-shaped value.
- The UI has missing alt text and an empty button.
- The copy contains placeholders.
- Unsafe HTML is present.

### 2. Run claim audit

```bash
npm run demo:claim
```

Expected story:

- AgentProof returns `DO NOT SHIP`.
- The claim audit flags unproven tests/build/lint.
- The HTML report is generated.

### 3. Generate CI artifacts

```bash
npm run demo:sarif
```

Expected artifacts:

- `AGENT_PROOF_REPORT.md`
- `agentproof.sarif`
- `agentproof-badge.svg`
- `agentproof-pr-comment.md`
- `agentproof-receipt.json`
- `agentproof-summary.json`

### 4. Show adoption path

```bash
npx agentproof --init --ci
npx agentproof --doctor
```

Expected story:

- Install without overwriting existing files.
- Inspect policy before blocking PRs.
- Run strict gate in CI.

### 5. Show baseline mode

```bash
npm run demo:baseline
```

Expected story:

- Existing repo debt can be captured.
- New risks still block.
- Teams can adopt AgentProof without pretending legacy repos are clean.

## Closing line

Your agent says it is done. AgentProof tells you if it is shippable.

## Before / after path

For a sharper launch demo, use `docs/BEFORE_AFTER.md`.

The point is not only that AgentProof catches a bad PR. The point is that it teaches the agent what a safer final claim looks like:

```text
Before: "Everything passed. Ready to ship."
After:  "Here is what changed, here is what is proven, and here is what I am not claiming."
```

Suggested comparison fixtures:

- Bad PR: `examples/bad-agent-pr` with `examples/agent-claim.md`.
- Good PR: `examples/good-agent-pr` with `examples/good-agent-claim.md`.

Note: claim file paths are resolved from the audited project path. The good fixture uses `--claim ../good-agent-claim.md` because the audited root is `examples/good-agent-pr`.

## Monorepo path

Use this when you want to show that AgentProof handles common JavaScript workspace layouts:

```bash
npm run demo:monorepo
```

Fixture:

```text
examples/monorepo-agent-pr
```

Expected story:

- `apps/web` has package-level build/lint scripts.
- `packages/api` has a package-level test failure.
- the web UI still has static UI/slop findings.
- `agent-claim.md` overclaims workspace verification.

## PR comment artifact

`npm run demo:sarif` also generates `agentproof-pr-comment.md`.

Use it to show the reviewer-facing summary: verdict, decision line, top findings, commands, and artifact paths.
