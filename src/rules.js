export const RULES = [
  {
    id: 'security.secret-pattern',
    category: 'security',
    defaultSeverity: 'critical',
    title: 'Possible secret or API token committed',
    detects: ['AWS-style keys', 'GitHub tokens', 'Slack tokens', 'OpenAI-style keys'],
    why: 'Committed credentials can become an immediate account or infrastructure compromise.',
    fix: 'Rotate the credential, remove it from history, and load it from environment variables or a secret manager.',
    falsePositive: 'Demo fixtures and intentionally fake token-shaped strings. Prefer test fixtures with obvious non-token formats.'
  },
  {
    id: 'security.env-committed',
    category: 'security',
    defaultSeverity: 'high',
    title: 'Environment file appears to be committed',
    detects: ['.env files that are not .env.example'],
    why: 'Environment files frequently contain secrets, production endpoints, and local credentials.',
    fix: 'Commit .env.example only and load real values from deployment secrets.',
    falsePositive: 'Non-secret local fixture env files. If kept, document the suppression and expiration.'
  },
  {
    id: 'security.hardcoded-credential',
    category: 'security',
    defaultSeverity: 'high',
    title: 'Hardcoded credential-like value',
    detects: ['apiKey literals', 'secret literals', 'token literals', 'password literals'],
    why: 'Agents often paste configuration directly into code while prototyping.',
    fix: 'Move the value to environment variables, a vault, or platform secrets.',
    falsePositive: 'Clearly fake examples in docs. Prefer placeholders like EXAMPLE_API_KEY.'
  },
  {
    id: 'security.dynamic-code-execution',
    category: 'security',
    defaultSeverity: 'high',
    title: 'Dynamic code execution detected',
    detects: ['eval()', 'new Function()'],
    why: 'Dynamic code execution can turn untrusted input into remote code execution.',
    fix: 'Use a parser, allowlist, command map, or safer expression evaluator.',
    falsePositive: 'Compiler tooling and trusted sandbox internals. Keep suppressions narrow.'
  },
  {
    id: 'security.unsafe-html',
    category: 'security',
    defaultSeverity: 'medium',
    title: 'Unsafe HTML injection surface',
    detects: ['dangerouslySetInnerHTML', 'innerHTML assignment'],
    why: 'Unsafe HTML rendering can produce cross-site scripting when content is not sanitized.',
    fix: 'Sanitize content and prefer safe rendering primitives.',
    falsePositive: 'Sanitized markdown/render pipelines. Add comments near the sanitizer and suppress narrowly if needed.'
  },
  {
    id: 'verification.test.failed',
    category: 'verification',
    defaultSeverity: 'critical',
    title: 'Test command failed',
    detects: ['non-zero package test script'],
    why: 'A failing test suite contradicts most agent claims of completion.',
    fix: 'Run the failing command locally and fix the underlying behavior.',
    falsePositive: 'Flaky external dependency. Quarantine flaky tests rather than suppressing blindly.'
  },
  {
    id: 'verification.build.failed',
    category: 'verification',
    defaultSeverity: 'critical',
    title: 'Build command failed',
    detects: ['non-zero package build script'],
    why: 'A project that does not build is not shippable.',
    fix: 'Fix compilation, bundling, environment, or missing dependency issues.',
    falsePositive: 'Build scripts requiring production-only secrets. Provide safe CI defaults instead.'
  },
  {
    id: 'verification.lint.failed',
    category: 'verification',
    defaultSeverity: 'high',
    title: 'Lint command failed',
    detects: ['non-zero package lint script'],
    why: 'Lint failures often catch obvious agent-generated mistakes before review.',
    fix: 'Run lint locally and fix or intentionally configure the rule.',
    falsePositive: 'Generated files. Ignore generated paths in the linter or AgentProof config.'
  },
  {
    id: 'verification.typecheck.failed',
    category: 'verification',
    defaultSeverity: 'high',
    title: 'Typecheck command failed',
    detects: ['non-zero package typecheck script'],
    why: 'Type failures are common in AI-generated code and often reveal broken contracts.',
    fix: 'Fix types, generated declarations, or dependency versions.',
    falsePositive: 'Legacy repos with known type debt. Use budgets while paying down the debt.'
  },
  {
    id: 'verification.no-standard-scripts',
    category: 'verification',
    defaultSeverity: 'medium',
    title: 'No standard verification scripts found',
    detects: ['missing typecheck, lint, test, and build scripts'],
    why: 'Agent-generated changes need at least one repeatable gate.',
    fix: 'Add a fast test, build, lint, or typecheck command.',
    falsePositive: 'Non-JavaScript projects before language-specific command detection lands.'
  },
  {
    id: 'slop.generic-copy',
    category: 'slop',
    defaultSeverity: 'low-to-medium',
    title: 'Generic or unfinished AI copy',
    detects: ['lorem ipsum', 'coming soon', 'premium experience', 'TODO', 'FIXME', 'fake names'],
    why: 'Template copy is one of the fastest signals that an agent stopped before product quality.',
    fix: 'Replace with specific user-facing copy, real proof, or a tracked follow-up.',
    falsePositive: 'Internal drafts, examples, and test fixtures. Suppress by file path with a reason.'
  },
  {
    id: 'ui.image-missing-alt',
    category: 'ui',
    defaultSeverity: 'medium',
    title: 'Image missing alt text',
    detects: ['img tags without alt'],
    why: 'Missing alt text harms accessibility and is common in rushed generated UI.',
    fix: 'Add descriptive alt text or alt="" for decorative images.',
    falsePositive: 'Framework image components that inject alt elsewhere are uncommon. Prefer explicit alt.'
  },
  {
    id: 'ui.empty-button',
    category: 'ui',
    defaultSeverity: 'medium',
    title: 'Button has no accessible label',
    detects: ['empty button elements'],
    why: 'Icon-only or empty buttons without labels are unusable for assistive tech.',
    fix: 'Add visible text or aria-label.',
    falsePositive: 'Buttons populated by slots at runtime. Prefer explicit accessible names.'
  },
  {
    id: 'ui.dead-link',
    category: 'ui',
    defaultSeverity: 'low',
    title: 'Placeholder link href="#"',
    detects: ['anchor tags pointing to #'],
    why: 'Dead links are classic unfinished agent output.',
    fix: 'Use a real URL, route, button, or remove the link until it works.',
    falsePositive: 'In-page anchors during early docs authoring. Use a real anchor id when possible.'
  },
  {
    id: 'design.layout.horizontal-overflow',
    category: 'design',
    defaultSeverity: 'critical',
    title: 'Rendered UI has horizontal overflow',
    detects: ['document width wider than viewport', 'static CSS widths above 100vw'],
    why: 'Horizontal overflow breaks mobile usability and is a hard production blocker for client-facing MVPs.',
    fix: 'Find the overflowing container, remove fixed oversized widths, use max-width: 100%, and retest mobile.',
    falsePositive: 'Intentional canvas or carousel overflow with clipped container. Prefer explicit containment and narrow suppressions.'
  },
  {
    id: 'design.hero.too-tall',
    category: 'design',
    defaultSeverity: 'high',
    title: 'Hero section is too tall',
    detects: ['hero height above 85vh on desktop', 'hero CSS min-height/height near or above 90vh'],
    why: 'Oversized AI-generated heroes can look dramatic while hiding the product action and proof.',
    fix: 'Reduce hero padding/visual height, keep the H1 and primary CTA above the fold, and move secondary visuals lower.',
    falsePositive: 'Editorial or immersive brand pages. Do not suppress for SaaS, marketplace, dashboard, or MVP delivery pages without owner approval.'
  },
  {
    id: 'design.cta.missing-primary',
    category: 'design',
    defaultSeverity: 'high',
    title: 'No strong primary CTA detected',
    detects: ['no visible action-oriented button or link', 'weak CTA-only pages such as Learn more'],
    why: 'A production MVP needs one obvious first useful action per screen.',
    fix: 'Add one primary CTA with a concrete verb such as Run audit, Start scan, Create project, Request quote, or Contact seller.',
    falsePositive: 'Read-only documentation pages. Configure the product type accurately before suppressing.'
  },
  {
    id: 'design.cta.below-fold',
    category: 'design',
    defaultSeverity: 'high',
    title: 'Primary CTA is below the first fold',
    detects: ['first useful CTA starts below viewport height in browser audit'],
    why: 'Users should not need to scroll before understanding how to act.',
    fix: 'Move the primary CTA into the hero or first visible product panel.',
    falsePositive: 'Long-form editorial pages with no conversion goal. Not acceptable for MVP landing, SaaS, marketplace, or app screens.'
  },
  {
    id: 'design.color.low-contrast',
    category: 'design',
    defaultSeverity: 'high',
    title: 'Text contrast is below WCAG AA',
    detects: ['computed or static text/background contrast below 4.5:1'],
    why: 'Unreadable contrast is both an accessibility failure and a visible quality failure.',
    fix: 'Adjust text and surface tokens so body text reaches at least 4.5:1 contrast.',
    falsePositive: 'Large decorative text may use lower thresholds, but body copy and controls should not.'
  },
  {
    id: 'design.typography.too-many-fonts',
    category: 'design',
    defaultSeverity: 'medium',
    title: 'Too many font families detected',
    detects: ['more than three primary font families in source or rendered UI'],
    why: 'Font sprawl makes generated UI feel stitched together instead of designed.',
    fix: 'Use one display family and one text/mono family maximum unless the brand system says otherwise.',
    falsePositive: 'Rich editorial identities with documented type rules.'
  },
  {
    id: 'design.spacing.inconsistent-scale',
    category: 'design',
    defaultSeverity: 'medium',
    title: 'Spacing scale looks inconsistent',
    detects: ['many unrelated spacing values without tokens'],
    why: 'Random margins and gaps are a reliable signal of AI UI slop.',
    fix: 'Define and reuse a compact spacing scale such as 4, 8, 12, 16, 24, 32, 48, and 64.',
    falsePositive: 'Legacy CSS before token migration. Use a baseline while paying it down.'
  },
  {
    id: 'design.color.missing-semantic-tokens',
    category: 'design',
    defaultSeverity: 'low',
    title: 'No semantic color tokens detected',
    detects: ['missing primary/background/surface/text/muted semantic CSS variables'],
    why: 'A repeatable MVP design system needs named color intent, not one-off values.',
    fix: 'Introduce semantic tokens for primary, background, surface, text, muted, border, success, warning, and danger.',
    falsePositive: 'Projects using framework tokens not visible in scanned files. Document the token source.'
  },
  {
    id: 'design.structure.missing-proof',
    category: 'design',
    defaultSeverity: 'medium',
    title: 'No proof or trust signal detected',
    detects: ['landing/SaaS pages without testimonial, customer, security, GitHub, result, or review signals'],
    why: 'MVP buyers and developers need trust evidence before they act.',
    fix: 'Add credible proof: demo output, GitHub stars, security note, case study, metric, screenshot, or real customer quote.',
    falsePositive: 'Internal app screens where proof is not part of the job.'
  },
  {
    id: 'design.dashboard.marketing-layout',
    category: 'design',
    defaultSeverity: 'high',
    title: 'Dashboard looks like a marketing page',
    detects: ['dashboard profile without tables, filters, metrics, charts, statuses, or activity density'],
    why: 'Dashboards are decision tools, not hero-led landing pages.',
    fix: 'Replace marketing hero structure with a decision-first layout: metrics, filters, table/list, statuses, recent activity, and actions.',
    falsePositive: 'Dashboard marketing pages should use the saas or landing profile instead.'
  },
  {
    id: 'design.marketplace.missing-search-filter',
    category: 'design',
    defaultSeverity: 'high',
    title: 'Marketplace lacks search or filters',
    detects: ['marketplace profile without search/filter affordances'],
    why: 'A marketplace without search/filter cannot scale beyond a brochure.',
    fix: 'Add prominent search and filters before the listing grid.',
    falsePositive: 'Single-product catalogs should use ecommerce or landing instead.'
  },
  {
    id: 'claims.unproven-tests',
    category: 'claims',
    defaultSeverity: 'high',
    title: 'Agent claimed tests passed without local proof',
    detects: ['final message says tests passed but no passing test command was observed'],
    why: 'Trust collapses when agent summaries overstate verification.',
    fix: 'Run the test command or rewrite the final answer to match the evidence.',
    falsePositive: 'Tests were run outside AgentProof. Include command output or rerun through AgentProof.'
  },
  {
    id: 'claims.done-conflicts-with-findings',
    category: 'claims',
    defaultSeverity: 'high',
    title: 'Agent claimed completion despite blocking findings',
    detects: ['done/ready/ship language while high or critical findings exist'],
    why: 'A confident final message should not mask known blockers.',
    fix: 'Fix blockers or explicitly state the remaining risks.',
    falsePositive: 'Maintainer intentionally accepts the risk. Document that acceptance.'
  },
  {
    id: 'policy.high-budget-exceeded',
    category: 'policy',
    defaultSeverity: 'high',
    title: 'High finding budget exceeded',
    detects: ['active findings exceed configured high budget'],
    why: 'Budgets convert a pile of warnings into an explicit team decision.',
    fix: 'Fix findings, adjust budget intentionally, or suppress with reasons and expiry.',
    falsePositive: 'Policy is stricter than current repo maturity. Use relaxed/standard while migrating.'
  },
  {
    id: 'verification.python-test.failed',
    category: 'verification',
    defaultSeverity: 'critical',
    title: 'Python tests failed',
    detects: ['non-zero python -m pytest'],
    why: 'Failing tests mean the agent-generated change is not proven safe.',
    fix: 'Run python -m pytest locally and fix the failing behavior.',
    falsePositive: 'Missing test dependencies in CI. Install dependencies before running AgentProof.'
  },
  {
    id: 'verification.go-test.failed',
    category: 'verification',
    defaultSeverity: 'critical',
    title: 'Go tests failed',
    detects: ['non-zero go test ./...'],
    why: 'Go projects have a standard fast test command that should pass before merge.',
    fix: 'Run go test ./... locally and fix compile or test failures.',
    falsePositive: 'Integration tests requiring external services. Split fast unit tests from external checks.'
  },
  {
    id: 'verification.cargo-check.failed',
    category: 'verification',
    defaultSeverity: 'critical',
    title: 'Rust check failed',
    detects: ['non-zero cargo check --all-targets'],
    why: 'Rust code that does not check is not shippable.',
    fix: 'Run cargo check --all-targets locally and fix compile errors.',
    falsePositive: 'Workspace features requiring special flags. Add custom scripts once command maps land.'
  }
];

