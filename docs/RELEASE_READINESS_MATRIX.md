# Release readiness matrix

This matrix is the maintainer view of AgentProof before a public GitHub and npm release.

It separates shipped functionality from release evidence. A feature can be implemented and still need validation before the project should be announced broadly.

## Status legend

| Status | Meaning |
|---|---|
| `Implemented` | The feature or asset exists in the repository. |
| `Needs verification` | The feature exists but must be checked with the release validation flow. |
| `Release blocker` | Do not publish until this is fixed or explicitly accepted. |
| `Post-launch` | Useful, but not required for the first public release. |

## Product readiness

| Area | Status | Evidence to collect before release |
|---|---|---|
| Core scan flow | Needs verification | `npm run validate:release` completes successfully. |
| Static checks | Needs verification | Bad fixture produces expected findings without crashing. |
| Verification commands | Needs verification | Good fixture and monorepo fixture exercise command detection. |
| Claim audit | Needs verification | Bad claim fails and safe claim does not overstate evidence. |
| Policy packs | Needs verification | `--policy-packs` renders, `--init --policy-pack` scaffolds config. |
| Baseline support | Needs verification | Baseline update and baseline apply work on fixture output. |
| Observe-only mode | Needs verification | Failing run preserves verdict but exits `0`. |
| GitHub annotations | Needs verification | `--github-annotations` emits escaped GitHub workflow commands on stderr while `--json` stdout stays parseable. |
| Artifact bundle | Needs verification | SARIF, HTML, PR comment, receipt, summary, badge all write successfully. |
| Receipt verification | Needs verification | Valid receipt verifies, modified or missing receipt fails. |
| Monorepo support | Needs verification | Workspace/package commands show package `cwd` and evidence. |

## GitHub readiness

| Area | Status | Evidence to collect before release |
|---|---|---|
| Composite action metadata | Needs verification | Local action or public tag works in a clean GitHub Actions run. |
| Action outputs | Needs verification | `score`, `verdict`, `findings`, and artifact paths are populated. |
| Action annotations | Needs verification | GitHub UI displays errors, warnings, and notices as expected. |
| Generated workflow | Needs verification | `agentproof --init --all` creates a usable workflow with changed-file history and explicit GitHub annotations. |
| PR comment artifact | Needs verification | `agentproof-pr-comment.md` is generated and readable. |
| Optional sticky PR comment | Needs verification | Template works only when `pull-requests: write` is configured. |
| Issue templates | Implemented | Bug, rule, policy pack, and agent workflow templates exist. |
| Discussion prompt | Implemented | Community prompt exists for worst agent PR stories. |

## Documentation readiness

| Area | Status | Evidence to collect before release |
|---|---|---|
| README first screen | Implemented | Problem, social card, quickstart, demo, and GitHub Action are visible. |
| Getting started | Implemented | New user can run first scan, demo, CI setup, and claim audit. |
| CLI reference | Implemented | Every public flag has a documented purpose. |
| Troubleshooting | Implemented | First-run failure paths are explained. |
| Recipes, FAQ, and claim template | Implemented | `--recipes`, `--troubleshoot`, `--faq`, and `--claim-template` are included in release validation. |
| GitHub Action docs | Implemented | Inputs, outputs, observe-only, annotations, and PR comments are covered. |
| Security model | Implemented | Trust boundaries and artifact sensitivity are documented. |
| Privacy posture | Implemented | `PRIVACY.md` explains local-first behavior, what is read/written, and artifact sensitivity. |
| Scope boundaries | Implemented | `LIMITATIONS.md` explains what AgentProof does not prove and how to interpret scores. |
| Rule triage | Implemented | Community rule requests can be evaluated consistently. |
| Community governance | Implemented | `CODE_OF_CONDUCT.md`, `GOVERNANCE.md`, `SUPPORT.md`, label config, and maintainer triage docs exist. |
| Launch kit | Implemented | Posts, repo profile, maintainer responses, star launch plan, and rule challenge exist. |

## Package readiness

| Area | Status | Evidence to collect before release |
|---|---|---|
| npm package metadata | Needs verification | `npm pack --dry-run` includes expected files and excludes generated artifacts. |
| Demo fixtures in package | Needs verification | `package.json` includes `examples` and `npm pack --dry-run` confirms fixtures are shipped. |
| Binary entrypoint | Needs verification | `npx agentproof --help` works after pack/install. |
| Node engine | Implemented | Package declares Node `>=18`. |
| Dependency footprint | Implemented | Runtime is dependency-free by design. |
| License | Needs verification | License file exists and package metadata matches it. |
| Changelog | Needs verification | Release notes match actual shipped features. |
| Version | Needs verification | `package.json`, docs, and tag strategy align before publish. |

## Launch readiness

| Area | Status | Evidence to collect before release |
|---|---|---|
| Social card | Implemented | `assets/social-card.svg` renders well in README and posts. |
| One-liner | Implemented | "The seatbelt for AI-generated pull requests." is used consistently. |
| Demo script | Needs verification | Screen recording commands run without surprise failures. |
| First 100 stars plan | Implemented | Target communities, posts, and contributor prompts are ready. |
| Rule challenge | Implemented | Community call-to-action points to the rule request template. |
| Maintainer response playbook | Implemented | Common issue and criticism responses are prepared. |

## Release blockers

Do not publish a public release until these are resolved:

- release validation has not been run;
- GitHub Action behavior has not been verified in GitHub Actions;
- `npm pack --dry-run` has not confirmed the package contents;
- generated workflows reference a public repo/tag that must exist before external users can rely on it;
- docs must not claim a command passed unless that command actually ran.

## Go/no-go decision

Use this decision rule:

| Decision | Criteria |
|---|---|
| Go | Validation passes, package contents are correct, action works, docs match reality. |
| Soft launch | CLI works locally, docs are honest, but Action or npm release still needs public verification. |
| No-go | Validation fails, package is incomplete, action output is broken, or docs overclaim proof. |

## Recommended final verification sequence

Run this before public launch:

```bash
npm run validate:release
npm run pack:dry-run
npm run demo:claim
npm run demo:good
npm run demo:monorepo
npm run demo:observe
npm run demo:annotations
npm run recipes
npm run troubleshoot
npm run faq
```

Only mark items complete after the commands actually run and the output matches the expectation.
