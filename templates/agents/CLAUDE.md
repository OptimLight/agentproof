# Claude Code AgentProof Contract

Before saying a coding task is done, create `.agentproof/final-claim.md` with the answer you intend to give.

Then run:

```bash
npx agentproof --path . --profile strict --claim .agentproof/final-claim.md --receipt agentproof-receipt.json
```

If AgentProof finds high or critical issues, stop and fix them before claiming completion.

If AgentProof reports unproven claims, remove the unsupported claim. Prefer concrete evidence over confident summaries.

Final response must include:

- AgentProof verdict and score;
- receipt path;
- verification scope;
- remaining risks.
