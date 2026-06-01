# Public Roadmap

AgentProof v0.1.0 is the launch candidate. The roadmap is designed around one question:

> What proof should exist before an AI-generated change is allowed to merge?

## v0.1.0 - Launch candidate

- Local CLI.
- Static checks for security, UI, docs, slop, and hygiene.
- Verification command detection for JS/TS, Python, Go, and Rust.
- First-pass JavaScript workspace detection for common monorepo layouts.
- Custom verification commands.
- Claim audit.
- Markdown, JSON, HTML, SARIF, badge, PR comment, receipt outputs.
- Policy profiles, budgets, suppressions, severity overrides.
- Baseline mode.
- Run history and trend reports.
- Doctor mode.
- Config JSON Schema.
- GitHub Actions scaffold.
- DesignGuard v1 for landing, SaaS, dashboard, marketplace, ecommerce, webapp, and mobile-app checks.
- Separate TechnicalGate and DesignGate reporting.
- Optional AI design reviewer behind `--design-ai`.

## v0.2.0 - Better repo intelligence

- Deeper monorepo package graph awareness.
- Changed-file dependency awareness.
- Configurable command groups.
- Language adapters for Ruby, PHP, Java, Kotlin, Swift.
- Better generated-file detection.

## v0.3.0 - Deeper UI proof

- Richer browser screenshot comparison and artifact review.
- Deeper accessibility tree checks through browser automation.
- Visual state journey runner for loading, empty, error, success, disabled.
- Figma/design-token import and stricter brand identity drift checks.

## v0.4.0 - Agent transcript audit

- Compare agent transcript to repo diff.
- Detect unverified claims in final summaries.
- Identify files the agent says it touched but did not.
- Identify checks the agent says it ran but did not prove.

## v0.5.0 - Team dashboards

- Trend dashboard from history JSONL.
- Agent quality leaderboard by branch/author/agent.
- Risk burndown from baseline.
- Export to static HTML.

## v1.0.0 - Stable policy gate

- Stable config schema.
- Stable receipt schema.
- Stable SARIF mapping.
- Backward compatible rule ids.
- Documented extension API.
