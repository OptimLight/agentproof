# AgentProof Launch Plan

## One-line pitch

Your AI agent says it is done. AgentProof tells you if it is shippable.

## Launch thesis

GitHub is flooded with tools that make agents faster. The missing layer is trust. AgentProof wins by being the fast local red flag gate between agent output and merge.

The memorable twist: AgentProof audits the agent's final claim. If the agent says tests passed, build passed, and the PR is ready, AgentProof asks for evidence.

## Target communities

- GitHub Trending developers interested in AI agents.
- Claude Code, Codex, Cursor, Copilot, Gemini CLI, OpenCode, and Hermes users.
- Engineering managers reviewing agent-generated PRs.
- Security-minded teams experimenting with autonomous coding.

## First public demo

1. Show the bad fixture.
2. Show `examples/agent-claim.md` claiming everything passed.
3. Run `npm run demo:claim`.
4. Show `DO NOT SHIP` score and claim-audit findings.
5. Show HTML report, SARIF upload, badge, and agent skill contract.

## Post copy

```text
I built AgentProof.

AI agents are fast. That is the problem.

AgentProof is a local QA gate for agent-generated PRs: tests, build, security smells, UI slop, docs drift, policy budgets, suppressions, SARIF, HTML reports, and a brutally simple verdict:

SHIP / SHIP WITH CARE / FIX BEFORE MERGE / DO NOT SHIP

The twist: it can audit the agent's final message too.
If the agent says "tests passed" or "ready to ship", AgentProof asks for proof.

Your agent says it is done. AgentProof tells you if it is shippable.
```

## GitHub topics

`ai-agents`, `codex`, `claude-code`, `cursor`, `github-action`, `code-review`, `qa`, `security`, `anti-slop`, `developer-tools`, `sarif`.

## Release checklist

- README hero is clear in 5 seconds.
- `npx agentproof --help` works.
- Demo fixture produces a strong report.
- Claim audit demo catches the overconfident agent message.
- Strict profile blocks high-risk PRs with documented budgets.
- Policy guide explains profiles, budgets, overrides, and suppressions.
- Rule catalog is printable with `npm run rules`.
- HTML report looks shareable.
- GitHub Action template is copy-pasteable.
- SARIF output uploads in CI.
- Skill file is easy to paste into agent workflows.
- First issue templates are present.

## Baseline launch angle

AgentProof is not only for clean greenfield projects. Baseline mode lets maintainers adopt strict gates on messy repos without blocking on every historical issue.

Demo sequence:

```bash
npm run demo:baseline
npx agentproof --path examples/bad-agent-pr --baseline .agentproof/baseline.json --profile strict --no-run-scripts
```

Message: known debt stays visible, new risk gets blocked.

## Multi-language angle

AgentProof should not look like a narrow JavaScript tool. The v0.1.0 story includes local verification detection for JS/TS, Python, Go, and Rust.

Demo line:

```text
AgentProof runs the proof commands your repo already understands: npm scripts, pytest, go test, go vet, cargo check, and cargo test.
```

This matters for GitHub launch because agent-generated code is not confined to frontend repos.

## Custom command angle

For teams with existing CI conventions, AgentProof supports custom commands in `agentproof.config.json`.

Examples:

```json
{
  "commands": [
    { "name": "repo-ci", "command": "make ci", "severity": "critical" },
    { "name": "turbo-test", "command": "pnpm turbo test", "severity": "critical" },
    { "name": "uv-pytest", "command": "uv run pytest", "severity": "critical" }
  ]
}
```

Message: AgentProof adapts to the proof command your repo already trusts.

## PR comment angle

The CI story should show the compact PR summary, not only the full report. AgentProof can write `agentproof-pr-comment.md` with the verdict, blockers, warnings, commands, baseline, and suppression counts.

Demo command:

```bash
npx agentproof --path . --pr-comment agentproof-pr-comment.md --github-comment
```

Message: reviewers get the decision in the PR, artifacts keep the audit trail.

## Config schema angle

AgentProof includes a JSON Schema for `agentproof.config.json`, so teams get autocomplete and validation in editors.

```json
{
  "$schema": "https://raw.githubusercontent.com/runstudio/agentproof/main/schemas/agentproof.config.schema.json",
  "profile": "strict"
}
```

Message: configuration should be as reviewable as code.

## History angle

AgentProof can track quality over time with JSONL history.

```bash
agentproof --history .agentproof/history.jsonl
agentproof --trend .agentproof/history.jsonl
```

Message: teams can measure whether AI-generated code is improving the repo or slowly adding risk.

## Doctor mode angle

Doctor mode makes adoption safer:

```bash
agentproof --doctor
```

Message: before AgentProof blocks a PR, it can explain exactly what it detected and what it would run.

## One-command setup angle

The adoption story should start with:

```bash
npx agentproof --init --ci
npx agentproof --doctor
```

Message: AgentProof can install the config and GitHub Action without overwriting existing files, then explain what it will do before it blocks anything.

## Explain mode angle

