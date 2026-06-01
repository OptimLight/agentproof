# CLI Reference

AgentProof exposes one CLI:

```bash
agentproof [options]
```

The default command audits the current directory and writes:

```text
AGENT_PROOF_REPORT.md
```

The terminal summary prints the verdict, generated artifacts, finding counts, and a short next-step recommendation. The Markdown report includes the same recommendation with more detail.

## Basic usage

```bash
npx agentproof --path .
```

Strict PR gate:

```bash
npx agentproof --path . --profile strict --fail-under 85
```

Strict MVP design gate:

```bash
npx agentproof --path . --design saas --design-url http://localhost:3000 --profile strict --fail-under 90
```

Design-only landing audit:

```bash
npx agentproof --path ./landing-site --design-only --design landing --design-url http://localhost:3000 --profile strict --fail-under 90
```

Observe-only rollout:

```bash
npx agentproof --path . --profile strict --fail-under 85 --observe-only
```

Changed files only:

```bash
npx agentproof --changed --base origin/main
```

Static-only scan:

```bash
npx agentproof --path . --no-run-scripts
```

Show copy-paste recipes:

```bash
npx agentproof --recipes
```

Show first-run troubleshooting:

```bash
npx agentproof --troubleshoot
```

Claim audit:

```bash
npx agentproof --path . --claim .agentproof/final-claim.md
```

## Options

### Project selection

| Option | Purpose | Default |
|---|---|---|
| `-p, --path <dir>` | Project directory to audit. | `.` |
| `-o, --output <file>` | Markdown report path. | `AGENT_PROOF_REPORT.md` |
| `--max-files <n>` | Maximum text files scanned by static checks. | `900` |
| `--timeout <sec>` | Per-command timeout in seconds. | `120` |

### Output modes

| Option | Purpose |
|---|---|
| `--json` | Print the full machine-readable result to stdout. |
| `--sarif <file>` | Write GitHub Code Scanning SARIF. |
| `--badge <file>` | Write an SVG score badge. |
| `--html <file>` | Write a self-contained HTML report. |
| `--pr-comment <file>` | Write compact Markdown for a PR comment. |
| `--receipt <file>` | Write a portable JSON evidence receipt. |
| `--summary <file>` | Write compact JSON for bots, dashboards, and harnesses. |
| `--github-comment` | Append a compact summary to `GITHUB_STEP_SUMMARY` when available. |
| `--github-annotations` | Emit GitHub log annotations for active findings. |

### Policy and gating

| Option | Purpose | Default |
|---|---|---|
| `--profile <name>` | Risk profile: `relaxed`, `standard`, or `strict`. | `standard` |
| `--fail-under <n>` | Score threshold below which AgentProof exits non-zero. | profile default |
| `--observe-only`, `--soft-fail` | Keep reports and verdicts, but force exit code `0`. | disabled |
| `--baseline <file>` | Exclude known findings from the active score. | config value |
| `--update-baseline [file]` | Write current findings as known debt. | `.agentproof/baseline.json` |
| `--policy-packs` | Print available starter policy packs. | none |

### Pull request scanning

| Option | Purpose | Default |
|---|---|---|
| `--changed` | Scan only files changed against `--base`. | full scan |
| `--base <ref>` | Base ref for changed-file scans. | `origin/main` |

### Verification commands

| Option | Purpose |
|---|---|
| `--no-run-scripts` | Skip package test/lint/typecheck/build and language commands. |
| `--doctor` | Explain detected config and commands without running checks. |

Use `--no-run-scripts` for untrusted repositories. AgentProof does not sandbox project commands.

### DesignGuard

