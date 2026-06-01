# Positioning Guide

Use this guide when describing AgentProof publicly.

## One-liner

```text
AgentProof is a local QA gate for AI-generated PRs.
```

## Slightly longer

```text
AgentProof checks code, evidence, risk, and the agent's final claim before merge.
```

## The memorable line

```text
Your AI agent says it is done. AgentProof tells you if it is shippable.
```

## Category

```text
Local trust gate for agent-generated code.
```

## Say this

- AgentProof turns agent confidence into reviewable proof.
- AgentProof complements tests, linters, secret scanners, SAST, CI, and human review.
- AgentProof audits the final agent claim against observed evidence.
- AgentProof is local by default and does not require a cloud service.
- AgentProof is useful for gradual adoption through baselines and policy packs.

## Do not say this

- AgentProof proves your code is secure.
- AgentProof replaces tests.
- AgentProof replaces human review.
- AgentProof is a full monorepo graph engine.
- AgentProof catches every secret.
- AgentProof guarantees agent output is correct.

## Objection handling

### Isn't this just lint?

```text
No. Linters are one signal. AgentProof wraps verification commands, security smells, UI/docs slop, claim audit, baselines, policies, receipts, SARIF, and PR artifacts around the specific question of whether an agent-written PR is safe enough to merge.
```

### Isn't this just CI?

```text
CI runs commands. AgentProof turns the relevant evidence into a verdict, receipt, PR comment, summary, policy decision, and claim audit.
```

### Isn't this just a secret scanner?

```text
No. AgentProof has lightweight secret-shaped checks, but dedicated secret scanners are still recommended. AgentProof adds broader PR trust context and agent-claim verification.
```

### Can the score be trusted?

```text
The score is a risk signal, not a proof of correctness. The evidence behind it is the important part: commands, findings, claim audit, policy, baseline, and artifacts.
```

### Why not use an LLM judge?

```text
AgentProof is deterministic and local by default. It is designed to produce reviewable evidence, not a second model's opinion.
```
