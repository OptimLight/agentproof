# Supply Chain and Release Trust

AgentProof asks teams to trust evidence before merging agent-written code. The project should hold itself to the same standard when publishing releases.

This document describes the intended release trust posture for GitHub, npm, and generated artifacts.

## Release principles

- Publish from a reviewed repository state.
- Run release validation intentionally before tagging.
- Keep public schemas, rule ids, CLI flags, and exit codes stable.
- Prefer provenance and traceability over opaque bundles.
- Avoid install-time surprises.
- Do not overclaim security guarantees.

## npm package posture

AgentProof is designed as a small Node CLI package.

Expected package properties:

- no install script;
- no postinstall script;
- no runtime dependency on a remote service;
- package contents controlled through `package.json` `files`;
- CLI entrypoint declared through `bin.agentproof`;
- Node engine `>=18`.

Before publishing, inspect the package contents:

```bash
npm run pack:dry-run
```

The package should include:

```text
bin/
src/
scripts/
templates/
skills/
docs/
assets/
schemas/
homepage/
action.yml
README.md
CHANGELOG.md
CONTRIBUTING.md
SECURITY.md
LICENSE
```

## npm provenance

When publishing from GitHub Actions, prefer npm provenance:

```bash
npm publish --access public --provenance
```

If publishing manually, document the maintainer, release tag, and validation command output in the release notes.

## GitHub release tags

Use immutable version tags:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The reusable GitHub Action may use a floating major tag for convenience:

```bash
git tag -f v1 v1.0.0
git push origin v1 --force
```

Only move `v1` after validation and release notes are ready.

## Public contracts

Treat these as public surfaces:

- CLI flags;
- exit codes;
- rule ids;
- config schema;
- receipt schema;
- summary schema;
- SARIF output basics;
- GitHub Action inputs and outputs;
- generated artifact names in templates.

Breaking changes should include migration notes.

## Generated artifacts

AgentProof can generate artifacts that contain project metadata, file paths, rule hits, and command names.

For private repositories, treat these as sensitive:

```text
AGENT_PROOF_REPORT.md
agentproof-report.html
agentproof.sarif
agentproof-pr-comment.md
agentproof-receipt.json
agentproof-summary.json
.agentproof/history.jsonl
.agentproof/baseline.json
```

AgentProof redacts common credential-shaped values, but redaction is not a replacement for secret rotation.

## GitHub Action permissions

The default generated workflow should stay permission-light:

```yaml
permissions:
  contents: read
  security-events: write
```

Posting PR comments is opt-in because it requires:

```yaml
permissions:
  pull-requests: write
```

Use `templates/github-action-pr-comment.yml` only when the team accepts that permission.

## Release evidence bundle

A release should have:

- release tag;
- changelog entry;
- validation command used;
- generated artifact examples from the demo fixture;
- npm package dry-run output reviewed by a maintainer;
- confirmation that public schemas are intentional;
- known limitations listed honestly.

## What AgentProof does not guarantee

AgentProof does not guarantee:

- source code is secure;
- secrets are all detected;
- generated artifacts contain no sensitive context;
- project scripts are safe to execute;
- third-party GitHub Actions used in templates are risk-free.

Use dedicated supply-chain tools where appropriate.
