# GitHub labels

AgentProof includes a recommended label set in:

```text
.github/labels.yml
```

The labels match the maintainer triage workflow in `docs/MAINTAINER_TRIAGE.md`.

## Recommended labels

| Label | Purpose |
|---|---|
| `bug` | Documented behavior is broken or crashes. |
| `rule request` | A user proposes a new AgentProof check. |
| `false positive` | A finding may be noisy or incorrectly scoped. |
| `docs` | README, guides, examples, onboarding, or launch docs. |
| `github-action` | Action inputs, outputs, annotations, workflows, or artifacts. |
| `claim-audit` | Final claim wording, evidence matching, or claim templates. |
| `security` | Secrets, command execution, supply chain, or sensitive artifact handling. |
| `adoption` | Rollout, observe-only, baselines, policy packs, or team onboarding. |
| `monorepo` | Workspace, package detection, changed packages, or package-level evidence. |
| `needs reproduction` | Needs a minimal example, sanitized output, or clearer steps. |
| `good first issue` | Safe and well-scoped for a first contribution. |
| `help wanted` | Maintainers welcome community help. |
| `blocked` | Waiting on external context, reproduction, or maintainer decision. |
| `release` | Release packaging, validation, changelog, or GitHub/npm launch work. |
| `launch-kit` | Social posts, demo video, positioning, repo profile, or launch assets. |

## Import options

GitHub does not automatically import `.github/labels.yml` from a repository.

Use your preferred label sync tool, GitHub CLI script, or manual setup.

Manual setup is acceptable for the first public release because the label list is intentionally small.

## Triage flow

Use labels in this order:

1. Classify the issue type: `bug`, `rule request`, `false positive`, `docs`, `github-action`, or `claim-audit`.
2. Add context labels: `security`, `adoption`, `monorepo`, `release`, or `launch-kit`.
3. Add state labels: `needs reproduction`, `blocked`, `good first issue`, or `help wanted`.

## Safety note

If an issue contains secrets or private data, prioritize cleanup before normal labeling.

Use:

```text
security
needs reproduction
```

Then ask the reporter to remove sensitive information and continue with a sanitized reproduction.

