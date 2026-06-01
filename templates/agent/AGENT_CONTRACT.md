# AgentProof Agent Contract

This repository uses AgentProof as the local trust gate for AI-generated code.

## Before claiming a task is done

1. Draft your final message into `.agentproof/final-claim.md`.
2. Run:

```bash
npx agentproof --path . --profile strict --claim .agentproof/final-claim.md --receipt agentproof-receipt.json --pr-comment agentproof-pr-comment.md
```

3. If AgentProof returns `DO NOT SHIP` or `FIX BEFORE MERGE`, do not claim completion.
4. If AgentProof reports unproven claims, rewrite the final message so it only says what the evidence proves.
5. Include verdict, score, receipt path, verification scope, and remaining risks in the final answer.

## Never claim

- tests passed unless the test command passed;
- build passed unless the build command passed;
- lint/typecheck passed unless those commands passed;
- production-ready when critical or high findings remain;
- no blockers when AgentProof reported active blockers.
