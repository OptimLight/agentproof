# Maintainer triage

Use this guide when AgentProof starts receiving public issues after launch.

The goal is to keep support useful, safe, and aligned with the project's promise:

```text
Agents are useful. Useful tools still need receipts.
```

## Triage labels

Recommended labels:

| Label | Use when |
|---|---|
| `bug` | A documented behavior is broken or crashes. |
| `rule request` | A user proposes a new check. |
| `false positive` | A finding appears noisy or unfair. |
| `docs` | The issue is about explanation, examples, or onboarding. |
| `github-action` | The issue concerns action inputs, outputs, annotations, or artifacts. |
| `claim-audit` | The issue concerns final claim wording or evidence matching. |
| `security` | The issue touches secrets, command execution, supply chain, or artifact leakage. |
| `needs reproduction` | The issue needs a smaller example. |
| `good first issue` | The scope is safe for a new contributor. |

The canonical label configuration lives in `.github/labels.yml`. See `docs/GITHUB_LABELS.md` for import guidance.

## First response checklist

For every issue, check:

- Does it include the command used?
- Does it include AgentProof version?
- Does it include sanitized output?
- Does it avoid secrets and private code?
- Is the report about local CLI, GitHub Action, docs, rules, or release packaging?
- Is this a bug, feature request, rule request, support question, or security concern?

If secrets or private data appear, ask the reporter to remove them and avoid quoting them in replies.

## Bug triage

Ask for:

```text
Command:
Node version:
Operating system:
AgentProof version:
Was --no-run-scripts used?
Was --observe-only used?
Minimal reproduction:
Sanitized output:
```

Prioritize bugs that affect:

- CLI startup;
- `--json` parseability;
- receipts and summaries;
- GitHub Action outputs;
- generated workflows;
- claim audit correctness;
- security-sensitive findings;
- package contents.

## Rule request triage

Use `docs/RULE_TRIAGE.md`.

Good rule requests have:

- a smallest bad example;
- a safer good example;
- local detection evidence;
- expected finding wording;
- likely false positives;
- a clear review or merge risk.

If the request is useful but hard to detect, convert it to docs or an agent contract suggestion instead of forcing a noisy rule.

## False positive triage

Ask:

- Which rule fired?
- What file type or context was involved?
- Is the example sanitized?
- Is the pattern common in normal projects?
- Would a scoped suppression be safer than changing the rule?
- Can the rule be narrowed without missing the real risk?

Prefer improvements that reduce noise without hiding security or claim-evidence risk.

## GitHub Action triage

Ask for:

- workflow snippet;
- action version or ref;
- relevant inputs;
- whether `fetch-depth: 0` is set when using `changed`;
- whether permissions include `security-events: write` when uploading SARIF;
- whether PR comments require `pull-requests: write`;
- sanitized logs.

Remember:

- annotations should not break JSON stdout;
- `observe-only` should preserve verdicts but exit successfully;
- generated workflows should be permission-light by default.

## Claim audit triage

When claim audit issues appear, separate:

- unsupported positive claims;
- safely scoped claims;
- negative wording that accidentally contains success phrases;
- missing command evidence;
- wording that should be added to the claim pattern list.

Point users to:

```bash
npx agentproof --claim-template
```

## Security triage

Move sensitive reports out of public issues.

Do not ask users to paste:

- real tokens;
- private `.env` files;
- production logs;
- proprietary code;
- internal URLs;
- customer data.

Point to `SECURITY.md`.

## Close reasons

Use clear close reasons:

| Reason | Message |
|---|---|
| Not enough info | Needs a minimal reproduction or sanitized command output. |
| Better as docs | Useful guidance, but not reliable as an automated rule. |
| Out of scope | Requires cloud services, broad external context, or subjective style judgment. |
| Duplicate | Existing issue already tracks the work. |
| Resolved | Fixed by linked PR or documented workaround. |

## Weekly maintenance loop

Once per week after launch:

- review new false positives;
- pick one rule request to refine;
- update docs for repeated confusion;
- add one real-world example to the gallery or FAQ;
- check whether launch posts caused recurring misconceptions;
- keep the README promise sharp and honest.
