# Agent Integrations

AgentProof is designed for one uncomfortable but useful rule:

```text
No AI coding agent should claim a task is done without evidence.
```

Use these templates to make that rule portable across agent tools.

## One-command install

Install all supported agent instruction templates:

```bash
npx agentproof --init --agents
```

Install the full AgentProof starter kit:

```bash
npx agentproof --init --all
```

This creates config, CI, an agent contract, and all supported agent instruction templates.

Install selected templates:

```bash
npx agentproof --init --agents codex,cursor,claude,copilot
```

AgentProof will not overwrite existing files.

## Templates

| Tool | Template |
|---|---|
| Codex and AGENTS.md-compatible agents | `templates/agents/AGENTS.md` |
| Claude Code | `templates/agents/CLAUDE.md` |
| Cursor | `templates/agents/cursor-agentproof.mdc` |
| GitHub Copilot | `templates/agents/copilot-instructions.md` |
| OpenCode or generic agent harnesses | `templates/agents/opencode-agentproof.md` |
| Repo-local contract | `templates/agent/AGENT_CONTRACT.md` |

Generated target paths:

| Agent | Target path |
|---|---|
| `codex` | `AGENTS.md` |
| `claude` | `CLAUDE.md` |
| `cursor` | `.cursor/rules/agentproof.mdc` |
| `copilot` | `.github/copilot-instructions.md` |
| `opencode` | `.opencode/agentproof.md` |

## Universal workflow

1. The agent drafts its intended final answer into `.agentproof/final-claim.md`.
2. AgentProof runs with `--claim` and writes a receipt.
3. The agent rewrites unsupported claims.
4. The human reviewer sees the verdict, score, receipt path, verification scope, and remaining risks.

```bash
npx agentproof --path . --profile strict --claim .agentproof/final-claim.md --receipt agentproof-receipt.json --pr-comment agentproof-pr-comment.md
```

## Codex / AGENTS.md

Copy:

```text
templates/agents/AGENTS.md
```

into the target repository as:

```text
AGENTS.md
```

Use this when the agent reads repository-level operating instructions.

## Claude Code

Copy:

```text
templates/agents/CLAUDE.md
```

into the target repository as:

```text
CLAUDE.md
```

## Cursor

Copy:

```text
templates/agents/cursor-agentproof.mdc
```

into:

```text
.cursor/rules/agentproof.mdc
```

## GitHub Copilot

Copy:

```text
templates/agents/copilot-instructions.md
```

into:

```text
.github/copilot-instructions.md
```

## Internal agent harness

If you control the harness, make AgentProof a required pre-finalization step:

```text
before_final_answer:
  write: .agentproof/final-claim.md
  run: npx agentproof --path . --profile strict --claim .agentproof/final-claim.md --receipt agentproof-receipt.json
  block_on:
    - DO NOT SHIP
    - FIX BEFORE MERGE
```

## Final answer contract

Every agent should end with:

```text
AgentProof: <VERDICT> (<SCORE>/100)
Receipt: agentproof-receipt.json
Verification: <commands observed or static-only>
Risks: <remaining risks or none>
```

## What this prevents

- "Tests passed" with no observed test command.
- "Ready to ship" while high or critical findings remain.
- "No blockers" while AgentProof found blockers.
- Static-only checks being described as full verification.
- Agent confidence replacing reviewable evidence.
