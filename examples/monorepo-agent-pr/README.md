# Monorepo Agent PR

This fixture demonstrates common JavaScript workspace layouts.

The root package declares workspaces. AgentProof should discover package scripts in `apps/web` and `packages/api`, then label findings by package path.

The fixture intentionally includes:

- a web UI with missing `alt` text and placeholder copy;
- an API package with a failing test script;
- an overconfident final agent claim.
