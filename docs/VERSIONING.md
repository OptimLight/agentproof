# Versioning Policy

AgentProof uses semantic versioning after v1.0.0. Before v1.0.0, minor releases may still change public behavior, but maintainers should avoid breaking CLI workflows without a migration note.

## Stable surfaces to protect

- CLI command names and flags.
- Rule ids.
- Config schema fields.
- Receipt schema fields.
- Summary schema fields.
- SARIF output basics.
- Exit code meanings.

## Exit codes

| Code | Meaning |
|---:|---|
| `0` | Gate passed or read-only command succeeded |
| `1` | Gate failed or verified receipt failed |
| `2` | Usage error, invalid input, missing receipt, invalid JSON |

## Rule id policy

Rule ids should be treated as public API because teams use them in suppressions, severity overrides, SARIF, receipts, baselines, and dashboards.

Do not rename a rule id without:

- changelog entry;
- migration guidance;
- compatibility alias when possible.

## Config schema policy

Adding optional config fields is safe in minor releases.

Removing fields, changing meanings, or changing defaults in a way that blocks more PRs should wait for a major release after v1.0.0.

## Receipt schema policy

Receipts are intended for downstream tools and agents. Additive changes are preferred. Required fields should remain stable.

## Summary schema policy

Summaries are intended for bots, dashboards, and agent harnesses. Keep `schemaVersion` stable unless the shape changes in a breaking way. Additive optional fields are preferred.
