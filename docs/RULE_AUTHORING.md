# Rule Authoring Guide

AgentProof rules should be boring, explainable, and cheap to run. A good rule catches an agent failure mode that a human reviewer would want surfaced before merge.

## Rule quality bar

Every rule needs:

- Stable `id`, for example `security.secret-pattern`.
- Category, for example `security`, `verification`, `ui`, `slop`, `claims`, `policy`.
- Default severity.
- Clear detection criteria.
- Practical fix guidance.
- False-positive guidance.

## Severity rubric

| Severity | Use when |
|---|---|
| `critical` | The PR is unsafe or non-shippable: leaked secret, failed build, failed tests |
| `high` | Strong blocker: hardcoded credentials, failing lint/typecheck, contradicted agent claim |
| `medium` | Important but reviewable: unsafe HTML surface, missing alt text, missing verification scripts |
| `low` | Polish or trust smell: placeholder copy, dead link, noisy console logs |
| `info` | Context only, never blocks |

## Adding a rule

1. Add scanner logic near the relevant check module.
2. Emit findings with this shape:

```js
{
  id: 'category.rule-name',
  category: 'category',
  severity: 'medium',
  title: 'Human-readable finding title',
  file: 'src/file.ts',
  line: 42,
  detail: 'What AgentProof observed.',
  suggestion: 'What to do next.'
}
```

3. Add the rule to `src/rules.js` so users can discover it with:

```bash
agentproof --rules markdown
agentproof --rules json
```

4. Add a fixture in `examples/` if the rule is easier to understand visually.

## Suppression design

Suppression support is intentionally explicit. Do not add hidden ignores.

Good suppression:

```json
{
  "id": "slop.generic-copy",
  "file": "docs/internal-drafts/*",
  "reason": "Internal drafts are allowed before public launch.",
  "expires": "2026-12-31"
}
```

Bad suppression:

```json
{
  "category": "security"
}
```

Security suppressions should be narrow, temporary, and reviewed by a human.

## What not to add

- Slow network checks in the default path.
- Cloud-only checks.
- LLM-only checks that cannot explain the evidence.
- Rules that only encode one maintainer's taste.
- Auto-fixes that modify code without a dry-run path.

## Explaining rules

Every rule in `src/rules.js` can be explained from the CLI:

```bash
agentproof --explain security.secret-pattern
```

This is part of the rule quality bar. If a rule cannot be explained clearly, it is not ready to block a PR.

## Rule gallery

Use `docs/RULE_GALLERY.md` as the public-facing explanation layer for rules. The gallery should stay short, visual, and example-driven. The CLI catalog can be exhaustive; the gallery should make maintainers instantly understand why AgentProof exists.
