# Getting started

AgentProof is most convincing when a maintainer can try it in under two minutes, then turn it into a pull request gate in under ten.

Use this guide when you just found the project and want the fastest path from "interesting" to "I can use this on my repo".

If you prefer to discover by copy-pasting commands first:

```bash
npx agentproof --recipes
```

If your first run fails and you want the next step:

```bash
npx agentproof --troubleshoot
```

If you want the short answer to common objections:

```bash
npx agentproof --faq
```

## What you get

AgentProof gives you a local, reviewable answer to one question:

```text
Did the agent produce something that is actually safe enough to merge?
```

It does that by combining:

- project verification commands such as tests, lint, typecheck, and build;
- static risk checks for secrets, unsafe HTML, weak UI hygiene, and AI filler;
- final-claim auditing with `--claim`;
- policy profiles, baselines, suppressions, and budgets;
- artifacts for humans and CI: Markdown, HTML, SARIF, PR comment, badge, receipt, and summary JSON.

## 1. Run it locally

From a project you want to inspect:

```bash
npx agentproof --path . --no-run-scripts
```

Use `--no-run-scripts` for the first scan when you do not want AgentProof to execute package scripts yet.

When you are ready to include tests, lint, typecheck, and build scripts:

```bash
npx agentproof --path . --profile standard
```

For a stricter gate:

```bash
npx agentproof --path . --profile strict --fail-under 85
```

If you are working from this repository before the package is published, replace `npx agentproof` with:

```bash
node ./bin/agentproof.mjs
```

Example:

```bash
node ./bin/agentproof.mjs --path examples/bad-agent-pr --claim examples/agent-claim.md
```

## 2. Try the demo

The fastest way to understand the product is to compare the bad and good fixtures.

```bash
npm run demo:claim
```

Then:

```bash
npm run demo:good
```

The bad demo should feel like a real AI-agent PR review: the agent sounds confident, but the proof is missing or risky.

## 3. Add it to a repository

Run the full setup command inside the target repo:

```bash
npx agentproof --init --all
```

That creates:

- `agentproof.config.json`;
- `.github/workflows/agentproof.yml`;
- `.agentproof/AGENT_CONTRACT.md`;
- instruction templates for supported coding agents.

If you are using the local checkout before publish:

```bash
node /path/to/agentproof/bin/agentproof.mjs --path . --init --all
```

## 4. Audit the agent's final message

Ask your coding agent to write its final claim to:

```text
.agentproof/final-claim.md
```

You can generate a starter template:

```bash
npx agentproof --claim-template > .agentproof/final-claim.md
```

Then run:

```bash
npx agentproof --path . --claim .agentproof/final-claim.md
```

Good final claims are scoped to evidence:

```text
Implemented the settings screen. Build and lint were run successfully. I did not run the full test suite.
```

Bad final claims overstate confidence:

```text
Done. Tests passed, build passed, everything is production-ready.
```

AgentProof flags claims when the observed evidence does not support them.

## 5. Generate review artifacts

For a serious PR gate, generate the bundle reviewers can inspect:

```bash
npx agentproof \
  --path . \
  --profile strict \
  --fail-under 85 \
  --github-annotations \
  --sarif agentproof.sarif \
  --html agentproof-report.html \
  --pr-comment agentproof-pr-comment.md \
  --receipt agentproof-receipt.json \
  --summary agentproof-summary.json
```

Recommended artifact usage:

| Artifact | Best for |
|---|---|
| `AGENT_PROOF_REPORT.md` | Local review and quick debugging. |
| `agentproof-report.html` | Sharing a readable report with teammates. |
| `agentproof-pr-comment.md` | Posting a PR summary. |
| `agentproof.sarif` | GitHub code scanning. |
| `agentproof-receipt.json` | Keeping a portable audit receipt. |
| `agentproof-summary.json` | Automation and dashboards. |

## 6. Choose the right rollout

Start soft, then tighten.

| Phase | Command | Use when |
|---|---|---|
| Observe | `npx agentproof --path . --no-run-scripts` | You want signal without executing project scripts. |
| Observe-only CI | `npx agentproof --path . --profile strict --observe-only` | You want reports without blocking merges yet. |
| Standard gate | `npx agentproof --path . --profile standard --fail-under 80` | You want a balanced PR check. |
| Strict gate | `npx agentproof --path . --profile strict --fail-under 85` | You ship client, production, auth, billing, or security-sensitive work. |
| Legacy adoption | `npx agentproof --init --policy-pack legacy-adoption` | You need to introduce a gate without pretending old debt is gone. |

See [`ADOPTION.md`](ADOPTION.md) for a team rollout plan.

## 7. Copy this into your agent instructions

Use this short contract with Codex, Claude, Cursor, Copilot, or another coding agent:

```text
Before claiming work is complete:
1. Run the relevant verification commands, or explicitly state which ones were not run.
2. Write the final claim to .agentproof/final-claim.md.
3. Run AgentProof with --claim .agentproof/final-claim.md.
4. Do not say "production-ready", "tests passed", or "fully verified" unless the evidence proves it.
```

For ready-made templates:

```bash
npx agentproof --init --agents all
```

## Common first-run questions

### AgentProof failed. Is that bad?

Not necessarily. A failure means the project did not meet the configured gate. On a first run, that is useful signal, not a personal attack from a tiny robot with a clipboard.

Use the findings to decide whether to:

- fix the issue now;
- suppress a false positive with an expiry date;
- create a baseline for known legacy debt;
- lower the rollout profile temporarily.

For the full guide, see [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md).

### I do not want it to run scripts yet.

Use:

```bash
npx agentproof --path . --no-run-scripts
```

### I only want changed files.

Use:

```bash
npx agentproof --changed --base origin/main
```

### I want CI but no PR comment permissions.

Use the generated workflow without the PR-comment posting step. You can still save `agentproof-pr-comment.md` as an artifact.

### I want to publish this as an official GitHub Action.

Use the release checklist in [`PUBLISHING.md`](PUBLISHING.md), then tag a release such as `v1` so workflows can reference:

```yaml
- uses: runstudio/agentproof@v1
```

## Success criteria for your first PR

Your first AgentProof PR is ready when:

- the README explains why the gate exists;
- the workflow runs on pull requests;
- the selected policy profile matches your risk level;
- the agent contract is visible to contributors;
- the report artifacts are easy to find;
- the team understands that a failed gate means "review this evidence", not "panic".
