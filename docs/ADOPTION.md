# Adoption Guide

AgentProof is easiest to adopt when teams do not try to go from zero to strict blocking in one day.

Use this rollout when introducing AgentProof to an existing team, legacy repo, or monorepo.

## Phase 1: observe only

Goal: generate signal without blocking developers.

Use when:

- the repo has unknown debt;
- developers are skeptical of another CI gate;
- you want to inspect findings before enforcing policy.

Recommended command:

```bash
npx agentproof --path . \
  --profile relaxed \
  --no-run-scripts \
  --html agentproof-report.html \
  --summary agentproof-summary.json \
  --history .agentproof/history.jsonl
```

Recommended policy pack:

```bash
npx agentproof --init --policy-pack relaxed-prototype
```

Outcome:

- no surprise blocking;
- first report generated;
- noisy rules can be tuned;
- obvious sensitive findings can be fixed quickly.

Template:

```text
templates/adoption/phase-1-observe.yml
```

## Phase 2: baseline and PR gate

Goal: stop new risk without pretending old debt is gone.

Use when:

- the team agrees AgentProof findings are useful;
- legacy issues exist;
- PRs should not add new high-risk findings.

Create a baseline:

```bash
npx agentproof --path . --update-baseline .agentproof/baseline.json
```

Then run PR checks with:

```bash
npx agentproof --path . \
  --profile standard \
  --changed --base origin/main \
  --baseline .agentproof/baseline.json \
  --fail-under 80 \
  --sarif agentproof.sarif \
  --pr-comment agentproof-pr-comment.md \
  --receipt agentproof-receipt.json \
  --summary agentproof-summary.json
```

Recommended policy pack:

```bash
npx agentproof --init --policy-pack legacy-adoption --ci --agent
```

Outcome:

- known debt stays visible;
- new risky agent PRs are blocked;
- maintainers get SARIF, receipt, summary, and PR comment artifacts.

Template:

```text
templates/adoption/phase-2-pr-gate.yml
```

## Phase 3: strict agent contract

Goal: make proof part of the agent workflow.

Use when:

- AgentProof has low false-positive noise;
- developers trust the baseline;
- AI coding agents are common in the repo.

Install everything:

```bash
npx agentproof --init --all --policy-pack strict-client-delivery
```

Require final claims:

```bash
npx agentproof --path . \
  --profile strict \
  --claim .agentproof/final-claim.md \
  --baseline .agentproof/baseline.json \
  --receipt agentproof-receipt.json \
  --summary agentproof-summary.json \
  --fail-under 90
```

Outcome:

- agents cannot claim completion without evidence;
- strict client-delivery policy is enforced;
- receipts support review and audit trails.

Template:

```text
templates/adoption/phase-3-strict-agent-contract.yml
```

## Recommended timeline

| Week | Action |
|---|---|
| 1 | Phase 1 observe-only. Review top findings and tune obvious noise. |
| 2 | Create baseline. Start Phase 2 PR gate on changed files. |
| 3 | Add agent templates. Require `.agentproof/final-claim.md` on AI-assisted PRs. |
| 4 | Move strict repos to `strict-client-delivery` or `security-sensitive`. |

## What not to do

- Do not start with strict blocking on a messy legacy repo unless the team already accepts the cleanup cost.
- Do not suppress broad categories permanently.
- Do not claim AgentProof proves code is secure.
- Do not let agents describe static-only scans as full verification.
- Do not post PR comments from workflows unless the team accepts `pull-requests: write` permissions.

## Success criteria

AgentProof adoption is working when:

- developers understand why a PR failed;
- known debt is visible but not blocking unrelated work;
- agents stop overclaiming tests, builds, and readiness;
- maintainers can inspect a receipt or summary without reading a full log;
- policy gets stricter over time instead of being disabled.
## Observe-only CI rollout

If your team is not ready to block merges on day one, run AgentProof in observe-only mode first:

```bash
npx agentproof --path . --profile strict --fail-under 85 --observe-only
```

In GitHub Actions:

```yaml
- uses: runstudio/agentproof@v1
  with:
    path: .
    profile: strict
    fail-under: "85"
    observe-only: "true"
```

This preserves the AgentProof verdict and artifacts, but forces exit code `0`. Use it to collect a week of signal, tune baselines and suppressions, then remove `observe-only` when the gate is ready to enforce.

For common stakeholder questions before rollout, use:

```bash
npx agentproof --faq
```
