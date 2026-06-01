# GitHub star launch plan

This is the practical launch plan for turning AgentProof from a useful tool into a visible GitHub project.

The goal is not vague attention. The goal is to make maintainers immediately understand the pain, try the demo, and star the repo because they want this safety layer in their AI-agent workflow.

## Positioning

Use this one-liner everywhere:

```text
AgentProof is a local QA gate for AI-generated pull requests: it checks code, evidence, and the agent's final claim before you merge.
```

Shorter version:

```text
The seatbelt for AI-generated pull requests.
```

## Launch promise

AgentProof should promise one specific emotional outcome:

```text
You no longer have to trust an AI agent's confident final message.
```

Avoid broad claims like:

- "AI-powered code quality platform"
- "Next-generation developer productivity"
- "Enterprise-grade agent orchestration"
- "The only QA tool you need"

Say the sharp thing:

```text
Your coding agent says it ran the tests. AgentProof asks for the receipt.
```

## Pre-launch checklist

Before posting publicly:

- `README.md` shows the problem in the first screen.
- `assets/social-card.svg` is ready for the README, release notes, and social posts.
- `docs/RELEASE_READINESS_MATRIX.md` has no unresolved launch blockers.
- `docs/launch-kit/RELEASE_NOTES_V0_1_0.md` is ready for GitHub Releases and npm copy.
- `docs/launch-kit/LAUNCH_SCORECARD.md` supports a public launch or soft launch decision.
- `docs/FAQ.md` answers the obvious objections before launch comments arrive.
- `SUPPORT.md` and `docs/MAINTAINER_TRIAGE.md` are ready for public issues.
- `.github/labels.yml` and `docs/GITHUB_LABELS.md` are ready for issue triage.
- `CODE_OF_CONDUCT.md` and `GOVERNANCE.md` set expectations for contributors.
- `PRIVACY.md` clearly explains local-first behavior and artifact sensitivity.
- `LIMITATIONS.md` prevents overclaiming what AgentProof proves.
- The first command is copy-pasteable.
- The bad demo produces a memorable failure.
- The good demo shows the safer behavior.
- `npx agentproof --recipes` prints the command menu.
- `docs/GETTING_STARTED.md` explains first use in under 10 minutes.
- The GitHub Action example is visible.
- The claim-audit feature is obvious.
- Screenshots or terminal output are ready for social posts.
- The npm package name, GitHub repo URL, and release tag are aligned.
- The first three issues are prepared for contributors.
- The maintainer response templates are ready.

## Day 0: repository preparation

### Repository description

Use:

```text
Local QA gate for AI-generated PRs: tests, security smells, UI slop, claim audit, receipts, and GitHub Action artifacts.
```

### Suggested GitHub topics

```text
ai-agents
codex
claude-code
cursor
github-actions
code-review
static-analysis
ci
qa
sarif
developer-tools
agentic-coding
anti-slop
```

### Pinned issue ideas

Create three beginner-friendly issues before launch:

- `Good first issue: add a rule example to the gallery`
- `Help wanted: test AgentProof on a real AI-generated PR`
- `Discussion: show your worst AI-agent final claim`

### Release title

Use:

```text
AgentProof v0.1: a receipt checker for AI-generated pull requests
```

### Release notes structure

```markdown
## Why this exists

AI agents can sound equally confident when they are right, wrong, incomplete, or risky. AgentProof adds a local proof gate between "the agent says it is done" and "we merge it".

## Highlights

- Audits tests, lint, typecheck, build, security smells, UI slop, and docs readiness.
- Checks the agent's final claim with `--claim`.
- Generates Markdown, HTML, SARIF, PR comment, badge, receipt, and summary artifacts.
- Ships policy packs, baselines, suppressions, and agent instruction templates.

## Try it

```bash
npx agentproof --recipes
```
```

## Day 1: launch posts

### Main post

```text
I built AgentProof: a local QA gate for AI-generated pull requests.

The problem: coding agents can produce useful code, risky code, broken code, and a confident "done" message with the same tone.

AgentProof checks:
- verification commands
- security smells
- UI slop
- docs readiness
- changed-file PR risk
- the agent's final claim

The twist: if an agent says "tests passed" but no test evidence exists, AgentProof flags the claim.

Try:
npx agentproof --recipes

Repo: https://github.com/runstudio/agentproof
```

