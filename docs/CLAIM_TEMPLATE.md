# Claim template

AgentProof can audit an agent's final claim with `--claim`.

To make that claim easier to write, print the built-in template:

```bash
npx agentproof --claim-template
```

To save it where AgentProof expects it:

```bash
mkdir -p .agentproof
npx agentproof --claim-template > .agentproof/final-claim.md
```

Then edit the file and run:

```bash
npx agentproof --path . --claim .agentproof/final-claim.md
```

## What the template encourages

The template asks the agent to separate:

- what changed;
- which evidence was actually observed;
- which checks were not run;
- known risks or follow-ups;
- what the reviewer should focus on;
- the final claim.

## Safe claim style

Good:

```text
Implemented the requested change. Build and lint passed. I did not run the full test suite. Please review the changed UI states before merge.
```

Risky:

```text
Done. Everything is tested, fully verified, and production-ready.
```

The point is not to make agents less useful. The point is to make their confidence match the evidence.

