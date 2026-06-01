# Changelog

## Unreleased

- No unreleased changes yet.

## 0.1.0

Initial launch candidate for AgentProof, a local QA gate for AI-generated pull requests.

### Core CLI

- Added local project scans with Markdown reports.
- Added machine-readable `--json` output.
- Added self-contained `--html` reports.
- Added static checks for token-shaped values, unsafe HTML, dynamic execution, AI slop, docs readiness, missing image alt text, dead links, and empty buttons.
- Added verification command detection for JavaScript/TypeScript, Python, Go, Rust, and custom configured commands.
- Added JavaScript workspace and package command support for first-pass monorepo evidence.
- Added `--changed --base <ref>` for pull request focused scans.
- Added `--no-run-scripts` for static-only first scans and untrusted projects.
- Added contextual terminal next steps after each run.

### Claim audit

- Added `--claim <text|file>` to audit an agent final message against observed local evidence.
- Added `--claim-template` to print an evidence-scoped final claim template.
- Added claim-audit docs, safer wording examples, and agent contract scaffolding.
- Added bad and good claim fixtures for before/after demos.

### Policy and adoption

- Added `--profile relaxed|standard|strict`.
- Added score thresholds with `--fail-under`.
- Added severity budgets, severity overrides, suppressions, and expiry-aware policy behavior.
- Added `--baseline` to exclude known findings from the active score.
- Added `--update-baseline` to capture current findings as known debt.
- Added built-in policy packs for prototypes, standard PR gates, strict client delivery, security-sensitive work, and legacy adoption.
- Added `--policy-packs` and `--init --policy-pack <name>`.
- Added `--observe-only` / `--soft-fail` for non-blocking CI rollout.

### Artifacts and integrations

- Added SARIF export for GitHub Code Scanning.
- Added SVG score badge generation.
- Added compact PR comment output with `--pr-comment`.
- Added GitHub Step Summary support with `--github-comment`.
- Added native GitHub log annotations with `--github-annotations`.
- Added portable evidence receipts with `--receipt`.
- Added receipt verification with `--verify-receipt`.
- Added compact summary JSON with `--summary`.
- Added run history with `--history`.
- Added trend reporting with `--trend`.
- Added schemas for config, receipt, and summary artifacts.

### GitHub Action and scaffolding

- Added reusable composite GitHub Action.
- Added action outputs for score, verdict, findings, report path, receipt path, and summary path.
- Added generated workflow scaffolding with `--init --ci`.
- Added full project setup with `--init --all`.
- Added agent instruction templates for Codex, Claude, Cursor, Copilot, and OpenCode.
- Added adoption workflow templates for observe-only, standard PR gate, and strict agent contract phases.
- Added optional PR comment workflow template.

### Discovery and support commands

- Added `--doctor` to explain detected config and commands without running checks.
- Added `--rules` and `--explain <rule-id>` for rule catalog discovery.
- Added `--recipes` / `--examples` for copy-paste command recipes.
- Added `--troubleshoot` / `--troubleshooting` for first-run failure guidance.
- Added `--faq` for common objections and adoption questions.

### Demos and launch assets

- Added intentionally bad, cleaned-up good, and monorepo demo fixtures.
- Added before/after documentation.
- Added launch kit posts, repo profile copy, maintainer response templates, GitHub star launch plan, rule challenge, launch scorecard, and demo video script.
- Added a shareable social card in `assets/social-card.svg`.
- Added release readiness matrix and release checklist coverage.

### Community, trust, and governance

- Added `CONTRIBUTING.md` contribution lanes for rules, demos, agent workflows, and CI adoption.
- Added `SUPPORT.md` for safe bug reports and rule requests.
- Added `CODE_OF_CONDUCT.md`.
- Added `GOVERNANCE.md`.
- Added `PRIVACY.md` explaining local-first behavior and artifact sensitivity.
- Added `LIMITATIONS.md` explaining what AgentProof does not prove.
- Added maintainer triage and rule triage documentation.

### Release validation

- Added `npm run validate:release` to exercise public CLI commands, fixtures, receipts, summaries, annotations, observe-only behavior, package manifest contents, and `--init --all` scaffolding.
- Added `npm run pack:dry-run` for package content checks.
