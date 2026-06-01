# AgentProof Agent Instructions

This repository uses AgentProof as the trust gate for AI-assisted code changes.

## Before claiming completion

1. Draft your final answer into `.agentproof/final-claim.md`.
2. Run AgentProof against the repository:

```bash
npx agentproof --path . --profile strict --claim .agentproof/final-claim.md --receipt agentproof-receipt.json --pr-comment agentproof-pr-comment.md
```

3. If AgentProof reports `DO NOT SHIP` or `FIX BEFORE MERGE`, do not claim the task is complete.
4. Fix the blockers, or clearly state the remaining risks and ask the human owner how to proceed.
5. If AgentProof reports claim-audit findings, rewrite the final answer so it only says what the evidence proves.

## Final answer format

```text
AgentProof: <VERDICT> (<SCORE>/100)
Receipt: agentproof-receipt.json
Verification: <commands observed or static-only>
Risks: <remaining risks or none>
```

## Never claim

- tests passed unless the test command passed;
- build passed unless the build command passed;
- lint/typecheck passed unless those commands passed;
- production-ready when critical or high findings remain;
- no blockers when AgentProof reported active blockers.
