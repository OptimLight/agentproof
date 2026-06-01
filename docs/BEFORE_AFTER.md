# Before / After Demo

This is the fastest way to explain AgentProof.

## The setup

An AI coding agent says the work is done:

```text
Done - the feature is complete and ready to ship.

I verified everything locally. Tests passed, the build passed, lint is clean, and there are no blockers left.
```

But the pull request still contains risky code and weak evidence.

## Before: bad agent PR

Fixture:

```text
examples/bad-agent-pr
examples/agent-claim.md
```

What AgentProof is designed to catch:

| Risk | Example |
|---|---|
| Token-shaped secret | `sk-this_is_a_fake_but_token_shaped_value_for_demo` |
| Debug logging | `console.log("debug", apiKey)` |
| Missing accessibility | Image without `alt` text |
| Empty action | Empty `<button>` |
| Unsafe HTML | `dangerouslySetInnerHTML` from `window.location.hash` |
| Placeholder copy | `Lorem ipsum`, `Coming soon`, vague claims |
| Unproven final claim | Claims tests/build/lint passed without evidence |

Demo command:

```bash
npm run demo:claim
```

Story to tell:

```text
The agent said "ready to ship".
AgentProof asks: where is the proof?
```

## After: good agent PR

Fixture:

```text
examples/good-agent-pr
examples/good-agent-claim.md
```

What changed:

| Before | After |
|---|---|
| Hardcoded token-shaped value | Removed from source |
| Debug logging | Removed |
| Missing image alt text | Descriptive `alt` text |
| Empty button | Explicit button text |
| Unsafe HTML injection | Removed |
| Placeholder marketing copy | Concrete product copy |
| Overconfident agent claim | Scoped, evidence-based final claim |

Demo command:

```bash
node ./bin/agentproof.mjs --path examples/good-agent-pr --no-run-scripts --claim ../good-agent-claim.md --html good-agentproof-report.html --receipt good-agentproof-receipt.json
```

## Launch narrative

Use this framing in posts, README screenshots, and demos:

```text
AI agents are fast. That is the problem.
AgentProof turns "trust me bro" into a reviewable receipt.
```

## 30-second script

1. Show `examples/agent-claim.md`: the agent claims tests, build, and lint passed.
2. Show `examples/bad-agent-pr/src/App.jsx`: the code still has obvious risks.
3. Run the bad fixture demo and show the verdict.
4. Show `examples/good-agent-pr/src/App.jsx`: the same work cleaned up.
5. Show `examples/good-agent-claim.md`: the agent only claims what evidence supports.
6. Close with: "Your agent says it is done. AgentProof tells you if it is shippable."

## Claim path note

`--claim` file paths are resolved from the audited project path, not from the shell working directory. When scanning `examples/good-agent-pr`, the claim beside the fixture is passed as `--claim ../good-agent-claim.md`.
