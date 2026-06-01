# DesignGuard

DesignGuard is AgentProof's UI/product-readiness gate.

It answers a different question from the technical checks:

```text
TechnicalGate: does the project still build, test, and avoid obvious code risk?
DesignGuard: does the interface look shippable for the product type?
```

## Quick start

Run a SaaS design audit against a local app:

```bash
npx agentproof --path . --design saas --design-url http://localhost:3000 --profile strict --fail-under 90
```

Run without blocking while your team tunes the gate:

```bash
npx agentproof --path . --design landing --design-url http://localhost:3000 --observe-only
```

Run static-only when no browser URL is available:

```bash
npx agentproof --path . --design marketplace --profile strict
```

Run a pure design audit while still reading local source:

```bash
npx agentproof --path ./landing-site --design-only --design landing --design-url http://localhost:3000 --profile strict --fail-under 90
```

`--design-only` keeps `--path` important. AgentProof still reads local HTML/CSS/JS for static design rules and file locations, but it excludes TechnicalGate, docs readiness, security checks, verification scripts, and claim audit from the score.

Static-only mode is useful, but weaker. It cannot prove real fold position, overflow, tap target dimensions, clipped text, or computed contrast.

## Product profiles

Supported profiles:

| Profile | Use when |
|---|---|
| `landing` | Campaign pages, service pages, waitlists, launch pages. |
| `saas` | SaaS marketing pages, devtools, app previews, pricing-led products. |
| `dashboard` | Admin tools, analytics, operations screens, control rooms. |
| `marketplace` | Search/filter/listing/detail/contact flows. |
| `ecommerce` | Product, collection, cart, checkout-adjacent UI. |
| `webapp` | Generic authenticated web app screens. |
| `mobile-app` | Mobile-first app screens rendered in web previews or React Native web. |

## What DesignGuard checks

Universal rules:

- no horizontal overflow on mobile or desktop;
- WCAG AA text contrast for normal text;
- mobile tap targets at least 44px;
- one clear H1 and coherent heading hierarchy;
- no clipped content or crushed components;
- primary CTA visible and action-oriented;
- spacing scale is controlled;
- typography is readable and limited;
- color system uses semantic intent where possible.

Contextual rules:

- landing pages need a bounded hero, CTA above the fold, proof, objections/FAQ, and footer;
- SaaS pages need concrete product proof, screenshot/CLI/report/dashboard evidence, trust or developer proof, and a useful CTA;
- dashboards need decisions, metrics, filters, tables/lists, statuses, and UI states;
- marketplaces need search, filters, card decision data, trust, and contact/request actions;
- mobile apps need safe area handling, clear navigation, one primary CTA, and realistic touch spacing.

## Browser proof and screenshots

When `--design-url` is provided, DesignGuard tries to use Playwright to open the page, measure the DOM/CSS, and save screenshots to:

```text
.agentproof/design-screenshots/
```

If Playwright or Chromium is unavailable, AgentProof does not crash. It falls back to static checks and adds a clear finding explaining how to enable stronger browser proof.

## Optional AI reviewer

DesignGuard is local-first. AI is optional:

```bash
OPENAI_API_KEY=... npx agentproof --path . --design saas --design-url http://localhost:3000 --design-ai
```

You can also use the local Codex login without `OPENAI_API_KEY`:

```bash
npx agentproof --path . --design landing --design-url http://localhost:3000 --design-ai --design-ai-provider codex-auth --design-ai-model gpt-5.3-codex-spark
```

AgentProof reads `CODEX_HOME/auth.json` or `~/.codex/auth.json`, discovers the available Codex models from `chatgpt.com/backend-api/codex/models`, and falls back to the local Codex model cache when live discovery is unavailable.

List available Codex auth models:

```bash
npx agentproof --design-ai-provider codex-auth --design-ai-list-models
```

The AI reviewer acts as a severe senior product design reviewer across:

```text
brand fit, originality, product flow, visual hierarchy, typography,
color system, spacing/layout, component quality, mobile realism,
accessibility, content/microcopy, delivery polish
```

