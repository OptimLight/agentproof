# AgentProof Rule Gallery

A quick gallery of the kinds of agent-generated mistakes AgentProof is built to catch.

Use the full catalog when you need exhaustive details:

```bash
npx agentproof --rules markdown
npx agentproof --explain security.secret-pattern
```

## 1. Token-shaped secret

Bad:

```js
const apiKey = "sk-this_is_a_fake_but_token_shaped_value_for_demo";
```

AgentProof finding:

```text
security.secret-pattern - Possible secret or API token committed
```

Reports describe the secret shape without printing the full value.

Better:

```js
const apiKey = process.env.OPENAI_API_KEY;
```

Why it matters: agents often paste convincing config directly into source while prototyping.

## 2. Hardcoded credential-like value

Bad:

```js
const config = {
  password: "admin123",
  token: "temporary-local-token"
};
```

AgentProof finding:

```text
security.hardcoded-credential - Hardcoded credential-like value
```

Reports redact the credential value before writing artifacts.

Better:

```js
const config = {
  password: process.env.ADMIN_PASSWORD,
  token: process.env.SERVICE_TOKEN
};
```

Why it matters: a fake-looking credential can become a real operational habit fast.

## 3. Unsafe HTML injection

Bad:

```jsx
<section dangerouslySetInnerHTML={{ __html: window.location.hash }} />
```

AgentProof finding:

```text
security.unsafe-html - Unsafe HTML injection surface
```

Better:

```jsx
<section>{safeMessage}</section>
```

Why it matters: generated UI often copies unsafe rendering snippets without the sanitizer that made them safe elsewhere.

## 4. Placeholder product copy

Bad:

```md
Coming soon. This premium experience will revolutionize the way teams work.
```

AgentProof finding:

```text
slop.generic-copy - Generic or unfinished AI copy
```

Better:

```md
AgentProof blocks AI-generated pull requests when tests fail, secrets appear, or the final claim overstates the evidence.
```

Why it matters: vague copy is a reliable sign the agent stopped before product quality.

## 5. Missing image alt text

Bad:

```jsx
<img src="/hero.png" />
```

AgentProof finding:

```text
ui.image-missing-alt - Image missing alt text
```

Better:

```jsx
<img src="/hero.png" alt="AgentProof report showing an AI pull request risk score" />
```

Why it matters: accessibility misses are common in rushed generated UI.

## 6. Empty button

Bad:

```jsx
<button></button>
```

AgentProof finding:

```text
ui.empty-button - Button has no accessible label
```

Better:

```jsx
<button type="button">Generate proof receipt</button>
```

Why it matters: empty or icon-only controls without accessible names are invisible to many users.

## 7. Dead placeholder link

Bad:

```jsx
<a href="#">Learn more</a>
```

AgentProof finding:

```text
ui.dead-link - Placeholder link href="#"
```

Better:

```jsx
<a href="/docs">Read the docs</a>
```

Why it matters: dead links are a classic sign of unfinished agent output.

## 8. Agent overclaims tests

Bad final claim:

```text
Tests passed, build passed, lint is clean, and this is ready to ship.
```

AgentProof finding:

```text
claims.unproven-tests - Agent claimed tests passed without local proof
```

Better final claim:

```text
Changed:
- Removed unsafe HTML injection.
- Added alt text to the hero image.

Evidence:
- AgentProof static scan generated a receipt.

Scope:
- No automated test result is reported for this pass.
```

Why it matters: the final answer is part of the artifact. It should be as reviewable as the code.

## 9. Completion claim conflicts with findings

Bad final claim:

```text
Done. Ready to ship.
```

When high or critical findings remain, AgentProof flags:

```text
claims.done-conflicts-with-findings - Agent claimed completion despite blocking findings
```

Better final claim:

```text
AgentProof reported high-severity findings. I am not presenting this as complete until those are fixed or accepted by the maintainer.
```

Why it matters: confidence should not bury blockers.

## 10. Policy budget exceeded

Config:

```json
{
  "budgets": {
    "critical": 0,
    "high": 0,
    "medium": 6
  }
}
```

If active findings exceed the budget, AgentProof flags:

```text
policy.high-budget-exceeded - High finding budget exceeded
```

Why it matters: a pile of warnings should become an explicit team decision, not ambient noise.

## 11. Hero too tall

Bad:

```css
.hero {
  min-height: 112vh;
}
```

AgentProof finding:

```text
design.hero.too-tall - Hero section is too tall
```

Better:

```css
.hero {
  min-height: 78vh;
  display: grid;
  align-items: center;
}
```

Why it matters: giant AI heroes can hide the CTA and proof while looking superficially polished.

## 12. Design CTA below quality bar

Bad:

```html
<a href="/features">Learn more</a>
```

AgentProof finding:

```text
design.cta.missing-primary - No strong primary CTA detected
```

Better:

```html
<a href="/audit">Run audit</a>
```

Why it matters: MVPs need a first useful action, not vague browsing.

## 13. Marketplace without search or filters

Bad:

```html
<section class="cards">...</section>
```

AgentProof finding:

```text
design.marketplace.missing-search-filter - Marketplace lacks search or filters
```

Better:

```html
<form role="search">
  <input placeholder="Search parts, brand, model">
  <button>Filter results</button>
</form>
```

Why it matters: a marketplace without search/filter is just a brochure.

## Demo fixture map

| Rule theme | Fixture |
|---|---|
| Bad agent claim | `examples/agent-claim.md` |
| Risky generated code | `examples/bad-agent-pr/src/App.jsx` |
| Cleaned-up generated code | `examples/good-agent-pr/src/App.jsx` |
| Safer final claim | `examples/good-agent-claim.md` |
| Bad SaaS design | `examples/design-bad-saas/index.html` |
| Good SaaS design | `examples/design-good-saas/index.html` |
| Bad marketplace design | `examples/design-bad-marketplace/index.html` |
| Good dashboard design | `examples/design-good-dashboard/index.html` |

## Add a rule

A good new rule catches a real agent failure mode with clear evidence and low surprise.

Start here:

```text
.github/ISSUE_TEMPLATE/rule_request.yml
```

Then follow:

```text
docs/RULE_AUTHORING.md
```
