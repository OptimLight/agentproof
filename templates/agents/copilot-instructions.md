# GitHub Copilot Instructions: AgentProof

This repository uses AgentProof for AI-assisted pull requests.

When proposing or completing code changes:

- Do not state that tests, builds, lint, or type checks passed unless there is direct evidence.
- Keep final claims scoped to observed work and generated artifacts.
- Prefer small, reviewable changes with clear risk notes.
- If asked to prepare a PR, include an AgentProof command in the PR evidence section.

Recommended verification command:

```bash
npx agentproof --path . --profile strict --claim .agentproof/final-claim.md --receipt agentproof-receipt.json --pr-comment agentproof-pr-comment.md
```

If AgentProof says `DO NOT SHIP` or `FIX BEFORE MERGE`, do not describe the PR as ready.