### Hacker News style title

```text
Show HN: AgentProof, a local QA gate for AI-generated pull requests
```

### Reddit style title

```text
I made a CLI that checks whether an AI coding agent's final claim is actually supported by evidence
```

### Short social post

```text
Your AI coding agent says:
"Done. Tests passed. Ready to ship."

AgentProof says:
"Show the evidence."

Local CLI. GitHub Action. Claim audit. Receipts.

npx agentproof --recipes
```

Use `assets/social-card.svg` as the post image when the platform supports image uploads.

## Day 2: proof post

Post the before/after demo.

Structure:

- show the bad agent claim;
- show the AgentProof failure;
- show the safer final claim;
- show the good report;
- link to `docs/BEFORE_AFTER.md`.

Message:

```text
The feature I care about most in AgentProof is not another static check.

It is the claim audit.

If the agent says tests passed, build passed, and the work is production-ready, AgentProof looks for evidence from the local run.

No evidence, no claim.
```

## Day 3: maintainer angle

Post to maintainers and tech leads:

```text
If your team is letting AI agents open PRs, the hard part is not generating code.

The hard part is deciding what can be trusted.

AgentProof gives each agent PR a local receipt:
- commands observed
- findings found
- claims supported or unsupported
- artifacts for reviewers and CI

It is not an agent. It is a guardrail around agents.
```

## Day 4: contributor invitation

Invite real-world testing:

```text
Looking for maintainers willing to run AgentProof on real AI-generated PRs.

The most useful feedback:
- false positives
- missing rules
- confusing report wording
- monorepo edge cases
- better default policy packs

If it catches one overconfident AI final message, I want to hear about it.
```

## Day 5: ecosystem post

Connect the project to the wider trend:

```text
The next wave of AI coding tools needs boring infrastructure:

- receipts
- policy gates
- auditable claims
- CI artifacts
- review summaries
- baselines for legacy debt

AgentProof is my attempt at one small piece of that infrastructure.
```

## Day 6: adoption post

Show the team rollout:

```text
The safest way to adopt AgentProof:

1. Start static-only:
   npx agentproof --path . --no-run-scripts

2. Add a standard gate:
   npx agentproof --path . --profile standard --fail-under 80

3. Move risky repos to strict:
   npx agentproof --path . --profile strict --fail-under 85

4. Require final-claim evidence:
   npx agentproof --claim .agentproof/final-claim.md
```

## Day 7: recap post

```text
One week after launching AgentProof, the clearest lesson is this:

Developers do not just want AI agents to code faster.
They want proof that the output is safe enough to review and merge.

That is the lane for AgentProof:
small, local, boring evidence before confident claims.
```

## Demo script

Use this exact flow for a screen recording:

```bash
npm run demo:claim
npm run demo:good
npm run recipes
```

Narration:

```text
Here is the bad agent PR. The agent claims everything is ready.

AgentProof checks the project and the claim. It fails the gate because the evidence does not support the confidence.

Now here is the cleaned-up version. The final claim is scoped to what was actually checked.

The point is not to shame agents. The point is to make their output reviewable.
```

## First 100 stars strategy

The first 100 stars should come from people who feel the pain directly.

Prioritize:

- maintainers using Codex, Claude Code, Cursor, Copilot, or OpenCode;
- solo founders letting agents modify production repos;
- agency teams delivering AI-assisted client work;
- platform engineers building AI PR workflows;
- security-minded developers skeptical of agent overconfidence.

Avoid chasing:

- generic AI hype accounts;
- broad productivity influencers with no developer audience;
- communities that ban project launches;
- posts that oversell the tool as a replacement for tests, review, or SAST.

## What to measure

Track:

- stars;
- demo command runs if available through package downloads;
- issues opened with real PR examples;
- false-positive reports;
- GitHub Action adoption;
- mentions of "claim audit", "receipt", or "seatbelt";
- conversion from README view to `npx agentproof --recipes`.

## What not to do

Do not market AgentProof as magic.

Do not claim it proves software is safe.

Do not attack coding agents. The stronger message is:

```text
Agents are useful. Useful tools still need receipts.
```

Do not hide limitations. A credible launch earns more trust than a loud one.