| Option | Purpose |
|---|---|
| `--design <type>` | Enable DesignGuard. Types: `landing`, `saas`, `dashboard`, `marketplace`, `ecommerce`, `webapp`, `mobile-app`. |
| `--design-only` | Run only DesignGuard. Keeps `--path` for local UI source checks, but excludes technical, docs, security, verification, and claim gates. |
| `--design-url <url>` | Render a local/CI URL for DOM, CSS, viewport, and screenshot proof. |
| `--design-routes <routes>` | Comma-separated routes. Default: `/`. |
| `--design-viewports <viewports>` | Comma-separated viewports: `mobile`, `tablet`, `desktop`. Default: `mobile,desktop`. |
| `--design-locale <locale>` | Browser locale and `Accept-Language` for rendered audits and browser-clone capture, for example `fr-FR`. |
| `--design-strictness <name>` | Design strictness: `relaxed`, `standard`, `strict`. Defaults to the risk profile. |
| `--design-ai` | Run optional AI design review. |
| `--design-ai-provider <provider>` | AI provider: `openai-api`, `codex-auth`, or `auto`. |
| `--design-ai-model <model>` | AI model override, for example `gpt-5-mini`, `gpt-5.5`, or `gpt-5.3-codex-spark`. |
| `--design-ai-reasoning <effort>` | Reasoning effort for supported models: `minimal`, `low`, `medium`, `high`, or `xhigh`. |
| `--design-ai-list-models` | List available Codex auth models from the local Codex login and exit. |
| `design-fix` | Subcommand that asks AI to rewrite selected UI files after a DesignGuard audit. |
| `design-improve` | Subcommand that audits, generates a complete improvement brief, runs DesignFix, then re-audits. |
| `--design-fix` | Flag alias for the `design-fix` subcommand. |
| `--design-improve` | Flag alias for the `design-improve` subcommand. |
| `--apply` | With DesignFix, rewrite files and create `.agentproof/design-fix-backups`. |
| `--from-browser` | With DesignFix, clone the rendered page from `--design-url`, then improve it instead of reading local files. |
| `--clone-output <dir>` | With `--from-browser`, directory for generated standalone files. |
| `--fix-output <file>` | Markdown DesignFix report path. Default: `AGENT_PROOF_DESIGN_FIX.md`. |
| `--improve-output <file>` | Markdown DesignImprove report path. Default: `AGENT_PROOF_DESIGN_IMPROVEMENT.md`. |
| `--target-score <n>` | Target DesignGate score for DesignImprove. Default: max of `90` and `--fail-under`. |
| `--max-passes <n>` | Maximum AI improvement passes. Default: `1`, capped at `3`. |

Examples:

```bash
npx agentproof --path . --design landing --design-url http://localhost:3000 --design-viewports mobile,desktop
npx agentproof --path ./landing-site --design-only --design landing --design-url http://localhost:3000
npx agentproof --path . --design marketplace --design-url http://localhost:3000 --design-ai
npx agentproof --path . --design landing --design-url http://localhost:3000 --design-ai --design-ai-provider codex-auth --design-ai-model gpt-5.5 --design-ai-reasoning xhigh
npx agentproof --design-ai-provider codex-auth --design-ai-list-models
npx agentproof design-improve --path ./landing-site --design landing --design-url http://localhost:3000 --design-ai-provider codex-auth --design-ai-model gpt-5.5 --design-ai-reasoning xhigh --target-score 90 --apply
npx agentproof design-fix --path ./landing-site --design landing --design-url http://localhost:3000 --design-ai-provider codex-auth --design-ai-model gpt-5.5 --design-ai-reasoning xhigh
npx agentproof design-fix --path ./landing-site --design landing --design-url http://localhost:3000 --design-ai-provider codex-auth --apply
npx agentproof design-fix --path . --from-browser --design landing --design-url https://example.com --design-locale fr-FR --clone-output ./cloned-landing --design-ai-provider codex-auth --apply
npx agentproof --path . --design dashboard --profile strict
```

DesignFix is AI-only. Without `--apply`, it writes a reviewable rewrite report and leaves source files untouched. With `--apply`, it rewrites only the selected source files and stores backups under `.agentproof/design-fix-backups`.

With `--from-browser`, DesignFix does not need local source files. It captures the rendered DOM/CSS as a faithful standalone page, asks AI for targeted design improvements, and writes `index.html`, `styles.css`, and optionally `script.js` to `--clone-output`. Use `--design-locale fr-FR` or similar when the live site changes language by browser locale.

DesignImprove wraps DesignGuard and DesignFix into a safer production loop. It writes `AGENT_PROOF_DESIGN_IMPROVEMENT.md`, includes the full AI repair prompt, and reports the before/after DesignGate score.

When enabled, reports include:

```text
Technical Gate: PASS 94/100
Design Gate: DESIGN REVIEW REQUIRED 68/100
Final Verdict: DESIGN REVIEW REQUIRED
```

See `docs/DESIGN_GUARD.md`.

### Agent claim audit

| Option | Purpose |
|---|---|
| `--claim <text\|file>` | Audit an agent final claim against observed local evidence. |

Claim file paths are resolved from the audited project path.

Example:

```bash
npx agentproof --path examples/bad-agent-pr --claim ../agent-claim.md
```

This loads:

```text
examples/agent-claim.md
```

### Read-only metadata commands

