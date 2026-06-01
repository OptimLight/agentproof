# Security Model

AgentProof is a defensive local scanner for AI-generated code and agent pull requests.

It is designed to help maintainers answer:

```text
Can this AI-generated PR be trusted enough to merge?
```

It is not a replacement for a dedicated secret scanner, SAST platform, dependency scanner, or human security review.

## Trust boundaries

AgentProof reads local project files and may execute local verification commands unless `--no-run-scripts` is used.

Important boundaries:

- Project scripts run with the permissions of the caller.
- AgentProof does not sandbox project commands.
- AgentProof does not send project source to a remote service.
- Reports are local artifacts unless the user uploads them in CI.
- SARIF, receipts, summaries, and PR comments may be published by the user's workflow.

## Redaction

AgentProof redacts common credential-shaped values before writing findings and command output to artifacts.

Current redaction covers:

- AWS access key shaped values;
- GitHub personal access token shaped values;
- Slack token shaped values;
- OpenAI-style `sk-` token shaped values;
- `Bearer ...` headers;
- assignments such as `apiKey = "..."`, `secret = "..."`, `token = "..."`, and `password = "..."`.

Redaction means reports should show:

```text
Matched: apiKey = "[REDACTED]"
```

instead of the full value.

## What to do when a secret is detected

If AgentProof flags a possible secret:

1. Treat it as exposed.
2. Rotate the credential.
3. Remove it from git history where appropriate.
4. Replace the value with an environment variable, vault lookup, or platform secret.
5. Rerun AgentProof.

## Command execution risk

By default, AgentProof runs local proof commands it detects, such as tests, builds, lint, typecheck, `pytest`, `go test`, and `cargo check`.

Use static-only mode when scanning untrusted repositories:

```bash
npx agentproof --path . --no-run-scripts
```

Use doctor mode before enabling CI:

```bash
npx agentproof --doctor
```

## Report handling

Treat generated artifacts as security-sensitive when scanning private repositories:

- `AGENT_PROOF_REPORT.md`
- `agentproof-report.html`
- `agentproof.sarif`
- `agentproof-receipt.json`
- `agentproof-summary.json`
- `agentproof-pr-comment.md`

AgentProof tries to redact obvious sensitive values, but artifacts can still reveal file paths, rule hits, command names, and project structure.
