# AgentProof Release Checklist

- [ ] Run `npm run demo` and confirm it fails with `DO NOT SHIP`.
- [ ] Run `npm run demo:claim` and confirm claim-audit findings appear.
- [ ] Run `npm run self-check` and review findings.
- [ ] Run `npm run demo:sarif` and confirm SARIF + badge files are created.
- [ ] Run `npm run rules` and skim the rule catalog.
- [ ] Review `agentproof.config.json` budgets, overrides, and suppressions.
- [ ] Check README install commands.
- [ ] Check `homepage/index.html` on desktop and mobile.
- [ ] Tag release as `v0.1.0`.
- [ ] Publish GitHub release with demo report screenshot.
- [ ] Post launch copy from `docs/LAUNCH.md`.
- [ ] Run `npm run demo:baseline` and confirm baseline file is generated.
- [ ] Review `docs/VERIFICATION.md` for supported command detection.
- [ ] Check `schemas/agentproof.config.schema.json` covers public config fields.
- [ ] Generate `agentproof-pr-comment.md` and confirm it reads well in a PR.
- [ ] Run history demo after validation is allowed: `npm run demo` then `npm run trend`.
- [ ] Run `npm run doctor` after validation is allowed and confirm detected commands look correct.
- [ ] Test `agentproof --init --ci` in a temporary project after validation is allowed.
- [ ] Run `npm run explain` after validation is allowed and confirm the rule explanation is useful.
- [ ] Generate `agentproof-receipt.json` after validation is allowed and confirm it contains score, verdict, commands, and blockers.
- [ ] Verify `agentproof-receipt.json` after validation is allowed with `npm run verify-receipt`.
- [ ] Test `agentproof --init --agent` in a temporary project after validation is allowed.
- [ ] Review `docs/GO_NO_GO.md` before publishing.
- [ ] Add public badges from `docs/BADGES.md` after repository and npm package exist.
- [ ] Review policy packs in `templates/policies/` for realistic defaults.

## Policy pack smoke checks

- [ ] `npm run validate:release` runs the release validation harness.
- [ ] `agentproof --policy-packs` lists all starter packs.
- [ ] `agentproof --init --policy-pack standard-pr-gate` writes the expected config.
- [ ] `agentproof --init --policy-pack strict-client-delivery --ci --agent` creates config, CI workflow, and agent contract.

## Reusable action checks

- [ ] `action.yml` exposes `receipt`, `summary`, `sarif`, `html`, `pr-comment`, `baseline`, and `history` inputs.
- [ ] `action.yml` exposes `score`, `verdict`, `findings`, `report-path`, and `receipt-path` outputs.
- [ ] `templates/github-action.yml` uses `runstudio/agentproof@v1`.
- [ ] `.github/workflows/agentproof.yml` dogfoods the local action with `uses: ./`.
- [ ] Release tag `v1` points at the validated action version.

## Demo readiness

- [ ] `package.json` includes `examples` in `files` so packaged demos remain usable.
- [ ] `docs/BEFORE_AFTER.md` explains the bad PR and good PR contrast in under 30 seconds.
- [ ] `examples/bad-agent-pr` still contains intentionally risky demo code.
- [ ] `examples/good-agent-pr` shows the cleaned-up version of the same idea.
- [ ] `examples/monorepo-agent-pr` demonstrates workspace package command detection.
- [ ] `examples/good-agent-claim.md` demonstrates a scoped, evidence-based final claim.
- [ ] Launch posts link to the before/after story instead of only listing features.

## Landing page checks

- [ ] `homepage/index.html` shows the terminal verdict above the fold.
- [ ] The before/after demo is visible without reading the full README.
- [ ] The install section includes local scan, changed-file scan, claim audit, and one-command setup.
- [ ] GitHub Pages URL is added to the repository website field.

## Community readiness

- [ ] Issue templates exist for bugs, rule requests, policy packs, and agent workflows.
- [ ] PR template asks for AgentProof evidence and scoped claims.
- [ ] `docs/CONTRIBUTOR_IDEAS.md` gives maintainers good first contribution paths.
- [ ] First discussion prompt invites maintainers to share bad agent PR patterns.

## Agent integration kit