| Option | Purpose |
|---|---|
| `--rules [format]` | Print rule catalog as `markdown` or `json`. |
| `--explain <rule>` | Explain one rule id. |
| `--recipes`, `--examples` | Print copy-paste command recipes. |
| `--troubleshoot`, `--troubleshooting` | Print first-run troubleshooting guidance. |
| `--faq` | Print frequently asked questions. |
| `--trend [file]` | Print trend report from AgentProof history. |
| `--verify-receipt <file>` | Verify a JSON evidence receipt. |
| `-h, --help` | Show help. |
| `-v, --version` | Show version. |

### Initialization

| Option | Purpose |
|---|---|
| `--init` | Create `agentproof.config.json` in the target project. |
| `--all` | With `--init`, create config, CI, agent contract, and agent templates. |
| `--policy-pack <name>` | With `--init`, create config from a starter policy pack. |
| `--ci, --init-ci` | With `--init`, create `.github/workflows/agentproof.yml`. |
| `--agent` | With `--init`, create `.agentproof/AGENT_CONTRACT.md`. |
| `--agents [list]` | With `--init`, install agent instruction templates. |

Fastest setup:

```bash
npx agentproof --init --all
```

Strict client setup:

```bash
npx agentproof --init --all --policy-pack strict-client-delivery
```

Selected agent templates:

```bash
npx agentproof --init --agents codex,cursor,claude,copilot
```

Supported agent template names:

| Name | Target path |
|---|---|
| `codex` | `AGENTS.md` |
| `claude` | `CLAUDE.md` |
| `cursor` | `.cursor/rules/agentproof.mdc` |
| `copilot` | `.github/copilot-instructions.md` |
| `opencode` | `.opencode/agentproof.md` |
| `all` | all supported templates |

## Exit codes

| Code | Meaning |
|---:|---|
| `0` | Gate passed or read-only command succeeded. |
| `1` | Gate failed or verified receipt failed. |
| `2` | Usage error, invalid input, missing receipt, invalid JSON, or invalid target. |

## Common command recipes

You can print the built-in recipe list directly from the CLI:

```bash
npx agentproof --recipes
```

You can print the first-run troubleshooting guide directly from the CLI:

```bash
npx agentproof --troubleshoot
```

You can print the FAQ directly from the CLI:

```bash
npx agentproof --faq
```

You can print an evidence-scoped final claim template:

```bash
npx agentproof --claim-template
```

### Roll out in CI without blocking merges

```bash
npx agentproof --path . --profile strict --fail-under 85 --observe-only
```

This preserves the AgentProof verdict and artifacts, but returns exit code `0`.

### Generate all review artifacts

```bash
npx agentproof --path . \
  --profile strict \
  --github-annotations \
  --sarif agentproof.sarif \
  --html agentproof-report.html \
  --pr-comment agentproof-pr-comment.md \
  --receipt agentproof-receipt.json \
  --summary agentproof-summary.json \
  --history .agentproof/history.jsonl
```

### Baseline a legacy repo

```bash
npx agentproof --path . --update-baseline .agentproof/baseline.json
npx agentproof --path . --baseline .agentproof/baseline.json --profile standard
```

### Audit a final agent answer

```bash
mkdir -p .agentproof
$EDITOR .agentproof/final-claim.md
npx agentproof --path . --profile strict --claim .agentproof/final-claim.md --receipt agentproof-receipt.json
```

### Inspect rules

```bash
npx agentproof --rules markdown
npx agentproof --rules json
npx agentproof --explain claims.unproven-tests
```

### Validate a receipt without rerunning checks

```bash
npx agentproof --verify-receipt agentproof-receipt.json
```

### Show trend from history

```bash
npx agentproof --trend .agentproof/history.jsonl
```

## Related docs

| Doc | Purpose |
|---|---|
| `docs/CONFIG.md` | Configuration fields and policy packs. |
| `docs/ARTIFACTS.md` | Output artifacts and intended consumers. |
| `docs/CLAIM_AUDIT.md` | Claim audit behavior and safer final answer style. |
| `docs/CLAIM_TEMPLATE.md` | Built-in final claim template for agents and reviewers. |
| `docs/GITHUB_ACTION.md` | Reusable GitHub Action. |
| `docs/ADOPTION.md` | Three-phase rollout for real teams. |
| `docs/TROUBLESHOOTING.md` | First-run failures, noisy repos, CI issues, and safe bug reports. |
| `docs/FAQ.md` | Common objections and first-run questions. |
