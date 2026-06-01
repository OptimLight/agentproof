# GitHub Action

AgentProof can run as a reusable composite action.

## Minimal PR gate

```yaml
name: AgentProof

on:
  pull_request:

permissions:
  contents: read
  security-events: write

jobs:
  proof:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: runstudio/agentproof@v1
        with:
          path: .
          profile: strict
          changed: "true"
          base: origin/main
          fail-under: "85"
```

## Full artifact workflow

```yaml
- uses: runstudio/agentproof@v1
  with:
    path: .
    profile: strict
    fail-under: "85"
    changed: "true"
    base: origin/main
    baseline: .agentproof/baseline.json
    sarif: agentproof.sarif
    html: agentproof-report.html
    pr-comment: agentproof-pr-comment.md
    receipt: agentproof-receipt.json
    summary: agentproof-summary.json
    history: .agentproof/history.jsonl
```

Upload the generated files with `actions/upload-artifact`, and upload SARIF with `github/codeql-action/upload-sarif`.

## DesignGuard workflow

Start your app before the AgentProof step, then pass the rendered URL:

```yaml
- name: Start app
  run: |
    npm ci
    npm run build
    npm run start -- --port 3000 &
    npx wait-on http://localhost:3000

- uses: runstudio/agentproof@v1
  with:
    path: .
    profile: strict
    fail-under: "90"
    design-only: "true"
    design: saas
    design-url: http://localhost:3000
    design-viewports: mobile,desktop
    design-ai: "false"
    design-ai-provider: openai-api
    design-ai-model: gpt-5-mini
```

If the browser cannot run, DesignGuard falls back to static checks and reports the missing browser proof instead of crashing CI.

See `docs/ARTIFACTS.md` for when to use SARIF, HTML, PR comment, receipt, summary, badge, history, and baseline artifacts.

## Inputs

| Input | Default | Purpose |
|---|---:|---|
| `path` | `.` | Project path to audit. |
| `profile` | `standard` | `relaxed`, `standard`, or `strict`. |
| `fail-under` | `80` | Minimum score required to pass. |
| `design` | empty | Enables DesignGuard for `landing`, `saas`, `dashboard`, `marketplace`, `ecommerce`, `webapp`, or `mobile-app`. |
| `design-only` | `false` | Runs only DesignGuard while still using `path` for local UI source checks. |
| `design-url` | empty | URL to render for DesignGuard DOM/CSS/screenshot proof. |
| `design-routes` | empty | Comma-separated routes to audit. |
| `design-viewports` | empty | Comma-separated viewports: `mobile`, `tablet`, `desktop`. |
| `design-ai` | `false` | Enables optional AI design review. |
| `design-ai-provider` | empty | `openai-api`, `codex-auth`, or `auto`. |
| `design-ai-model` | empty | Model override such as `gpt-5-mini` or `gpt-5.3-codex-spark`. |
| `changed` | `false` | Scan changed files only. |
| `base` | `origin/main` | Base ref for changed scans. |
| `baseline` | empty | Known-debt baseline file. |
| `sarif` | empty | GitHub code scanning output. |
| `html` | empty | Self-contained HTML report. |
| `pr-comment` | empty | Compact Markdown PR summary. |
| `receipt` | empty | Portable evidence receipt. |
| `summary` | empty | Compact JSON summary for bots and dashboards. |
| `history` | empty | JSONL trend history. |
| `claim` | empty | Agent final claim to audit. |
| `observe-only` | `false` | Keep reports and verdicts, but do not fail the workflow. |
| `no-run-scripts` | `false` | Skip test/lint/typecheck/build scripts. |
| `github-summary` | `true` | Write the compact summary to the workflow summary. |
| `github-annotations` | `true` | Emit native GitHub log annotations for active findings. |

For file-based automation outside the action outputs, use the CLI `--summary` option. See `docs/SUMMARY_OUTPUT.md`.

## Outputs

The action exposes the main verdict as step outputs, even when AgentProof fails the gate.

By default, the action also emits native GitHub annotations for active findings. This makes high-signal issues visible in workflow logs and pull request checks before reviewers open the full report.

| Output | Purpose |
|---|---|
| `score` | AgentProof score from `0` to `100`. |
| `verdict` | `SHIP`, `SHIP WITH CARE`, `FIX BEFORE MERGE`, or `DO NOT SHIP`. |
| `findings` | Active finding count. |
| `technical-score` | TechnicalGate score. |
| `technical-verdict` | TechnicalGate verdict. |
| `design-score` | DesignGuard score when enabled. |
| `design-verdict` | DesignGuard verdict when enabled. |
| `design-findings` | Active DesignGuard finding count. |
| `report-path` | Markdown report path. |
| `receipt-path` | Receipt path when `receipt` is configured. |
| `summary-path` | Summary path when `summary` is configured. |

Example:

```yaml
- id: agentproof
  uses: runstudio/agentproof@v1
  with:
    path: .
    profile: strict
    receipt: agentproof-receipt.json
    summary: agentproof-summary.json

- name: Print AgentProof verdict
  if: always()
  run: |
    echo "AgentProof: ${{ steps.agentproof.outputs.verdict }} (${{ steps.agentproof.outputs.score }}/100)"
    echo "Findings: ${{ steps.agentproof.outputs.findings }}"
```

## Fast install command

```bash
npx agentproof --init --policy-pack standard-pr-gate --ci --agent
```

That command creates the config, GitHub workflow, and agent contract without overwriting existing files.

## Observe-only rollout

Use observe-only mode when you want AgentProof reports in CI before you start blocking merges:

```yaml
- uses: runstudio/agentproof@v1
  with:
    path: .
    profile: strict
    fail-under: "85"
    observe-only: "true"
```

This keeps the score, verdict, reports, and artifacts visible, but returns a successful workflow status.

## PR comment artifact

Use `pr-comment` when you want a compact Markdown body for a PR comment bot:

```yaml
- id: agentproof
  uses: runstudio/agentproof@v1
  with:
    path: .
    profile: strict
    pr-comment: agentproof-pr-comment.md
```

The generated comment includes:

- verdict and score;
- merge decision line;
- severity counts;
- top findings with locations;
- verification commands, including package `cwd` for monorepos;
- generated artifact paths;
- a review note when blocking findings remain.

AgentProof writes the file, but does not post the PR comment by itself. Use your preferred GitHub comment action if you want to publish it.

## Posting the PR comment

The default AgentProof workflow writes `agentproof-pr-comment.md` but does not post it because posting requires `pull-requests: write`.

For an opt-in sticky comment workflow, see:

```text
templates/github-action-pr-comment.yml
docs/PR_COMMENT_WORKFLOW.md
```
