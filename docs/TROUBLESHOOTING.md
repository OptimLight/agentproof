# Troubleshooting

AgentProof is supposed to make risk visible. A failed run does not mean "the project is doomed"; it means "look at this evidence before merging".

Use this guide when a first scan fails, CI behaves differently from local, or a contributor is not sure what to do next.

## Quick triage

1. Open `AGENT_PROOF_REPORT.md`.
2. Read the top findings before changing config.
3. Check whether command execution was enabled or skipped with `--no-run-scripts`.
4. Classify each important finding as real risk, known debt, or false positive.
5. Fix real risk, baseline known debt, and suppress confirmed false positives with an expiry date.

You can print the short version in your terminal:

```bash
npx agentproof --troubleshoot
```

## The score is too low

Start with a static-only scan:

```bash
npx agentproof --path . --no-run-scripts
```

Then run with your target profile:

```bash
npx agentproof --path . --profile standard --fail-under 80
```

For high-risk repos:

```bash
npx agentproof --path . --profile strict --fail-under 85
```

If the project has existing debt, do not permanently lower the gate just to make the first run green. Create a baseline:

```bash
npx agentproof --path . --update-baseline .agentproof/baseline.json
npx agentproof --path . --baseline .agentproof/baseline.json --profile standard
```

For a non-blocking CI rollout, keep the verdict but force exit code `0`:

```bash
npx agentproof --path . --profile strict --fail-under 85 --observe-only
```

## The claim audit failed

AgentProof compares the agent's final claim against evidence observed in the run.

If the agent says:

```text
Tests passed, build passed, lint is clean, and this is production-ready.
```

AgentProof expects matching evidence.

Use safer final claims:

```text
Implemented the requested change. Build and lint passed. I did not run the full test suite.
```

Avoid unsupported claims:

```text
Done. Everything is tested and production-ready.
```

## I do not want project scripts to run

Use:

```bash
npx agentproof --path . --no-run-scripts
```

This is the right first step for untrusted repositories or unknown dependency scripts.

## Changed-file mode failed

Changed-file mode needs a base ref.

Locally:

```bash
git fetch origin main
npx agentproof --changed --base origin/main
```

In GitHub Actions, make sure checkout fetches enough history:

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
```

## CI cannot post a PR comment

You can still generate the PR comment as an artifact:

```bash
npx agentproof --path . --pr-comment agentproof-pr-comment.md
```

Only add `pull-requests: write` when your repository policy allows automated PR comments.

If you still want inline signal without PR comment permissions, enable GitHub annotations:

```bash
npx agentproof --path . --github-annotations
```

## A secret finding is a false positive

Do not paste real secrets into GitHub issues.

Options:

- rename fake values so they no longer look like credentials;
- move real secrets to environment variables or a secret manager;
- suppress confirmed false positives in `agentproof.config.json` with owner, reason, and expiry.

## First adoption is noisy

Use a staged rollout:

```bash
npx agentproof --path . --no-run-scripts
npx agentproof --path . --profile relaxed --fail-under 70
npx agentproof --path . --profile standard --fail-under 80
```

Then move production, client, auth, billing, and infrastructure repos to:

```bash
npx agentproof --path . --profile strict --fail-under 85
```

## What to include in a bug report

Include:

- AgentProof version;
- command used;
- sanitized top findings;
- whether `--no-run-scripts` was used;
- relevant config without secrets;
- minimal reproduction when possible.

Never include real tokens, private customer code, production logs, or unredacted `.env` files.
