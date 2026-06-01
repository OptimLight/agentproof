# AgentProof Configuration

AgentProof uses `agentproof.config.json` for team policy, custom commands, baselines, suppressions, and scanner behavior.

## Editor autocomplete

Add `$schema` to your config:

```json
{
  "$schema": "https://raw.githubusercontent.com/runstudio/agentproof/main/schemas/agentproof.config.schema.json",
  "profile": "strict"
}
```

The schema lives in `schemas/agentproof.config.schema.json` and is included in the npm package.

## Minimal config

```json
{
  "$schema": "https://raw.githubusercontent.com/runstudio/agentproof/main/schemas/agentproof.config.schema.json",
  "profile": "standard"
}
```

## Strict production config

```json
{
  "$schema": "https://raw.githubusercontent.com/runstudio/agentproof/main/schemas/agentproof.config.schema.json",
  "profile": "strict",
  "failUnder": 90,
  "baseline": ".agentproof/baseline.json",
  "budgets": {
    "critical": 0,
    "high": 0,
    "medium": 6
  }
}
```

## Custom commands

```json
{
  "commands": [
    {
      "name": "repo-ci",
      "label": "repository CI",
      "command": "make ci",
      "severity": "critical",
      "language": "custom"
    },
    {
      "name": "uv-pytest",
      "command": "uv run pytest",
      "severity": "critical",
      "language": "python"
    }
  ]
}
```

## DesignGuard config

Enable product/design readiness checks in config:

```json
{
  "profile": "strict",
  "failUnder": 90,
  "design": {
    "enabled": true,
    "type": "saas",
    "url": "http://localhost:3000",
    "routes": ["/", "/pricing", "/dashboard"],
    "viewports": ["mobile", "desktop"],
    "strictness": "strict",
    "ai": {
      "enabled": false,
      "blocking": false,
      "provider": "codex-auth",
      "model": "gpt-5.5",
      "reasoning": "xhigh"
    }
  }
}
```

Use `--design-url` when the URL differs between local and CI. Without a URL, DesignGuard runs static checks only and explains the weaker proof in the report.

## Suppressions

Suppressions should be rare, narrow, and temporary.

```json
{
  "suppressions": [
    {
      "id": "slop.generic-copy",
      "file": "docs/internal-drafts/*",
      "reason": "Internal draft copy is allowed before public launch.",
      "expires": "2026-12-31"
    }
  ]
}
```

## Baseline

```bash
agentproof --update-baseline .agentproof/baseline.json
agentproof --baseline .agentproof/baseline.json --profile strict
```

Baseline findings stay visible, but are excluded from the active score.

## History

`--history` appends run summaries to JSONL:

```bash
agentproof --history .agentproof/history.jsonl
```

`--trend` reads that file without running a scan:

```bash
agentproof --trend .agentproof/history.jsonl
```

You can document the intended history path in config:

```json
{
  "history": ".agentproof/history.jsonl"
}
```

## Doctor mode

Use doctor mode to inspect effective configuration without running checks:

```bash
agentproof --doctor
```

This is useful before opening a PR that adds AgentProof to CI. It shows the profile, budgets, baseline, history, suppressions, overrides, project markers, and commands AgentProof would run.

## Scaffold GitHub Actions

Create config and CI workflow in one command:

```bash
agentproof --init --ci
```

AgentProof never overwrites an existing `agentproof.config.json` or `.github/workflows/agentproof.yml`.

## Receipt output

`--receipt` writes a portable JSON proof artifact:

```bash
agentproof --receipt agentproof-receipt.json
```

Receipts are useful for agent final messages, PR metadata, dashboards, and audit trails.

## Verify receipt

Use `--verify-receipt` when another job or agent needs to consume AgentProof output without rerunning checks:

```bash
agentproof --verify-receipt agentproof-receipt.json
```

This exits non-zero when the receipt says the original run failed.

## Agent contract scaffold

Create a local contract for AI coding agents:

```bash
agentproof --init --agent
```

This writes `.agentproof/AGENT_CONTRACT.md` without overwriting an existing contract.

## Policy pack config generation

Fastest setup:

```bash
agentproof --init --all
```

This creates the standard PR gate config, CI workflow, agent contract, and agent instruction templates.

You can generate a starter config from a built-in policy pack instead of writing thresholds by hand:

```bash
agentproof --init --policy-pack standard-pr-gate
agentproof --init --policy-pack strict-client-delivery
agentproof --init --policy-pack security-sensitive
```

List available packs:

```bash
agentproof --policy-packs
```

Policy packs are normal `agentproof.config.json` files. After generation, edit them like any other config.

## Agent instruction scaffolding

Config controls the AgentProof scanner. Agent instruction files control how coding agents behave before they claim completion.

Install agent templates with:

```bash
agentproof --init --agents codex,cursor,claude,copilot
```

This does not modify `agentproof.config.json`; it creates files such as `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/agentproof.mdc`, and `.github/copilot-instructions.md` without overwriting existing files.

## Scanner tuning fields

| Field | Purpose |
|---|---|
| `maxFiles` | Caps text files scanned by static checks. |
| `commandTimeoutSeconds` | Sets the timeout per verification command. |
| `ignore` | Adds path fragments or names ignored by file scanning. |
| `slopPhrases` | Adds team-specific phrases treated as unfinished or generic AI output. |
| `packages` | Adds monorepo package directories or simple workspace patterns. |
| `commands` | Defines custom proof commands that should run before detected commands. |
| `design` | Enables DesignGuard product/design readiness checks. |
| `severityOverrides` | Changes specific rule severities for a team's risk posture. |
| `suppressions` | Documents known false positives with reason and optional expiry. |

## Suppression quality bar

Good suppressions are narrow and temporary:

```json
{
  "id": "slop.generic-copy",
  "file": "docs/internal-drafts/*",
  "reason": "Internal drafts are allowed before public review.",
  "expires": "2026-12-31"
}
```

Avoid broad permanent suppressions unless the repo owner has explicitly accepted that risk.
