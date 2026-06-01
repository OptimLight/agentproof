# Publishing AgentProof

This guide is for maintainers preparing a public GitHub and npm release.

## Preflight

Do not publish until validation has been run intentionally.

Recommended validation sequence:

```bash
npm run validate:release
```

The script runs the core CLI, demo, receipt, summary, monorepo, and `--init --all` checks. Some fixture runs are expected to fail because AgentProof should block bad agent PRs.

Manual validation sequence:

```bash
npm run doctor
npm run rules
npm run demo
npm run demo:claim
npm run demo:sarif
npm run trend
npm run self-check
```

`npm run demo` and related demo commands may intentionally fail because the fixture is bad. For launch, the expected behavior is that AgentProof catches the bad fixture and emits useful artifacts.

## GitHub repository setup

Use these settings:

- Repository name: `agentproof`
- Description: `Local QA gate for AI-generated code: tests, build, security smells, UI slop, docs drift, claim audit, SARIF, receipts, and PR risk scoring.`
- Website: GitHub Pages using `homepage/index.html` when ready
- Topics: see `docs/launch-kit/REPO_PROFILE.md`
- License: MIT

Recommended pinned docs:

- `README.md`
- `docs/DEMO.md`
- `docs/COMPARISON.md`
- `docs/PUBLIC_ROADMAP.md`

## npm publish checklist

1. Confirm `package.json` metadata is correct.
2. Confirm `files` includes `bin`, `src`, `schemas`, `templates`, `skills`, `docs`, and `action.yml`.
3. Confirm `bin.agentproof` points to `./bin/agentproof.mjs`.
4. Confirm Node engine is `>=18`.
5. Confirm generated artifacts are ignored: reports, SARIF, badges, receipts, history.
6. Run validation intentionally.
7. Publish only from a clean, reviewed state.

## Release command

When ready:

```bash
npm publish --access public
```

## After publishing

Smoke test from a temporary directory:

```bash
npx agentproof --help
npx agentproof --rules markdown
npx agentproof --init --ci --agent
npx agentproof --doctor
```

## Launch sequence

1. Publish GitHub repo.
2. Publish npm package.
3. Create GitHub release from `templates/launch/release-notes-v0.1.0.md`.
4. Post launch copy from `docs/launch-kit/POSTS.md`.
5. Share the demo path from `docs/DEMO.md`.
6. Track issues and star feedback for the first 48 hours.

## GitHub Action release

Tag the repository with the same major version users reference in workflows:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Then move or create the floating `v1` tag for copy-paste installs:

```bash
git tag -f v1 v1.0.0
git push origin v1 --force
```

Do this only after intentional validation. The reusable action runs from the repository contents, so `action.yml`, `bin`, and `src` must be included in the release tag.

## Public schemas

AgentProof publishes JSON schemas for public machine-readable artifacts:

```text
schemas/agentproof.config.schema.json
schemas/agentproof.receipt.schema.json
schemas/agentproof.summary.schema.json
```

Before a release, treat changes to these schemas as API changes. If the generated summary shape changes, update `schemaVersion` and `docs/SUMMARY_OUTPUT.md` intentionally.

Confirm `docs/ARTIFACTS.md` still matches the generated artifacts before publishing.

If the PR comment template changes, confirm `docs/PR_COMMENT_WORKFLOW.md` still documents the required `pull-requests: write` permission and fork-safety condition.

## Launch-week operations

Before announcing publicly, review:

```text
docs/MAINTAINER_PLAYBOOK.md
docs/launch-kit/MAINTAINER_RESPONSES.md
```

These files keep public replies, issue triage, and scope boundaries consistent during the first wave of attention.

## Adoption templates

Confirm adoption templates are included and up to date:

```text
docs/ADOPTION.md
templates/adoption/phase-1-observe.yml
templates/adoption/phase-2-pr-gate.yml
templates/adoption/phase-3-strict-agent-contract.yml
```

## CLI reference

Before release, confirm `docs/CLI_REFERENCE.md` reflects the current public flags. Treat CLI flags as part of the public API.

## Supply chain checklist

Review `docs/SUPPLY_CHAIN.md` before publishing.

At minimum:

```bash
npm run validate:release
npm run pack:dry-run
```

Use npm provenance when publishing from GitHub Actions:

```bash
npm publish --access public --provenance
```
