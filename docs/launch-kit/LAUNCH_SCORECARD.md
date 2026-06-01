# Launch scorecard

Use this scorecard on launch day to decide whether AgentProof is ready to share publicly.

The target is not perfection. The target is a credible, useful, honest release that makes maintainers want to try the tool and star the repo.

## Scoring

Score each category from `0` to `3`.

| Score | Meaning |
|---|---|
| `0` | Missing or misleading. |
| `1` | Present, but rough or unverified. |
| `2` | Good enough for public launch. |
| `3` | Strong, memorable, and easy to share. |

## Product

| Check | Score |
|---|---:|
| First local scan is easy to understand. |  |
| Bad demo is memorable and explains the pain. |  |
| Good demo shows safer behavior, not just fewer errors. |  |
| Claim audit feels unique and valuable. |  |
| Observe-only mode makes adoption low-risk. |  |
| GitHub annotations make findings visible in CI. |  |
| Artifact bundle feels useful for real PR review. |  |

## Documentation

| Check | Score |
|---|---:|
| README explains the problem in the first screen. |  |
| Quickstart has copy-paste commands. |  |
| Getting started guide answers "how do I use this?" |  |
| Troubleshooting answers "what if it fails?" |  |
| GitHub Action docs explain rollout and permissions. |  |
| Security model is honest about trust boundaries. |  |
| Rule triage makes community contributions easier. |  |

## Trust

| Check | Score |
|---|---:|
| Validation was run and results are known. |  |
| Package dry-run contents are known. |  |
| GitHub Action behavior was verified. |  |
| Generated workflows are realistic. |  |
| Docs do not overclaim passing tests or production readiness. |  |
| Known limitations are visible. |  |

## Launch

| Check | Score |
|---|---:|
| Social card is strong and shareable. |  |
| One-liner is memorable. |  |
| First post explains the pain clearly. |  |
| Demo recording path is ready. |  |
| Rule challenge turns attention into contributions. |  |
| Maintainer responses are ready for issues and criticism. |  |

## Decision thresholds

| Total | Decision |
|---:|---|
| `60+` | Strong public launch candidate. |
| `45-59` | Soft launch or limited beta. |
| `30-44` | Internal launch only. |
| `<30` | Keep building before sharing broadly. |

## Non-negotiables

Do not launch broadly if any of these are true:

- release validation has never been run;
- install or CLI entrypoint is broken;
- the README promises proof that has not been verified;
- the GitHub Action cannot run from the published repo/tag;
- the package contains private, generated, or accidental files.

## Launch day command list

Use this checklist after the release verification sequence:

```bash
npm run validate:release
npm run pack:dry-run
npm run demo:claim
npm run demo:good
npm run demo:observe
npm run demo:annotations
```

Then publish only if the scorecard and release readiness matrix agree.

