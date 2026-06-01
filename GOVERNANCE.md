# Governance

AgentProof uses lightweight maintainer governance.

The project should move quickly, stay local-first, and avoid becoming a vague "AI judge". Decisions should protect the core promise:

```text
Your AI agent says it is done. AgentProof tells you if it is shippable.
```

## Maintainer responsibilities

Maintainers are responsible for:

- keeping the README promise sharp and honest;
- reviewing rule requests with `docs/RULE_TRIAGE.md`;
- protecting local-first behavior in the default path;
- avoiding dependency creep;
- keeping CLI flags, artifact formats, and GitHub Action inputs stable;
- documenting breaking changes;
- triaging support safely with `SUPPORT.md` and `docs/MAINTAINER_TRIAGE.md`;
- not claiming validation passed unless it actually ran.

## Decision principles

Prefer changes that:

- catch real AI-agent PR failure modes;
- improve evidence quality for human reviewers;
- reduce adoption friction;
- make generated artifacts easier to trust;
- preserve local execution by default;
- are explainable without a model or cloud service.

Be cautious with changes that:

- require network access by default;
- add heavy runtime dependencies;
- make findings harder to explain;
- overfit to one framework without clear review value;
- turn AgentProof into a broad subjective quality judge;
- encourage users to treat the score as a replacement for human review.

## Public contracts

These require extra care:

- CLI flags and exit codes;
- rule ids and severities;
- config schema;
- receipt schema;
- summary schema;
- SARIF output shape;
- GitHub Action inputs and outputs;
- generated workflow paths;
- policy pack names.

Breaking changes should include:

- migration note;
- changelog entry;
- version bump decision;
- updated docs and examples.

## Rule decisions

Rules should be accepted when they are:

- locally detectable;
- review-relevant;
- actionable;
- scoped enough to avoid obvious noise;
- useful for AI-agent PRs specifically.

If an idea is valuable but hard to detect reliably, prefer docs, agent contract guidance, or a demo fixture before adding a noisy rule.

## Release decisions

Before a public release, maintainers should use:

```text
docs/RELEASE_READINESS_MATRIX.md
docs/launch-kit/LAUNCH_SCORECARD.md
templates/release-checklist.md
```

The minimum release posture:

- release validation has run;
- package contents are known;
- generated workflows are realistic;
- docs do not overclaim;
- known limitations are visible.

## Ownership

Until a broader maintainer group exists, Run Studio acts as the initial steward.

Future maintainers should be added based on:

- quality of contributions;
- judgment around false positives and evidence;
- care with security and support;
- willingness to preserve the project mission;
- ability to say no to attractive but misaligned features.

