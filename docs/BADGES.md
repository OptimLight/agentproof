# Badges

Suggested README badges after the public repository exists.

```markdown
[![npm version](https://img.shields.io/npm/v/agentproof.svg)](https://www.npmjs.com/package/agentproof)
[![license: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![AgentProof](https://img.shields.io/badge/AgentProof-local%20QA%20gate-111827)](README.md)
[![SARIF](https://img.shields.io/badge/SARIF-ready-blue)](https://docs.github.com/en/code-security/code-scanning/integrating-with-code-scanning/sarif-support-for-code-scanning)
[![AI agents](https://img.shields.io/badge/AI%20agents-proof%20required-ef4444)](README.md)
```

Optional local generated badge:

```bash
agentproof --badge agentproof-badge.svg
```

Then reference:

```markdown
![AgentProof score](agentproof-badge.svg)
```

Do not commit a generated score badge unless it is intentionally part of a demo or docs page.

For the full artifact map, see `docs/ARTIFACTS.md`.
