# Rule triage

AgentProof should feel useful in real pull request review, not noisy for the sake of looking busy.

Use this guide when proposing, accepting, rejecting, or implementing a new rule.

## What makes a good AgentProof rule

A good rule is:

- specific enough that a maintainer understands the risk immediately;
- local-first, meaning it can usually run without network access;
- hard for an agent to satisfy with empty ceremony;
- connected to merge risk, reviewer trust, security, delivery quality, or claim evidence;
- paired with a concrete suggestion;
- honest about likely false positives.

Good rule shape:

```text
When AgentProof sees X, it should report Y because Z can break review, safety, or delivery.
```

Weak rule shape:

```text
AgentProof should detect bad code.
```

## Triage rubric

Score each proposed rule before accepting it.

| Dimension | Strong signal | Weak signal |
|---|---|---|
| Review value | Helps a maintainer decide whether to merge. | Merely enforces taste. |
| Detectability | Can be detected from files, command output, config, or claims. | Needs broad external context. |
| False-positive risk | Can be scoped with file types, patterns, or suggestions. | Likely noisy across normal projects. |
| Agent relevance | Catches common AI-agent overconfidence, slop, or unsafe shortcuts. | Not specific to agent-assisted work. |
| Actionability | Suggestion tells the user what to do next. | Finding only says "this is bad". |

Accept rules that are strong in at least four dimensions.

## Severity rubric

Use severity for merge risk, not drama.

| Severity | Use when |
|---|---|
| `critical` | The finding can expose secrets, break auth/payment/security boundaries, or support a dangerously false final claim. |
| `high` | The finding can block shipping, mislead reviewers, or introduce substantial security, reliability, or data risk. |
| `medium` | The finding is likely to reduce quality, accessibility, maintainability, or trust if ignored. |
| `low` | The finding is useful hygiene, weak signal, or review guidance. |

## Rule request checklist

A rule request should include:

- proposed rule id;
- category;
- why it matters in AI-agent PRs;
- smallest bad example;
- safer good example when possible;
- expected finding title and suggestion;
- suggested severity;
- detection evidence source;
- whether it works locally without network access;
- likely false positives;
- edge cases or file types.

## Prefer rules that catch AI-agent failure modes

AgentProof is not trying to replace every linter, SAST scanner, test runner, or accessibility tool.

Prefer rules that catch:

- unsupported final claims;
- fake verification language;
- placeholder UI shipped as complete work;
- unsafe shortcuts agents commonly introduce;
- hardcoded credential-shaped values;
- dead links, empty controls, and obvious UX slop;
- docs or package metadata that make adoption harder;
- risky CI or artifact behavior that misleads reviewers.

Avoid rules that only enforce:

- personal formatting preferences;
- framework ideology;
- vague "best practices";
- broad architecture opinions;
- style-only preferences with no review risk.

## Implementation notes

When implementing a rule, keep the output reviewer-friendly.

Finding title:

```text
Avoid claiming tests passed without observed test evidence
```

Finding detail:

```text
The final agent claim says tests passed, but AgentProof did not observe a passing test command.
```

Suggestion:

```text
Run the relevant test command or revise the final claim to say tests were not run.
```

## Decision outcomes

Use these outcomes when responding to rule requests:

| Outcome | Meaning |
|---|---|
| Accept | The rule is specific, detectable, actionable, and aligned with AgentProof. |
| Needs reproduction | The idea is promising but needs a smaller bad example. |
| Needs false-positive analysis | The idea may be noisy and needs scoping. |
| Better as docs | The idea is useful guidance but not a reliable automated rule. |
| Decline | The idea is too broad, subjective, external, or unrelated to AgentProof's mission. |

## Maintainer response templates

Accept:

```text
This fits AgentProof well: it is local, review-relevant, and actionable. Next step is a small fixture with one bad example and one safer example.
```

Needs reproduction:

```text
The idea is promising, but we need the smallest code/config/claim example that should trigger the rule before we can design it safely.
```

Needs scoping:

```text
This could be useful, but it may be noisy across normal projects. Can you add likely false positives and the file types or contexts where it should apply?
```

Better as docs:

```text
This is good reviewer guidance, but it does not look reliable enough for an automated rule yet. We should capture it in docs or agent instructions first.
```

Decline:

```text
Thanks for the thoughtful request. This is outside AgentProof's current lane because it depends on broad external context or subjective style preference.
```

