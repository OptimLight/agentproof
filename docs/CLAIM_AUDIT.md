# Claim Audit

AgentProof can audit an agent's final message with `--claim`.

The point is simple: if an agent says a test, build, lint, typecheck, or production-readiness signal exists, AgentProof should be able to connect that claim to observed evidence.

## Basic usage

```bash
npx agentproof --path . --claim .agentproof/final-claim.md
```

You can also pass inline text:

```bash
npx agentproof --path . --claim "Updated the docs and removed the unsafe HTML."
```

## Path resolution

Claim file paths are resolved from the audited project path.

This means:

```bash
npx agentproof --path examples/bad-agent-pr --claim ../agent-claim.md
```

loads:

```text
examples/agent-claim.md
```

because the audited root is:

```text
examples/bad-agent-pr
```

## Safer final claim style

Prefer:

```text
Changed:
- Removed unsafe HTML injection.
- Added alt text to the hero image.
- Replaced placeholder copy.

Evidence:
- AgentProof static scan generated a receipt.

Scope:
- No automated test result is reported in this pass.
- Remaining review should focus on copy and product fit.
```

Avoid unsupported claims like:

```text
Tests passed, build passed, lint is clean, and this is ready to ship.
```

unless those commands actually ran and passed.

## Why negative wording can still be noisy

Keep final claims direct. Instead of writing sentences that contain risky phrases in the negative, such as "I am not claiming tests passed", say what evidence exists:

```text
No automated test result is reported for this pass.
```

This keeps the claim easy for both humans and simple static tools to interpret.
