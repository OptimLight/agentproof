# AgentProof Artifacts

AgentProof can generate several outputs from the same run. Use this guide to choose the right artifact for humans, GitHub, bots, dashboards, and agent workflows.

## Quick matrix

| Artifact | Flag | Audience | Best for |
|---|---|---|---|
| Markdown report | `--output AGENT_PROOF_REPORT.md` | humans | Full readable audit trail in the repo or CI artifacts. |
| Console summary | default | humans and logs | Fast terminal feedback. |
| JSON result | `--json` | tools | Full in-memory result for advanced integrations. |
| HTML report | `--html agentproof-report.html` | humans | Shareable, self-contained visual report. |
| SARIF | `--sarif agentproof.sarif` | GitHub Code Scanning | Security/code scanning annotations. |
| PR comment | `--pr-comment agentproof-pr-comment.md` | reviewers | Compact PR-ready Markdown summary. |
| Receipt | `--receipt agentproof-receipt.json` | agents and auditors | Portable evidence receipt that can be verified later. |
| Summary JSON | `--summary agentproof-summary.json` | bots and dashboards | Compact stable machine-readable verdict. |
| Badge | `--badge agentproof-badge.svg` | README/demo pages | Visual score/status badge. |
| History | `--history .agentproof/history.jsonl` | maintainers | Trend tracking across runs. |
| Baseline | `--update-baseline .agentproof/baseline.json` | legacy repos | Known-debt capture for gradual adoption. |

## Recommended CI bundle

For most teams:

```bash
npx agentproof --path . \
  --profile strict \
  --changed --base origin/main \
  --baseline .agentproof/baseline.json \
  --sarif agentproof.sarif \
  --html agentproof-report.html \
  --pr-comment agentproof-pr-comment.md \
  --receipt agentproof-receipt.json \
  --summary agentproof-summary.json \
  --history .agentproof/history.jsonl
```

This gives:

- SARIF for GitHub annotations;
- HTML for humans;
- PR comment Markdown for reviewers;
- receipt for proof and agent workflows;
- summary JSON for bots and dashboards;
- history for trend tracking.

## Which artifact should I use?

### Human reviewer

Use:

```bash
--html agentproof-report.html
--pr-comment agentproof-pr-comment.md
```

The HTML report is the rich artifact. The PR comment is the decision layer.

### GitHub Code Scanning

Use:

```bash
--sarif agentproof.sarif
```

Then upload it with:

```yaml
- uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: agentproof.sarif
```

### Agent final answer

Use:

```bash
--claim .agentproof/final-claim.md
--receipt agentproof-receipt.json
```

The receipt lets the agent say what was proven without inventing verification.

### Dashboard or bot

Use:

```bash
--summary agentproof-summary.json
```

The summary is intentionally compact and schema-backed:

```text
schemas/agentproof.summary.schema.json
```

### Legacy repo rollout

Use:

```bash
--update-baseline .agentproof/baseline.json
```

Then run future checks with:

```bash
--baseline .agentproof/baseline.json
```

Baseline findings stay visible but do not count against the active score.

## Artifact sensitivity

Treat artifacts as potentially sensitive on private repositories. AgentProof redacts common credential-shaped values before writing reports, but artifacts can still reveal:

- file paths;
- package names;
- command names;
- rule hits;
- project structure;
- risk posture.

See `docs/SECURITY_MODEL.md` for trust boundaries and redaction behavior.

## GitHub Action mapping

The reusable action supports these file outputs as inputs:

```yaml
- uses: runstudio/agentproof@v1
  with:
    sarif: agentproof.sarif
    html: agentproof-report.html
    pr-comment: agentproof-pr-comment.md
    receipt: agentproof-receipt.json
    summary: agentproof-summary.json
    history: .agentproof/history.jsonl
```

It also exposes step outputs:

```text
score
verdict
findings
report-path
receipt-path
summary-path
```

## Posting the PR comment

`--pr-comment` writes a Markdown file. AgentProof does not post it automatically.

Use `templates/github-action-pr-comment.yml` when you want a sticky GitHub PR comment. The template is opt-in because it requires `pull-requests: write`.
