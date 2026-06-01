# Privacy

AgentProof is designed to run locally.

By default, AgentProof does not send your source code, reports, command output, receipts, summaries, or findings to an external service.

## What AgentProof reads

Depending on the command you run, AgentProof may read:

- source files in the target project;
- package metadata and configuration files;
- `agentproof.config.json`;
- `.agentproof` files such as baselines, history, and final claims;
- Git metadata when `--changed` is used;
- command output from local verification scripts when script execution is enabled.

## What AgentProof writes

AgentProof may write local artifacts such as:

- `AGENT_PROOF_REPORT.md`;
- HTML reports;
- SARIF files;
- PR comment Markdown;
- SVG badges;
- JSON receipts;
- JSON summaries;
- JSONL history;
- baseline files;
- generated config, workflow, and agent instruction templates when `--init` is used.

## Network behavior

AgentProof itself does not require network access for its default CLI behavior.

However, your project scripts may access the network if you allow AgentProof to run them. Use static-only mode when you do not want package scripts to execute:

```bash
npx agentproof --path . --no-run-scripts
```

GitHub Actions workflows may upload artifacts, SARIF, summaries, annotations, or PR comments depending on how you configure the workflow.

## Sensitive artifacts

Treat AgentProof artifacts as potentially sensitive.

Reports and receipts may include:

- file paths;
- rule ids;
- sanitized command output;
- finding details;
- project metadata;
- claim text;
- evidence about which checks did or did not run.

AgentProof includes redaction for common token-shaped values, but redaction is not a substitute for careful artifact handling.

## What not to share publicly

Do not post public issues or screenshots containing:

- real secrets;
- private `.env` values;
- customer data;
- private repository paths if they are sensitive;
- production logs;
- proprietary source code;
- unredacted command output.

Use `SUPPORT.md` for safe bug-report guidance and `SECURITY.md` for sensitive security reports.

## Maintainer posture

AgentProof should remain:

- local-first by default;
- honest about what it reads and writes;
- careful with generated artifacts;
- explicit when workflows upload evidence to GitHub;
- usable in static-only mode for first scans and untrusted projects.

