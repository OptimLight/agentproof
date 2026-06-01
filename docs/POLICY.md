# AgentProof Policy Guide

AgentProof is intentionally strict by default, but real teams need controlled exceptions. The policy layer gives you three levers: profiles, budgets, and suppressions.

## Profiles

| Profile | Best for | Behavior |
|---|---|---|
| `relaxed` | Exploratory branches, prototypes, throwaway demos | Keeps signal visible without blocking too early |
| `standard` | Normal agent-generated pull requests | Balanced default for team workflows |
| `strict` | Production, client delivery, auth, billing, data, security-sensitive work | Blocks aggressively on high-risk findings |

Run with:

```bash
agentproof --profile strict --path .
```

Or set it in `agentproof.config.json`:

```json
{
  "profile": "strict"
}
```

## Budgets

Budgets define how much risk is tolerated by severity. Exceeding a budget creates an additional policy finding.

```json
{
  "budgets": {
    "critical": 0,
    "high": 0,
    "medium": 6,
    "low": 20
  }
}
```

Recommended production posture:

- `critical`: always `0`
- `high`: `0` for production-bound PRs
- `medium`: small budget, usually under `8`
- `low`: use as signal, not a hard blocker unless your team wants it

## Severity overrides

Use overrides when a rule is useful but too aggressive for your repo.

```json
{
  "severityOverrides": {
    "hygiene.console-log": "low",
    "slop.generic-copy": "medium"
  }
}
```

Avoid using overrides to hide real security, build, test, auth, billing, or data-risk findings.

## Suppressions

Suppressions should be rare, explicit, and temporary. Every suppression should have a reason and an expiry date.

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

Supported fields:

- `id`: exact rule id or wildcard pattern, for example `slop.*`
- `category`: category such as `security`, `ui`, `slop`, `claims`, `policy`
- `file`: exact file path or wildcard pattern
- `reason`: human explanation shown in reports
- `expires`: ISO date after which suppression no longer applies

## Run Studio recommendation

Use this default for client projects:

```json
{
  "profile": "strict",
  "failUnder": 90,
  "budgets": {
    "critical": 0,
    "high": 0,
    "medium": 6
  }
}
```

If an AI agent generated the work, also audit the final claim:

```bash
agentproof --profile strict --claim .agentproof/final-claim.md
```

## Baselines

Baselines are for adoption. They capture current findings so AgentProof can block only new issues.

Create a baseline:

```bash
agentproof --update-baseline .agentproof/baseline.json
```

Use it in CI:

```bash
agentproof --baseline .agentproof/baseline.json --profile strict
```

Baseline findings remain visible in Markdown and HTML reports, but they are excluded from the active score.

Use baselines for:

- Legacy repos with known debt.
- Gradual adoption across a large monorepo.
- Teams that want strict gates for new agent-generated changes without boiling the ocean.

Do not use baselines for:

- New projects that should be clean from day one.
- Hiding newly introduced secrets, auth flaws, billing bugs, or failed builds.
- Avoiding ownership of critical security findings.
