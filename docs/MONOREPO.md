# Monorepo Support

AgentProof has first-pass JavaScript monorepo support for common workspace layouts.

It is intentionally simple and explainable:

- detect root `package.json` workspaces;
- support `workspaces` as an array or `{ "packages": [...] }`;
- support simple patterns such as `apps/*` and `packages/*`;
- run `typecheck`, `lint`, `test`, and `build` from each package directory;
- label commands with the package path;
- let claim audit count package-level test/build/lint/typecheck success as evidence.

## Workspace detection

Root `package.json`:

```json
{
  "private": true,
  "workspaces": ["apps/*", "packages/*"]
}
```

AgentProof discovers packages that contain their own `package.json`.

## Explicit package config

Use `packages` when the workspace layout is unusual or when you want to scan only selected packages:

```json
{
  "packages": ["apps/web", "packages/api", "packages/ui"]
}
```

## Demo fixture

Open:

```text
examples/monorepo-agent-pr
```

Run:

```bash
npm run demo:monorepo
```

Expected story:

- AgentProof discovers workspace package scripts.
- Web package scripts are labeled from `apps/web`.
- API package test failure is labeled from `packages/api`.
- Static checks still scan the whole fixture.
- The agent claim is audited against package-level evidence.

## Honest limitations

AgentProof is not yet a full monorepo graph engine.

Current limitations:

- no dependency graph ordering;
- no package-change impact analysis;
- no nested wildcard expansion beyond simple `*` package directories;
- no automatic install/bootstrap step;
- package-manager commands are inferred from root lockfiles.

For complex repos, use explicit custom commands in `agentproof.config.json`:

```json
{
  "commands": [
    {
      "name": "workspace-ci",
      "label": "workspace CI",
      "command": "pnpm turbo test build lint",
      "severity": "critical",
      "language": "javascript"
    }
  ]
}
```
