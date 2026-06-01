# PR Comment Workflow

AgentProof can generate a compact Markdown PR comment with:

```bash
npx agentproof --pr-comment agentproof-pr-comment.md
```

By default, AgentProof writes the file but does not post it. This keeps the default GitHub Action permission-light and avoids surprising write access.

If you want AgentProof to publish a sticky PR comment, use:

```text
templates/github-action-pr-comment.yml
```

## Why this is opt-in

Posting PR comments requires:

```yaml
permissions:
  pull-requests: write
```

Many teams prefer a read-only gate plus uploaded artifacts. The comment workflow is useful when reviewers want the decision directly in the PR conversation.

## Template

```yaml
name: AgentProof PR Comment

on:
  pull_request:

permissions:
  contents: read
  security-events: write
  pull-requests: write

jobs:
  proof:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - id: agentproof
        uses: runstudio/agentproof@v1
        with:
          path: .
          profile: strict
          changed: "true"
          base: origin/main
          pr-comment: agentproof-pr-comment.md
          receipt: agentproof-receipt.json
          summary: agentproof-summary.json
      - name: Post AgentProof PR comment
        if: always() && github.event_name == 'pull_request' && github.event.pull_request.head.repo.full_name == github.repository
        uses: marocchino/sticky-pull-request-comment@v2
        with:
          header: agentproof
          path: agentproof-pr-comment.md
```

## Fork safety note

The template only posts comments when the PR branch belongs to the same repository:

```yaml
github.event.pull_request.head.repo.full_name == github.repository
```

This avoids granting comment write behavior to untrusted fork contexts by default.

If your project wants comments on fork PRs, review GitHub's security model carefully before changing this condition.

## What the comment includes

The generated comment includes:

- verdict and score;
- merge decision line;
- severity counts;
- top findings with locations;
- verification commands and package cwd for monorepos;
- artifact paths;
- blocking review note when needed.
