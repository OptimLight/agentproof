# AgentProof PR checklist

## What changed

Describe the smallest useful change in this PR.

## Evidence

Paste or attach the relevant AgentProof command and result.

```bash
npx agentproof --path . --profile strict --claim .agentproof/final-claim.md --receipt agentproof-receipt.json
```

## Checklist

- [ ] I did not claim tests/build/lint passed unless they actually ran and passed.
- [ ] New or changed rules include a bad example and a false-positive note.
- [ ] New CLI flags are documented in README/help/docs where relevant.
- [ ] New GitHub Action behavior is documented in `docs/GITHUB_ACTION.md` where relevant.
- [ ] Policy or threshold changes explain who they are for.
- [ ] Demo changes preserve the before/after story.
- [ ] Remaining risks are named instead of hidden.

## Agent claim

If an AI agent assisted, paste its final claim or link to `.agentproof/final-claim.md`.
