# Support

AgentProof is an open-source local QA gate for AI-generated pull requests.

This support guide helps users report useful issues without leaking private code, secrets, or production evidence.

## Before opening an issue

Try these commands first:

```bash
npx agentproof --faq
npx agentproof --troubleshoot
npx agentproof --recipes
```

If the issue involves the agent's final claim, generate a template and compare it with your claim:

```bash
npx agentproof --claim-template
```

## What to include

Include:

- AgentProof version;
- command used;
- operating system and Node version;
- whether `--no-run-scripts` was used;
- whether `--observe-only` was used;
- sanitized top findings;
- relevant config without secrets;
- minimal reproduction when possible.

## What not to include

Never include:

- real API keys, tokens, passwords, or `.env` values;
- private customer code;
- production logs;
- unredacted command output;
- private repository URLs if you do not have permission to share them;
- screenshots that expose internal data.

## Bug reports

Open a bug report when:

- AgentProof crashes;
- a documented CLI flag behaves differently from the docs;
- a generated artifact is malformed;
- a receipt or summary cannot be parsed;
- a GitHub Action output is missing or wrong;
- a finding is clearly incorrect and cannot be reasonably suppressed.

Good bug report shape:

```text
Command:
npx agentproof --path . --no-run-scripts

Expected:
The scan should finish and write AGENT_PROOF_REPORT.md.

Actual:
The CLI exits with usage error.

Minimal reproduction:
...
```

## Rule requests

Open a rule request when AgentProof should catch a repeatable AI-agent failure mode.

Strong rule requests include:

- proposed rule id;
- smallest bad example;
- safer good example if possible;
- why it matters in AI-agent PR review;
- expected finding and suggestion;
- likely false positives;
- whether it can be detected locally.

Read:

```text
docs/RULE_TRIAGE.md
docs/RULE_GALLERY.md
```

## Security reports

Do not open public issues for vulnerabilities involving sensitive data, token exposure, command execution, supply chain risk, or artifact leakage.

Use the security reporting path described in:

```text
SECURITY.md
```

## Maintainer expectation

AgentProof aims to stay:

- local-first;
- deterministic where possible;
- useful in real PR review;
- honest about what it proves;
- careful with secrets and artifacts;
- boring enough to trust.

Support responses should preserve that posture.

