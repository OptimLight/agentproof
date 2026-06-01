# Contributor Ideas

AgentProof is built around one question:

```text
Can this AI-generated PR be trusted enough to merge?
```

If you want to contribute, the best work usually improves one of these loops:

- catch a real agent failure earlier;
- reduce noisy false positives;
- make evidence easier to review;
- make CI adoption easier;
- help agents write safer final claims.

## Good first issues

| Area | Idea | Why it matters |
|---|---|---|
| Rules | Add a framework-specific unsafe HTML pattern | Agents often copy risky snippets from examples. |
| Rules | Detect fake social proof phrases beyond the defaults | AI slop often looks polished but empty. |
| Docs | Add a before/after demo for another stack | Maintainers star what they can understand quickly. |
| GitHub Action | Add an example for monorepos | Many agent workflows touch only one package. |
| Policy packs | Add an open-source-library pack | Libraries need stricter docs/API stability checks than apps. |
| Receipts | Improve receipt examples for reviewers | Evidence needs to be legible, not just machine-readable. |
| Claims | Add more unproven-claim phrases | Agents overclaim in many creative ways. |
| Claims | Improve the `--claim-template` wording | Better templates reduce unsupported final claims before audit time. |
| Adoption | Add an observe-only migration story from a real repo | Teams need proof before they block merges. |

## Rule proposal shape

A strong rule proposal includes:

```text
Rule id: security.example-risk
Severity: high
Bad example: smallest code/claim that should trigger
Why it matters: real review risk
Suggestion: what the developer should do instead
False positives: where this rule might be noisy
```

Before proposing a rule, skim `docs/RULE_GALLERY.md` to match the style: tiny bad example, expected finding, safer alternative, and why it matters.

Also read `docs/RULE_TRIAGE.md` so the request includes review value, detection evidence, severity, and likely false positives.

## Policy pack proposal shape

A strong policy pack proposal includes:

```text
Audience: who uses this pack
Posture: what blocks vs warns
Threshold: suggested failUnder
Budgets: allowed critical/high/medium/low counts
Suppressions: what is acceptable with a reason and expiry
Adoption path: first command a team should run
```

## Agent workflow proposal shape

A strong agent workflow proposal answers:

```text
Which agent?
Where does AgentProof run?
Where is the final claim stored?
Which artifacts does the human reviewer see?
What should the agent do if AgentProof says DO NOT SHIP?
```

## Claim wording tip

When writing final-claim examples, avoid negative sentences that contain unsupported success phrases. Prefer `No automated test result is reported for this pass` over `I am not claiming tests passed`.

## Non-goals

AgentProof should not become a giant magical judge.

Prefer small, explainable checks that help reviewers make a merge decision. A boring rule that catches a real failure is better than an impressive rule nobody trusts.

## Agent integration ideas

Good contributions in this area include:

- adding templates for another coding agent;
- improving `.agentproof/final-claim.md` wording examples;
- documenting a real CI or harness integration;
- reducing friction for teams that want AgentProof to run before an agent sends its final answer.

## Monorepo ideas

Useful future work:

- support nested workspace globs beyond simple `*` directories;
- detect changed packages from git diff;
- add package dependency graph awareness;
- add examples for pnpm, yarn, npm, and bun workspace layouts;
- improve PR summaries so package-level failures are grouped clearly.
