# Summary Output

`--summary` writes a compact JSON artifact for bots, dashboards, and internal automation.

Use `--json` when you want the full AgentProof result. Use `--summary` when another tool only needs the verdict, score, counts, claim metadata, artifacts, and top findings.

## Usage

```bash
npx agentproof --path . --summary agentproof-summary.json
```

With other review artifacts:

```bash
npx agentproof --path . \
  --sarif agentproof.sarif \
  --html agentproof-report.html \
  --pr-comment agentproof-pr-comment.md \
  --receipt agentproof-receipt.json \
  --summary agentproof-summary.json
```

## Shape

```json
{
  "$schema": "https://raw.githubusercontent.com/runstudio/agentproof/main/schemas/agentproof.summary.schema.json",
  "schemaVersion": "agentproof.summary.v1",
  "score": 84,
  "verdict": "SHIP WITH CARE",
  "exitCode": 0,
  "findings": 3,
  "counts": {
    "critical": 0,
    "high": 0,
    "medium": 2,
    "low": 1,
    "info": 0
  },
  "claim": {
    "audited": true,
    "source": ".agentproof/final-claim.md",
    "fromFile": true
  },
  "artifacts": {
    "report": "/absolute/path/AGENT_PROOF_REPORT.md",
    "receipt": "/absolute/path/agentproof-receipt.json",
    "summary": "/absolute/path/agentproof-summary.json"
  },
  "topFindings": [
    {
      "id": "ui.image-missing-alt",
      "category": "ui",
      "severity": "medium",
      "title": "Image missing alt text",
      "file": "src/App.jsx",
      "line": 6
    }
  ]
}
```

## Intended consumers

- PR comment bots that do not need the full report.
- Release dashboards.
- Agent harnesses that need a compact final gate.
- CI routing logic that needs the verdict and score.
- Teams that want to archive a small run summary alongside a full receipt.

## Stability

The summary declares:

```json
{
  "$schema": "https://raw.githubusercontent.com/runstudio/agentproof/main/schemas/agentproof.summary.schema.json",
  "schemaVersion": "agentproof.summary.v1"
}
```

Consumers should check this value before assuming field names.

The schema file is included in the npm package:

```text
schemas/agentproof.summary.schema.json
```
