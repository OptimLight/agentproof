# Contributing to AgentProof

AgentProof should stay boring, local, fast, and useful.

## Principles

- Prefer deterministic checks before LLM-dependent checks.
- Never require a cloud service for the default path.
- Every finding needs a severity, a location when possible, and a practical fix.
- False positives are acceptable only when the warning is cheap to understand and easy to suppress later.
- The README promise must stay understandable in under 30 seconds.

## Good first contributions

- New framework-aware UI checks with tiny bad/good examples.
- Better secret detection with false-positive analysis and allowlist ideas.
- SARIF, GitHub annotation, PR comment, and receipt quality improvements.
- New rule catalog entries in `src/rules.js`.
- More examples of agent-generated PR failures.
- Safer claim examples and new overclaim phrases.
- Policy packs for real adoption contexts.
- Rules for Python, Go, Rust, Swift, Kotlin, and PHP project conventions.

## Contribution lanes

AgentProof has four high-value contribution lanes:

| Lane | Good contribution | Start here |
|---|---|---|
| Rules | Detect a real AI-agent failure mode with a practical fix. | `docs/RULE_TRIAGE.md` |
| Demos | Add a small before/after fixture that explains the risk fast. | `docs/BEFORE_AFTER.md` |
| Agent workflows | Improve how agents write claims and expose evidence. | `docs/CLAIM_TEMPLATE.md` |
| CI adoption | Make reports, annotations, artifacts, and rollout safer. | `docs/ADOPTION.md` |

If you are unsure where an idea belongs, open an issue first. The best ideas are usually narrow, local, and easy for a maintainer to review.

## Local development

```bash
npm run demo
npm run self-check
npm run rules
```

`npm run demo` intentionally fails because the fixture is bad. That is the point.

Before adding a rule, read:

```text
docs/RULE_AUTHORING.md
docs/RULE_TRIAGE.md
docs/RULE_GALLERY.md
```

## Release validation

Before a release-minded PR, run the release validation flow:

```bash
npm run validate:release
```

If you are only changing docs, examples, or templates, say what you did and did not run. Do not claim validation passed unless it actually ran.

Useful focused checks:

```bash
npm run recipes
npm run troubleshoot
npm run faq
npm run claim-template
npm run demo:claim
npm run demo:good
npm run demo:observe
npm run demo:annotations
```

## Claim discipline

AgentProof exists because agents and humans often overclaim evidence.

When opening a PR, be precise:

Good:

```text
Updated the claim template docs. I did not run release validation.
```

Bad:

```text
Everything is fully verified and production-ready.
```

Use the built-in template when helpful:

```bash
npm run claim-template
```

## Architecture

Before changing the engine, read:

```text
docs/ARCHITECTURE.md
```

It explains the run pipeline, core modules, finding shape, public contracts, and extension points for rules, verification commands, artifacts, and policy packs.

## Public contracts

Treat these as public API unless a migration note exists:

- CLI flags and exit codes;
- rule ids;
- config, receipt, and summary schemas;
- GitHub Action inputs and outputs;
- generated artifact names;
- policy pack names.

## What we usually decline

- Rules that require a network service in the default path.
- Rules that mostly enforce personal style preferences.
- Broad "AI judge" features that cannot explain their evidence.
- Findings without a practical next step.
- Docs or marketing copy that overclaims security, production readiness, or proof.