export function renderRulesMarkdown() {
  const lines = ['# AgentProof Rules', ''];
  lines.push('This catalog explains what AgentProof currently detects, why each rule exists, and how to handle false positives.');
  lines.push('');

  for (const rule of RULES) {
    lines.push(`## ${rule.id}`);
    lines.push('');
    lines.push(`- Category: ${rule.category}`);
    lines.push(`- Default severity: ${rule.defaultSeverity}`);
    lines.push(`- Title: ${rule.title}`);
    lines.push(`- Detects: ${rule.detects.join(', ')}`);
    lines.push(`- Why it matters: ${rule.why}`);
    lines.push(`- Fix: ${rule.fix}`);
    lines.push(`- False positives: ${rule.falsePositive}`);
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

export function renderRuleExplanation(ruleId) {
  const rule = RULES.find((item) => item.id === ruleId);
  if (!rule) {
    const suggestions = RULES
      .filter((item) => item.id.includes(ruleId) || item.category === ruleId)
      .slice(0, 8)
      .map((item) => `- ${item.id}`)
      .join('\n');

    return [
      `Rule not found: ${ruleId}`,
      '',
      suggestions ? `Closest matches:\n${suggestions}` : 'Run `agentproof --rules markdown` to list available rules.',
      ''
    ].join('\n');
  }

  return [
    `# ${rule.id}`,
    '',
    `Title: **${rule.title}**`,
    `Category: **${rule.category}**`,
    `Default severity: **${rule.defaultSeverity}**`,
    '',
    '## Detects',
    '',
    ...rule.detects.map((item) => `- ${item}`),
    '',
    '## Why it matters',
    '',
    rule.why,
    '',
    '## Fix',
    '',
    rule.fix,
    '',
    '## False positives',
    '',
    rule.falsePositive,
    '',
    '## Suppression example',
    '',
    '```json',
    JSON.stringify({
      suppressions: [
        {
          id: rule.id,
          file: 'path/to/file.ext',
          reason: 'Explain why this is safe here.',
          expires: '2026-12-31'
        }
      ]
    }, null, 2),
    '```',
    ''
  ].join('\n');
}