By default AI feedback is informational. Set `design.ai.blocking: true` only when your team wants qualitative AI review to affect the gate.

## DesignFix

DesignGuard tells you what is not shippable. DesignFix asks the configured AI provider to rewrite the selected UI files into a better version.

Preview mode:

```bash
npx agentproof design-fix --path ./landing-site --design landing --design-url http://localhost:3000 --design-ai-provider codex-auth --design-ai-model gpt-5.3-codex-spark
```

Apply mode:

```bash
npx agentproof design-fix --path ./landing-site --design landing --design-url http://localhost:3000 --design-ai-provider codex-auth --apply
```

DesignFix writes:

```text
AGENT_PROOF_DESIGN_FIX.md
```

Without `--apply`, source files are not modified. With `--apply`, AgentProof rewrites only the selected UI source files and stores backups in:

```text
.agentproof/design-fix-backups/
```

Use `--design-source index.html,styles.css,script.js` to keep the rewrite focused on one landing page.

## DesignImprove

DesignImprove is the production workflow on top of DesignGuard and DesignFix:

```text
Audit -> improvement brief -> AI rewrite -> re-audit -> final score
```

Run it without applying changes to get the brief and proposed rewrite:

```bash
npx agentproof design-improve --path ./landing-site --design landing --design-url http://localhost:3000 --design-ai-provider codex-auth --target-score 90
```

Apply the rewrite and force a second DesignGuard score:

```bash
npx agentproof design-improve --path ./landing-site --design landing --design-url http://localhost:3000 --design-ai-provider codex-auth --target-score 90 --apply
```

DesignImprove writes:

```text
AGENT_PROOF_DESIGN_IMPROVEMENT.md
```

The report includes the initial score, target score, blocking findings, exact fixes, the full AI prompt, DesignFix report path, and the post-fix score when `--apply` is used.

When you do not have the original project files, use browser-clone mode. AgentProof opens the URL, captures the rendered DOM as standalone HTML, extracts accessible browser CSS, rewrites asset URLs to public absolute URLs, and then asks the AI to improve that faithful copy instead of redesigning from scratch:

```bash
npx agentproof design-fix --path . --from-browser --design landing --design-url https://example.com --clone-output ./cloned-landing --design-ai-provider codex-auth --design-ai-model gpt-5.3-codex-spark
```

Apply the generated clone:

```bash
npx agentproof design-fix --path . --from-browser --design landing --design-url https://example.com --clone-output ./cloned-landing --design-ai-provider codex-auth --apply
```

If the public site changes language based on the browser, pass the locale you want cloned:

```bash
npx agentproof design-fix --path . --from-browser --design landing --design-url https://example.com --design-locale fr-FR --clone-output ./cloned-landing --design-ai-provider codex-auth --apply
```

Browser-clone mode writes `index.html`, `styles.css`, and optionally `script.js` into the clone output directory. It is a faithful rendered-page clone plus targeted design improvements, not a copy of the original source repository.

## Config example

```json
{
  "$schema": "https://raw.githubusercontent.com/runstudio/agentproof/main/schemas/agentproof.config.schema.json",
  "profile": "strict",
  "failUnder": 90,
  "design": {
    "enabled": true,
    "type": "saas",
    "url": "http://localhost:3000",
    "locale": "fr-FR",
    "routes": ["/", "/pricing", "/dashboard"],
    "viewports": ["mobile", "desktop"],
    "strictness": "strict",
    "ai": {
      "enabled": false,
      "blocking": false,
      "provider": "codex-auth",
      "model": "gpt-5.3-codex-spark"
    }
  }
}
```

## Verdicts

When DesignGuard is enabled, AgentProof reports both gates:

```text
Technical Gate: SHIP 94/100
Design Gate: DESIGN REVIEW REQUIRED 68/100
Final Verdict: DESIGN REVIEW REQUIRED
```

The important guarantee:

```text
AgentProof should not say SHIP for a visually unshippable interface when DesignGuard is active.
```
