# Demo video script

Use this script to record a short launch video for GitHub, X, LinkedIn, Reddit, Hacker News comments, or the README.

Target length: 90 to 120 seconds.

Core message:

```text
Your AI coding agent says it is done. AgentProof asks for receipts.
```

## Setup before recording

Open a terminal at the AgentProof repository root.

Use a large readable font.

Clear the terminal.

Keep the browser or editor closed unless you are showing the generated HTML report.

Do not mention unverified release claims. Say "local demo" unless the release has already been validated and published.

## Scene 1: the problem

Narration:

```text
AI coding agents are fast. That is useful, but it creates a weird review problem.

The same agent can produce good code, broken code, risky code, and a very confident "done" message with exactly the same tone.

AgentProof is a local QA gate for that moment.
```

Visual:

Show the social card or README hero if available.

Message on screen:

```text
Agent: "Done. Tests passed. Ready to ship."
AgentProof: "Show the evidence."
```

## Scene 2: show the command menu

Command:

```bash
npm run recipes
```

Narration:

```text
The first thing AgentProof gives you is a command menu.

You can run a static-only scan, a strict PR gate, changed-file mode, a final-claim audit, or a full artifact bundle.
```

Callout:

```text
For published installs, this becomes: npx agentproof --recipes
```

## Scene 3: run the bad agent PR

Command:

```bash
npm run demo:claim
```

Narration:

```text
Here is the bad demo. This fixture is intentionally risky.

The important part is not just that code issues exist. The agent also overclaims what was verified.
```

Pause on the failing result.

Callouts:

```text
DO NOT SHIP
Findings remain
Claim evidence is missing
```

## Scene 4: explain the unique feature

Narration:

```text
This is the part I care about most.

AgentProof does not only inspect files. It audits the final claim.

If an agent says tests passed, but no passing test command was observed, the claim is not accepted as evidence.
```

Show:

```bash
npm run claim-template
```

Narration:

```text
There is also a claim template, so agents can say exactly what was checked, what was not checked, and what still needs human review.
```

## Scene 5: show observe-only adoption

Command:

```bash
npm run demo:observe
```

Narration:

```text
For teams, the adoption path matters.

Observe-only mode keeps the verdict and reports, but exits zero, so you can collect signal before blocking merges.
```

Callout:

```text
Verdict preserved.
CI not blocked.
```

## Scene 6: show GitHub-native signal

Command:

```bash
npm run demo:annotations
```

Narration:

```text
In GitHub Actions, AgentProof can emit native annotations.

That means reviewers see high-signal findings directly in checks, not only inside a separate report artifact.
```

Callout:

```text
Errors for critical/high.
Warnings for medium.
Notices for low.
```

## Scene 7: show the good version

Command:

```bash
npm run demo:good
```

Narration:

```text
Here is the cleaned-up version.

The goal is not to shame agents. The goal is to make agent output reviewable, evidence-based, and safer to merge.
```

## Scene 8: close with install

Narration:

```text
To try it on a repo, start static-only:
```

Command:

```bash
npx agentproof --path . --no-run-scripts
```

Narration:

```text
Then add the full setup:
```

Command:

```bash
npx agentproof --init --all
```

Final line:

```text
AgentProof is the seatbelt for AI-generated pull requests.
```

## 30-second cutdown

Use this shorter script when posting a GIF or quick social clip.

Narration:

```text
Your AI agent says: done, tests passed, ready to ship.

AgentProof asks: where is the evidence?

It checks verification commands, security smells, UI slop, docs readiness, and the agent final claim.

If the claim is not supported by local evidence, AgentProof flags it.

Start with: npx agentproof --recipes
```

Commands:

```bash
npm run demo:claim
npm run claim-template
npm run demo:observe
```

## Recording checklist

- Show the failing verdict clearly.
- Say that the bad fixture intentionally fails.
- Do not claim production readiness unless validation has actually run.
- Show `--claim-template` because it makes the claim audit easy to understand.
- Show observe-only because it removes adoption fear.
- Keep the final CTA to one command: `npx agentproof --recipes`.

## Common mistakes to avoid

- Do not spend the whole demo listing features.
- Do not present AgentProof as replacing tests, review, SAST, or secret scanning.
- Do not hide the fact that local scripts may execute unless `--no-run-scripts` is used.
- Do not overexplain policy packs in the first video.
- Do not use a polished fake project that makes the demo feel staged; the bad fixture should look obviously risky.

