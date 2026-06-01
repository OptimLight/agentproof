# Verification Detection

AgentProof tries to run the project's existing local proof commands before trusting an agent-generated change.

## Supported stacks

| Stack | Detection | Commands |
|---|---|---|
| JavaScript / TypeScript | `package.json` | `typecheck`, `lint`, `test`, `build` scripts |
| Python | `pyproject.toml`, `setup.py`, `setup.cfg`, `requirements.txt`, `pytest.ini` | `python -m pytest`, `python -m compileall .` |
| Go | `go.mod` | `go test ./...`, `go vet ./...` |
| Rust | `Cargo.toml` | `cargo check --all-targets`, `cargo test --all` |

## Design principles

- Prefer commands developers already understand.
- Stay local by default.
- Treat failed tests, builds, checks, and compile passes as blockers.
- Keep command output short enough for PR comments.
- Redact common token and credential-shaped values before writing command output to artifacts.
- Do not require cloud accounts, API keys, or remote scanners.

## Scanning untrusted repositories

AgentProof does not sandbox project scripts. If the repository is untrusted, start with static-only mode:

```bash
agentproof --path . --no-run-scripts
```

Then use doctor mode to inspect what would run before enabling command execution:

```bash
agentproof --doctor
```

## Current limitations

- Python dependency installation is not automatic.
- Rust workspaces with custom features may need explicit scripts in a future release.
- Monorepo package discovery supports root workspaces and simple `packages/*`-style patterns. Complex package graphs may need explicit `packages` or custom commands.

## Roadmap

- Configurable command lists.
- Monorepo package graph detection.
- Swift, Kotlin, PHP, Ruby, and Java checks.
- Dockerized command execution.
- Per-command severity overrides.

## Custom commands

Use `commands` in `agentproof.config.json` when your repo already has a better proof command than the built-in detectors.

```json
{
  "commands": [
    {
      "name": "repo-ci",
      "label": "repository CI",
      "command": "make ci",
      "severity": "critical",
      "language": "custom",
      "optional": false
    },
    {
      "name": "turbo-test",
      "command": "pnpm turbo test",
      "severity": "critical",
      "language": "javascript"
    },
    {
      "name": "uv-pytest",
      "command": "uv run pytest",
      "severity": "critical",
      "language": "python"
    }
  ]
}
```

Fields:

- `name`: stable id fragment used in findings, for example `verification.repo-ci.failed`.
- `label`: human-readable name in reports.
- `command`: shell command run from the project root.
- `severity`: `critical`, `high`, `medium`, `low`, or `info`.
- `language`: optional metadata for reports.
- `optional`: when `true`, a failure is reported as informational instead of blocking.

Custom commands run before auto-detected commands.

## Monorepos

AgentProof detects JavaScript workspaces from root `package.json` when `workspaces` is an array or an object with `packages`.

Supported patterns are intentionally simple:

```json
{
  "workspaces": ["apps/*", "packages/*"]
}
```

You can also configure package paths directly:

```json
{
  "packages": ["apps/web", "packages/api", "packages/ui"]
}
```

For each package with `typecheck`, `lint`, `test`, or `build`, AgentProof runs the script from that package directory and labels the command with the package path.

## Inspect without running

Use doctor mode to see which commands AgentProof would run without executing them:

```bash
agentproof --doctor
```