AgentProof is not a black box. Every finding can be explained:

```bash
agentproof --explain security.secret-pattern
```

Message: when AgentProof blocks a PR, it teaches the maintainer what happened and how to fix it.

## Receipt angle

AgentProof can produce a JSON evidence receipt:

```bash
agentproof --receipt agentproof-receipt.json
```

Message: agents should not just say "done" - they should attach a receipt.

## Verify receipt angle

Receipts are not just artifacts. They are actionable:

```bash
agentproof --verify-receipt agentproof-receipt.json
```

Message: downstream jobs and agents can consume the proof without rerunning the scan.

## Agent contract angle

AgentProof can install a contract for coding agents:

```bash
agentproof --init --agent
```

Message: do not rely on every agent remembering your standards. Put the proof workflow in the repo.

## Policy packs angle

AgentProof includes policy packs for common adoption paths:

- relaxed prototype;
- standard PR gate;
- strict client delivery;
- security-sensitive work;
- legacy adoption.

Message: teams should not have to invent a quality policy from scratch.

## Policy pack launch angle

The fastest adoption story is:

```bash
npx agentproof --init --all
```

That gives maintainers a ready-made config, a GitHub Action, an agent contract, and copy-paste agent instruction templates in one command. The launch copy should frame this as "from zero to an AI PR trust gate in 30 seconds."

## GitHub-native launch hook

Lead with the reusable action for maintainers:

```yaml
- uses: runstudio/agentproof@v1
  with:
    profile: strict
    changed: "true"
    fail-under: "85"
```

Then offer the one-command setup for teams that want config, CI, and an agent contract generated locally.

## Before / after launch clip

Use `docs/BEFORE_AFTER.md` as the public demo script.

The strongest clip is not a feature tour. It is a contrast:

```text
Bad agent: claims everything passed, leaves risky code behind.
Good agent: fixes the risk, creates evidence, scopes the final claim.
```

This makes AgentProof feel less like another linter and more like a trust layer for agentic coding.

## Repository profile

Use `docs/launch-kit/REPO_PROFILE.md` when creating the GitHub repository so the name, description, topics, pinned docs, labels, and first discussions all reinforce the same promise.

## Landing page

Use `homepage/index.html` as the GitHub Pages landing. It should mirror the README promise:

```text
Your agent says done. Make it prove it.
```

The page is designed for three launch beats: terminal verdict, before/after demo, and one-command setup.

## Community launch hooks

The repo includes GitHub issue templates for bug reports, rule requests, policy pack requests, and agent workflow integrations. Use these in the first 48 hours to turn launch attention into concrete contributions.

Point contributors to `docs/CONTRIBUTOR_IDEAS.md` when they ask what to build next.

## Agent integration launch hook

Use `docs/AGENT_INTEGRATIONS.md` to pitch AgentProof as more than a CLI:

```text
Drop one instruction file into Codex, Claude Code, Cursor, or Copilot and require proof before final claims.
```

This is a strong distribution angle because every agent ecosystem needs the same trust contract.

The CLI now supports that hook directly:

```bash
npx agentproof --init --agents codex,cursor,claude,copilot
```

## Rule gallery launch hook

Share `docs/RULE_GALLERY.md` when people ask "what does AgentProof actually catch?" It is more persuasive than a full rule catalog because it shows bad code, the finding, and the safer version side by side.

## Monorepo angle

AgentProof now has first-pass JavaScript monorepo support through root `workspaces` and explicit config:

```json
{
  "packages": ["apps/web", "packages/api"]
}
```

Use this carefully in launch copy: "works with common JS workspace layouts" is accurate; "full monorepo graph engine" is not the claim yet.

The demo fixture is:

```text
examples/monorepo-agent-pr
```

Command:

```bash
npm run demo:monorepo
```

## Maintainer operations

Use `docs/MAINTAINER_PLAYBOOK.md` during the first 48 hours after launch. It defines triage priority, labels, response templates, merge policy, and positioning guardrails.

Use `docs/launch-kit/MAINTAINER_RESPONSES.md` for short public replies on Hacker News, Reddit, GitHub issues, and social posts.

Use `docs/POSITIONING.md` when answering comparison questions. The safe stance is: AgentProof complements CodeQL, Semgrep, Gitleaks, linters, tests, and CI instead of replacing them.

## Adoption rollout

Use `docs/ADOPTION.md` when teams ask how to introduce AgentProof without breaking every legacy PR on day one.

The clean story is:

```text
Phase 1: observe only
Phase 2: baseline and PR gate
Phase 3: strict agent contract
```

Templates live in:

```text
templates/adoption/
```

## PR comment workflow angle

The default workflow stays permission-light. For teams that want a visible PR bot comment, point them to:

```text
templates/github-action-pr-comment.yml
```

This lets reviewers see AgentProof's verdict directly in the PR conversation while keeping write permissions opt-in.

## CLI reference

Use `docs/CLI_REFERENCE.md` as the canonical command reference. Keep README examples short and link to the reference instead of turning the README into a full manual.