- [ ] `agentproof --init --all` creates config, CI, agent contract, and all supported agent templates.
- [ ] `docs/AGENT_INTEGRATIONS.md` lists Codex, Claude Code, Cursor, Copilot, and generic harnesses.
- [ ] `templates/agents/AGENTS.md` contains the final answer contract.
- [ ] `templates/agents/CLAUDE.md` is ready to copy into a Claude Code repo.
- [ ] `templates/agents/cursor-agentproof.mdc` is ready to copy into `.cursor/rules/agentproof.mdc`.
- [ ] `templates/agents/copilot-instructions.md` is ready to copy into `.github/copilot-instructions.md`.
- [ ] `agentproof --init --agents codex,cursor,claude,copilot` scaffolds selected templates without overwriting existing files.

## Config schema readiness

- [ ] `schemas/agentproof.config.schema.json` covers profiles, thresholds, baselines, history, scanner limits, monorepo packages, custom commands, budgets, severity overrides, and suppressions.
- [ ] `docs/CONFIG.md` explains policy-pack config generation and agent instruction scaffolding.
- [ ] `templates/agentproof.config.json` includes the schema URL for editor autocomplete.
- [ ] Built-in policy packs include the schema URL.

## Summary output readiness

- [ ] `agentproof --summary agentproof-summary.json` writes the compact automation artifact.
- [ ] `docs/SUMMARY_OUTPUT.md` documents the summary shape and schema version.
- [ ] `schemas/agentproof.summary.schema.json` matches the generated summary shape.
- [ ] Demo artifacts include `agentproof-summary.json`.

## Security model readiness

- [ ] Security findings and command outputs redact obvious token or credential values.
- [ ] `docs/SECURITY_MODEL.md` explains trust boundaries and `--no-run-scripts`.
- [ ] `SECURITY.md` includes reporting guidance for sensitive output exposure.

## Rule gallery readiness

- [ ] `docs/RULE_GALLERY.md` covers security, UI, slop, claims, and policy examples.
- [ ] Each gallery item shows bad code or claim, AgentProof finding, and safer alternative.
- [ ] README links to the gallery from the docs table.

## PR comment readiness

- [ ] `agentproof-pr-comment.md` includes verdict, score, and a decision line.
- [ ] Top findings include severity, rule id, title, and location.
- [ ] Verification commands include package cwd when generated from a monorepo.
- [ ] Artifact paths include report, SARIF, receipt, and summary when configured.
- [ ] `templates/github-action-pr-comment.yml` posts comments only through explicit opt-in workflow permissions.
- [ ] `docs/PR_COMMENT_WORKFLOW.md` documents `pull-requests: write` and fork-safety behavior.

## Artifact guide readiness

- [ ] `docs/ARTIFACTS.md` explains every generated artifact and its intended audience.
- [ ] Recommended CI bundle includes SARIF, HTML, PR comment, receipt, summary, and history.
- [ ] Security sensitivity notes link to `docs/SECURITY_MODEL.md`.

## Maintainer operations readiness

- [ ] `docs/MAINTAINER_PLAYBOOK.md` defines launch-week triage priorities and labels.
- [ ] `docs/launch-kit/MAINTAINER_RESPONSES.md` contains short responses for common public questions.
- [ ] `docs/POSITIONING.md` covers comparison objections without attacking adjacent tools.
- [ ] Maintainers know not to overclaim security, monorepo, or production-readiness guarantees.

## Adoption readiness

- [ ] `docs/ADOPTION.md` explains observe-only, baseline PR gate, and strict agent contract phases.
- [ ] `templates/adoption/phase-1-observe.yml` is permission-light and non-blocking.
- [ ] `templates/adoption/phase-2-pr-gate.yml` uses baseline, SARIF, receipt, summary, and history.
- [ ] `templates/adoption/phase-3-strict-agent-contract.yml` requires `.agentproof/final-claim.md`.

## CLI reference readiness

- [ ] `docs/CLI_REFERENCE.md` lists every public flag.
- [ ] Exit codes are documented.
- [ ] `--init --all`, `--agents`, `--summary`, `--policy-packs`, and `--verify-receipt` examples are present.

## Supply chain readiness

- [ ] `docs/SUPPLY_CHAIN.md` documents npm, GitHub tags, public contracts, and artifact sensitivity.
- [ ] `npm run pack:dry-run` has been reviewed intentionally.
- [ ] Release notes mention validation command and known limitations.
- [ ] npm provenance is used when publishing from GitHub Actions.
- [ ] The floating `v1` action tag is moved only after validation.

## Architecture documentation readiness

- [ ] `docs/ARCHITECTURE.md` reflects the current run pipeline and module map.
- [ ] `CONTRIBUTING.md` links to the architecture guide.
- [ ] Public contracts are documented before release.
