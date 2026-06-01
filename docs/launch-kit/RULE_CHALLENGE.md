# Community rule challenge

Use this mini-campaign after launch to turn early attention into useful contributions.

The prompt is simple:

```text
Show us the AI-agent PR pattern AgentProof should catch next.
```

## Goal

Collect real-world examples of:

- overconfident final claims;
- risky shortcuts from coding agents;
- placeholder UI shipped as done;
- missing verification evidence;
- security smells that agents commonly introduce;
- confusing CI behavior around generated PRs.

The best submissions become:

- new rule requests;
- docs examples;
- demo fixtures;
- policy pack improvements;
- maintainer response examples.

## Post template

```text
AgentProof rule challenge:

What is one AI-agent PR pattern you wish a local review gate caught before merge?

Best examples include:
- a tiny bad snippet or final claim
- why it is risky
- what the safer version looks like
- likely false positives

Open a rule request:
https://github.com/runstudio/agentproof/issues/new?template=rule_request.yml
```

## Maintainer workflow

1. Ask for the smallest reproducible bad example.
2. Ask what evidence AgentProof can detect locally.
3. Ask for likely false positives.
4. Classify with `docs/RULE_TRIAGE.md`.
5. Convert strong ideas into implementation issues.
6. Convert weak-but-useful ideas into docs or agent contract guidance.

## Weekly recap format

```text
This week's AgentProof rule ideas:

1. Accepted: unsupported "tests passed" claim variants
2. Needs scoping: generated migration files with no rollback note
3. Better as docs: agents should mention manual QA caveats

If your coding agent has fooled you with a confident final message, send the smallest example.
```

## What to avoid

Do not turn the challenge into a generic complaint thread about AI tools.

Keep the framing practical:

```text
Agents are useful. Useful tools still need receipts.
```

