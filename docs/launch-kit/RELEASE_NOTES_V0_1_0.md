# AgentProof v0.1.0 release notes

AgentProof is a local QA gate for AI-generated pull requests.

It checks code, verification evidence, risk signals, artifacts, and the agent's final claim before a maintainer merges.

## Why this exists

AI coding agents can produce useful code, risky code, broken code, and a confident "done" message with the same tone.

AgentProof adds a local, reviewable gate between:

```text
The agent says it is done.
```

and:

```text
We merge it.
```

The memorable part: AgentProof audits the final claim. If the agent says "tests passed" but no passing test evidence was observed, the claim is flagged.

## Highlights

- Local CLI for AI-generated PR review.
- Static checks for secrets, unsafe HTML, dynamic execution, AI slop, docs readiness, and basic UI hygiene.
- Verification command detection for JavaScript/TypeScript, Python, Go, Rust, and custom commands.
- Final claim audit with `--claim`.
- Evidence-scoped final claim template with `--claim-template`.
- Observe-only adoption mode with `--observe-only`.
- GitHub annotations with `--github-annotations`.
- SARIF, HTML, badge, PR comment, receipt, summary, and history artifacts.
- Policy packs for prototypes, standard PR gates, strict client delivery, security-sensitive work, and legacy adoption.
- GitHub Action plus generated CI and agent instruction templates.
- Bad/good/monorepo demo fixtures.
- Local-first privacy, explicit limitations, support, governance, and maintainer triage docs.

## Try it

Print the command menu:

```bash
npx agentproof --recipes
```

Run a static-only first scan:

```bash
npx agentproof --path . --no-run-scripts
```

Audit an agent final claim:

```bash
mkdir -p .agentproof
npx agentproof --claim-template > .agentproof/final-claim.md
npx agentproof --path . --claim .agentproof/final-claim.md
```

Install the full setup in a repository:

```bash
npx agentproof --init --all
```

## GitHub Action

```yaml
- uses: runstudio/agentproof@v1
  with:
    path: .
    profile: strict
    changed: "true"
    base: origin/main
    fail-under: "85"
    github-annotations: "true"
```

For gradual rollout:

```yaml
- uses: runstudio/agentproof@v1
  with:
    path: .
    profile: strict
    fail-under: "85"
    observe-only: "true"
```

## Important scope note

AgentProof does not prove software is secure or production-ready.

It improves the review signal by collecting local evidence, flagging risky patterns, and challenging unsupported agent claims.

Read:

```text
LIMITATIONS.md
PRIVACY.md
SECURITY.md
```

## Maintainer release note

Before publishing this release publicly, run:

```bash
npm run validate:release
npm run pack:dry-run
```

Do not claim validation passed until it actually has.
