# Security Policy

AgentProof is a defensive local scanner. Please report security issues privately before public disclosure.

## Supported versions

The current development branch is supported until the first public release. After v1.0.0, supported versions will be listed here.

## Reporting

Open a private security advisory on GitHub if available, or contact the maintainers through the repository profile.

Please include:

- Impact summary.
- Reproduction steps.
- Affected files or commands.
- Whether secrets, credentials, or user data are involved.

## Scope

In scope:

- Command injection in AgentProof itself.
- Unsafe parsing of local files.
- SARIF/report generation vulnerabilities.
- Incorrect handling of potentially sensitive findings.
- Cases where AgentProof reports, receipts, summaries, or command output expose secrets that should have been redacted.

Out of scope:

- Findings produced by third-party project scripts that AgentProof executes.
- Vulnerabilities in scanned projects themselves, unless AgentProof creates or worsens the exposure.

## Sensitive output handling

AgentProof should identify credential-shaped values without copying the full value into reports. Findings and captured command output are redacted for common token patterns and credential assignments before they are written to Markdown, HTML, receipts, summaries, SARIF, PR comments, or console output.

Redaction is a safety layer, not a guarantee. If AgentProof reports a possible secret, rotate it and remove it from repository history.
