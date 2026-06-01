# AgentProof Policy Packs

Policy packs are starter `agentproof.config.json` templates for common adoption scenarios.

## Available packs

| Pack | Best for | Posture |
|---|---|---|
| `relaxed-prototype.json` | experiments, internal demos, throwaway prototypes | noisy signal, light blocking |
| `standard-pr-gate.json` | normal agent-generated PRs | balanced default |
| `strict-client-delivery.json` | client work, production-bound features | blocks high-risk findings aggressively |
| `mvp-client-delivery.json` | MVPs where code and design must both be client-ready | strict TechnicalGate plus DesignGuard |
| `security-sensitive.json` | auth, billing, payments, secrets, infra | strictest default posture |
| `legacy-adoption.json` | messy existing repos | baseline-first adoption |

## Usage

Copy one pack to the project root:

```bash
cp templates/policies/strict-client-delivery.json agentproof.config.json
```

Then inspect before running checks:

```bash
npx agentproof --doctor
```

## Recommended rollout

1. Start with `agentproof --doctor` to inspect detected commands.
2. If the repo is legacy, create a baseline:

   ```bash
   npx agentproof --update-baseline .agentproof/baseline.json
   ```

3. Pick a policy pack.
4. Run AgentProof locally.
5. Add CI with:

   ```bash
   npx agentproof --init --ci --agent
   ```

## Run Studio recommendation

For client delivery, use `strict-client-delivery.json`.

For MVP delivery where UI quality matters, use `mvp-client-delivery` and configure `design.url` or pass `--design-url`.

For auth, billing, payment, secrets, or infrastructure changes, use `security-sensitive.json`.

For an old repo, use `legacy-adoption.json` first, then tighten budgets after the team pays down known debt.

## CLI usage

List the built-in packs:

```bash
npx agentproof --policy-packs
```

Create a config from a pack:

```bash
npx agentproof --init --policy-pack strict-client-delivery --ci --agent
```

Use `mvp-client-delivery` for MVP/UI delivery, `strict-client-delivery` for client code delivery, `security-sensitive` for auth/billing/secrets, and `legacy-adoption` when introducing AgentProof into a messy existing codebase.

## Schema support

Every generated policy pack includes the AgentProof schema URL for editor autocomplete:

```json
{
  "$schema": "https://raw.githubusercontent.com/runstudio/agentproof/main/schemas/agentproof.config.schema.json"
}
```

The schema documents profiles, thresholds, command proof, DesignGuard, baselines, budgets, severity overrides, suppressions, scanner limits, and slop phrase tuning.
