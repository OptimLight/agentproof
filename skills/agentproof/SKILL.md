---
name: agentproof
version: "0.1.0"
description: Run AgentProof before claiming an AI-generated change is ready. Use for Codex, Claude Code, Cursor, Copilot, Gemini CLI, and other agent coding workflows.
---

# AgentProof Skill

Use this skill when you are about to say a coding task is done, especially if the change was generated or heavily edited by an AI agent.

## Contract

Before final delivery, draft your final answer into `.agentproof/final-claim.md`, then run:

```bash
npx agentproof --path . --profile strict --claim .agentproof/final-claim.md --fail-under 80
```

If the project is offline or package installation is not allowed, run the local binary if available:

```bash
node ./bin/agentproof.mjs --path . --profile strict --claim .agentproof/final-claim.md --fail-under 80
```

## How to respond

- If AgentProof returns `SHIP`, summarize the score and mention the report path.
- If it returns `SHIP WITH CARE`, list the medium findings and recommend whether to fix now or later.
- If it returns `FIX BEFORE MERGE`, do not claim the task is complete until high-severity findings are addressed or explicitly accepted by the user.
- If it returns `DO NOT SHIP`, stop and fix critical failures first.
- If a claim audit finding appears, rewrite the final answer so it only says what the evidence proves.

Use this final answer shape:

```text
AgentProof: <VERDICT> (<SCORE>/100)
Receipt: <receipt path or not generated>
Verification: <commands observed or static-only>
Risks: <remaining risks or none>
```

## Non-negotiables

- Never hide failing tests, build errors, possible secrets, or broken UI states.
- Never claim tests/build/lint passed unless AgentProof or the actual command output proves it.
- Never convert a failing AgentProof run into a vague caveat.
- If you skip script execution with `--no-run-scripts`, say that verification was static-only.
