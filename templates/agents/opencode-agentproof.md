# OpenCode AgentProof Instruction

Use AgentProof as the final trust gate for code changes.

Before final response:

```bash
mkdir -p .agentproof
$EDITOR .agentproof/final-claim.md
npx agentproof --path . --profile strict --claim .agentproof/final-claim.md --receipt agentproof-receipt.json
```

If scripts are intentionally skipped, say `static-only` and do not imply runtime verification.

If claim audit fails, rewrite the claim and rerun AgentProof before responding.
