import path from 'node:path';

const UI_EXTENSIONS = new Set(['.html', '.jsx', '.tsx', '.vue', '.svelte', '.mdx', '.css', '.scss']);
const CTA_PATTERN = /\b(start|try|run|scan|audit|create|book|get|buy|contact|request|publish|compare|download|install|signup|sign up|join|launch|commencer|essayer|lancer|auditer|créer|creer|réserver|reserver|obtenir|acheter|vendre|contacter|demander|publier|comparer|télécharger|telecharger|installer|rejoindre)\b/i;
const WEAK_CTA_PATTERN = /\b(learn more|read more|discover|explore|en savoir plus|lire plus|découvrir|decouvrir|explorer)\b/i;
const GENERIC_COPY = [
  'revolutionize the way',
  'seamless experience',
  'premium experience',
  'your trusted partner',
  'unlock your potential',
  'game changer',
  'trusted by thousands',
  'lorem ipsum',
  'coming soon'
];

export function runStaticDesignAudit(root, textFiles, designConfig, browserAudit = {}) {
  const issues = [];
  const files = textFiles.filter((file) => !file.skipped && UI_EXTENSIONS.has(path.extname(file.relative).toLowerCase()));
  const source = files.map((file) => `\n/* ${file.relative} */\n${file.content}`).join('\n');
  const lower = source.toLowerCase();
  const primary = findPrimaryFile(files);

  if (!files.length) {
    issues.push(designIssue({
      id: 'design.static.no-ui-files',
      severity: 'medium',
      title: 'DesignGuard could not find UI files to audit',
      detail: 'No HTML, JSX, TSX, Vue, Svelte, MDX, CSS, or SCSS files were scanned.',
      suggestion: 'Point --path at the UI package or configure AgentProof packages/ignore so UI files are included.',
      why: 'A design gate needs actual UI source or a browser URL to prove visual quality.'
    }));
    return issues;
  }

  if (designConfig.invalidType) {
    issues.push(designIssue({
      id: 'design.config.invalid-type',
      severity: 'medium',
      title: 'Unknown DesignGuard product type',
      file: 'agentproof.config.json',
      detail: `Design type "${designConfig.invalidType}" is not supported.`,
      suggestion: 'Use one of: landing, saas, dashboard, marketplace, ecommerce, webapp, mobile-app.',
      why: 'Product-specific rules are only reliable when the target product type is explicit.'
    }));
  }

  if (!designConfig.url) {
    issues.push(designIssue({
      id: 'design.browser.no-url',
      severity: designConfig.strictness === 'strict' ? 'medium' : 'low',
      title: 'DesignGuard is running without a browser URL',
      detail: 'Only static design checks can run because --design-url is missing.',
      suggestion: 'Start the app locally or in CI and pass --design-url http://localhost:<port> for DOM, CSS, viewport, and screenshot proof.',
      why: 'Static checks cannot prove actual fold position, overflow, tap target size, contrast, or clipped text.'
    }));
  } else if (browserAudit.unavailableReason) {
    issues.push(designIssue({
      id: 'design.browser.unavailable',
      severity: 'info',
      title: 'Browser design audit fell back to static checks',
      detail: browserAudit.unavailableReason,
      suggestion: 'Install Playwright and Chromium in CI, or rely on static-only checks during rollout.',
      why: 'The strongest DesignGuard evidence comes from measuring the rendered page.'
    }));
  }

  checkHeadings(issues, files, source);
  checkCta(issues, files, source, designConfig);
  checkHeroCss(issues, files, source, designConfig);
  checkOverflowCss(issues, files, source);
  checkContrastCss(issues, files, source);
  checkTapTargetCss(issues, files, source);
  checkSpacingScale(issues, primary, source, designConfig);
  checkTypography(issues, primary, source);
  checkColorSystem(issues, primary, source, designConfig);
  checkGenericCopy(issues, files);
  checkProductProfile(issues, primary, lower, designConfig);

  return issues;
}

export function designIssue(fields) {
  return {
    id: fields.id,
    category: 'design',
    severity: fields.severity,
    title: fields.title,
    file: fields.file || null,
    line: fields.line || null,
    detail: fields.detail || '',
    suggestion: fields.suggestion || '',
    why: fields.why || '',
    evidence: fields.evidence || null
  };
}

function checkHeadings(issues, files, source) {
  const h1Matches = [...source.matchAll(/<h1\b/gi)];
  if (h1Matches.length === 0) {
    issues.push(withLocation(files, /<main\b|<body\b|function\s+\w+|export\s+default/i, {
      id: 'design.heading.missing-h1',
      severity: 'high',
      title: 'Page has no clear H1',
      detail: 'DesignGuard could not find a first-level heading.',
      suggestion: 'Add one specific H1 that explains the page promise in one sentence.',
      why: 'Users and search engines need a single top-level promise before scanning the rest of the interface.'
    }));
  } else if (h1Matches.length > 1) {
    issues.push(withLocation(files, /<h1\b/i, {
      id: 'design.heading.multiple-h1',
      severity: 'medium',
      title: 'Page has multiple H1 headings',
      detail: `Found ${h1Matches.length} H1 elements in scanned UI files.`,
      suggestion: 'Keep one H1 for the page promise and demote section titles to H2/H3.',
      why: 'Multiple competing H1s weaken hierarchy and often signal generated layout sections stitched together.'
    }));
  }
}

function checkCta(issues, files, source, designConfig) {
  const interactive = [...source.matchAll(/<(a|button)\b[^>]*>([\s\S]{0,180}?)<\/\1>/gi)]
    .map((match) => stripTags(match[2]))
    .filter(Boolean);
  const hasStrongCta = interactive.some((text) => CTA_PATTERN.test(text));
  const hasOnlyWeakCta = interactive.length && !hasStrongCta && interactive.some((text) => WEAK_CTA_PATTERN.test(text));

  if (!hasStrongCta) {
    issues.push(withLocation(files, /<(a|button)\b/i, {
      id: 'design.cta.missing-primary',
      severity: designConfig.type === 'saas' || designConfig.type === 'landing' ? 'high' : 'medium',
      title: 'No strong primary CTA detected',
      detail: hasOnlyWeakCta ? 'Only weak CTA language such as "Learn more" was detected.' : 'No action-oriented CTA was detected in links or buttons.',
      suggestion: 'Add one visible primary CTA with a concrete verb, for example "Run audit", "Start scan", "Create project", or "Request quote".',
      why: 'A shippable MVP screen should make the first useful action obvious.'
    }));
  }
}

function checkHeroCss(issues, files, source, designConfig) {
  const heroRule = /(?:\.hero|#hero|\[data-agentproof-hero\]|header)\s*[^{]*\{[^}]*?(?:min-height|height)\s*:\s*(1\d{2}|9\d|8[6-9])vh/gi;
  const match = heroRule.exec(source);
  if (match) {
    issues.push(withLocation(files, /(?:\.hero|#hero|\[data-agentproof-hero\]|header)\s*[^{]*\{/i, {
      id: 'design.hero.too-tall',
      severity: 'high',
      title: 'Hero section is too tall',
      detail: `Hero CSS uses ${match[1]}vh; recommended maximum for ${designConfig.type} is 75-85vh on desktop.`,
      suggestion: 'Reduce vertical padding, move secondary visuals below the first fold, and keep the primary CTA visible without scrolling.',
      why: 'Oversized heroes are common AI UI slop: they look dramatic but delay the product action.',
      evidence: { actual: `${match[1]}vh`, expected: '<=85vh', source: 'static CSS' }
    }));
  }
}

function checkOverflowCss(issues, files, source) {
  const match = /(width|min-width)\s*:\s*(1[1-9]\d|[2-9]\d{2,})vw/gi.exec(source);
  if (match) {
    issues.push(withLocation(files, /(width|min-width)\s*:\s*(1[1-9]\d|[2-9]\d{2,})vw/i, {
      id: 'design.layout.horizontal-overflow',
      severity: 'critical',
      title: 'CSS can create horizontal overflow',
      detail: `Found ${match[1]}: ${match[2]}vw in UI styles.`,
      suggestion: 'Replace oversized viewport widths with max-width: 100%, container constraints, and responsive grid/flex rules.',
      why: 'Horizontal overflow breaks mobile usability and is a hard production blocker.',
      evidence: { actual: `${match[1]}: ${match[2]}vw`, expected: 'no layout wider than viewport', source: 'static CSS' }
    }));
  }
}

function checkContrastCss(issues, files, source) {
  const ruleRegex = /[^{}]+\{[^}]*color\s*:\s*(#[0-9a-f]{3,6})[^}]*background(?:-color)?\s*:\s*(#[0-9a-f]{3,6})[^}]*\}/gi;
  for (const match of source.matchAll(ruleRegex)) {
    const ratio = contrastRatio(match[1], match[2]);
    if (ratio > 0 && ratio < 4.5) {
      issues.push(withLocation(files, /color\s*:\s*#[0-9a-f]{3,6}/i, {
        id: 'design.color.low-contrast',
        severity: 'high',
        title: 'Text contrast is below WCAG AA',
        detail: `Detected color ${match[1]} on ${match[2]} with contrast ${ratio.toFixed(2)}:1.`,
        suggestion: 'Darken the text, lighten/darken the surface, or use semantic tokens that guarantee at least 4.5:1 for body text.',
        why: 'Low contrast makes the interface feel unfinished and can make content unreadable.',
        evidence: { actual: `${ratio.toFixed(2)}:1`, expected: '>=4.5:1', source: 'static CSS' }
      }));
      return;
    }
  }
}

function checkTapTargetCss(issues, files, source) {
  const buttonRule = /(?:button|\.btn|\.button|\.cta)[^{]*\{[^}]*?(?:height|min-height)\s*:\s*(\d+)px/gi;
  const match = buttonRule.exec(source);
  if (match && Number(match[1]) < 44) {
    issues.push(withLocation(files, /(?:button|\.btn|\.button|\.cta)[^{]*\{/i, {
      id: 'design.mobile.tap-target-small',
      severity: 'high',
      title: 'Interactive target is too small for mobile',
      detail: `Detected button height ${match[1]}px; mobile tap targets should be at least 44px.`,
      suggestion: 'Set min-height: 44px, add horizontal padding, and preserve visible focus states.',
      why: 'Tiny tap targets are one of the fastest ways for a mobile MVP to feel unshippable.',
      evidence: { actual: `${match[1]}px`, expected: '>=44px', source: 'static CSS' }
    }));
  }
}

function checkSpacingScale(issues, primary, source, designConfig) {
  const values = [...source.matchAll(/(?:margin|padding|gap|inset)[^:]*:\s*([^;{}]+)/gi)]
    .flatMap((match) => [...match[1].matchAll(/(\d+)px/g)].map((value) => Number(value[1])))
    .filter((value) => value > 0 && value < 260);
  const unique = [...new Set(values)];
  const hasTokens = /--(?:space|spacing|gap|radius)-/.test(source);
  if (unique.length > 14 && !hasTokens && designConfig.strictness === 'strict') {
    issues.push({
      id: 'design.spacing.inconsistent-scale',
      category: 'design',
      severity: 'medium',
      title: 'Spacing scale looks inconsistent',
      file: primary?.relative || null,
      line: 1,
      detail: `Detected ${unique.length} distinct spacing values without spacing tokens.`,
      suggestion: 'Define a compact spacing scale such as 4, 8, 12, 16, 24, 32, 48, 64 and reuse it through CSS variables or design tokens.',
      why: 'Random spacing is a signature of generated UI and makes screens feel less intentional.',
      evidence: { actual: `${unique.length} spacing values`, expected: '<=14 or tokenized spacing', source: 'static CSS' }
    });
  }
}

function checkTypography(issues, primary, source) {
  const fontFamilies = [...source.matchAll(/font-family\s*:\s*([^;{}]+)/gi)]
    .map((match) => match[1].split(',')[0].replace(/['"]/g, '').trim())
    .filter(Boolean);
  const uniqueFamilies = [...new Set(fontFamilies)];
  if (uniqueFamilies.length > 3) {
    issues.push({
      id: 'design.typography.too-many-fonts',
      category: 'design',
      severity: 'medium',
      title: 'Too many font families detected',
      file: primary?.relative || null,
      line: 1,
      detail: `Detected ${uniqueFamilies.length} primary font families: ${uniqueFamilies.slice(0, 5).join(', ')}.`,
      suggestion: 'Use one display family and one text/mono family maximum unless the brand system explicitly requires more.',
      why: 'Excessive type families make MVPs look assembled rather than designed.',
      evidence: { actual: uniqueFamilies.length, expected: '<=3', source: 'static CSS' }
    });
  }

  const tinyText = /font-size\s*:\s*(1[0-3]|\d)px/i.exec(source);
  if (tinyText) {
    issues.push({
      id: 'design.typography.too-small',
      category: 'design',
      severity: 'medium',
      title: 'Text size is too small for production UI',
      file: primary?.relative || null,
      line: 1,
      detail: `Detected font-size ${tinyText[1]}px.`,
      suggestion: 'Use at least 14px for helper text and 16px or more for body content, with readable line-height.',
      why: 'Small type often passes screenshots but fails real mobile and accessibility usage.',
      evidence: { actual: `${tinyText[1]}px`, expected: '>=14px', source: 'static CSS' }
    });
  }
}

function checkColorSystem(issues, primary, source, designConfig) {
  const colors = [...source.matchAll(/#[0-9a-f]{3,8}\b/gi)].map((match) => match[0].toLowerCase());
  const unique = [...new Set(colors)];
  const hasSemanticTokens = /--(?:primary|background|surface|text|muted|danger|success|accent)\b/i.test(source);
  if (unique.length > 18 && !hasSemanticTokens) {
    issues.push({
      id: 'design.color.too-many-colors',
      category: 'design',
      severity: 'medium',
      title: 'Color palette is not controlled',
      file: primary?.relative || null,
      line: 1,
      detail: `Detected ${unique.length} raw color values without a semantic color system.`,
      suggestion: 'Define semantic tokens for primary, background, surface, text, muted, border, success, warning, and danger, then reuse them.',
      why: 'A production MVP needs color rules, not decorative random colors.',
      evidence: { actual: `${unique.length} colors`, expected: '<=18 or semantic tokens', source: 'static CSS' }
    });
  } else if (designConfig.strictness === 'strict' && !hasSemanticTokens) {
    issues.push({
      id: 'design.color.missing-semantic-tokens',
      category: 'design',
      severity: 'low',
      title: 'No semantic color tokens detected',
      file: primary?.relative || null,
      line: 1,
      detail: 'DesignGuard did not detect primary/background/surface/text/muted semantic tokens.',
      suggestion: 'Introduce semantic CSS variables so components can stay consistent across pages and themes.',
      why: 'Semantic tokens make visual quality repeatable instead of one-off.',
      evidence: { actual: 'raw or implicit colors', expected: 'semantic color tokens', source: 'static CSS' }
    });
  }
}

function checkGenericCopy(issues, files) {
  for (const file of files) {
    const lower = file.content.toLowerCase();
    for (const phrase of GENERIC_COPY) {
      const index = lower.indexOf(phrase);
      if (index !== -1) {
        issues.push({
          id: 'design.copy.generic-positioning',
          category: 'design',
          severity: phrase === 'coming soon' || phrase === 'lorem ipsum' ? 'high' : 'medium',
          title: 'Generic product positioning copy detected',
          file: file.relative,
          line: lineOf(file.content, index),
          detail: `Detected "${phrase}".`,
          suggestion: 'Replace vague AI copy with a concrete promise, target user, outcome, and proof.',
          why: 'Design quality includes positioning clarity; generic copy makes even polished UI feel fake.',
          evidence: { actual: phrase, expected: 'specific product language', source: 'static text' }
        });
        return;
      }
    }
  }
}

function checkProductProfile(issues, primary, lower, designConfig) {
  const file = primary?.relative || null;
  const type = designConfig.type;

  if ((type === 'landing' || type === 'saas') && !/<footer\b|role=["']contentinfo["']/i.test(lower)) {
    issues.push(profileIssue('design.structure.missing-footer', 'medium', 'Landing page has no footer', file, 'No footer/contentinfo landmark was detected.', 'Add a concise footer with product links, legal/trust links, and a final route for users who reach the bottom.', 'A landing page without a footer feels unfinished and gives reviewers no trust baseline.'));
  }

  if ((type === 'landing' || type === 'saas') && !/\b(testimonial|customer|case study|trusted|security|proof|result|github|stars|rating|review)\b/i.test(lower)) {
    issues.push(profileIssue('design.structure.missing-proof', 'medium', 'No proof or trust signal detected', file, 'DesignGuard did not find testimonials, customer proof, security proof, GitHub proof, ratings, or concrete results.', 'Add one credible proof section: metrics, case study, security note, GitHub signal, demo output, or real testimonial.', 'MVP buyers and developers need a reason to trust the promise before they act.'));
  }

  if (type === 'saas' && !/\b(dashboard|report|scan|audit|api|docs|cli|workflow|receipt|analytics|settings|billing|pricing)\b/i.test(lower)) {
    issues.push(profileIssue('design.saas.missing-product-proof', 'high', 'SaaS page lacks concrete product proof', file, 'No product UI, workflow, CLI, report, API, pricing, or dashboard language was detected.', 'Show a product screenshot, CLI output, report preview, dashboard panel, or workflow example near the hero.', 'A SaaS landing page must prove there is a product, not only a promise.'));
  }

  if (type === 'dashboard') {
    if (/\b(hero|revolutionize|landing)\b/i.test(lower) && !/\b(table|filter|metric|chart|activity|status)\b/i.test(lower)) {
      issues.push(profileIssue('design.dashboard.marketing-layout', 'high', 'Dashboard looks like a marketing page', file, 'Dashboard indicators such as tables, filters, metrics, charts, or status lists were not detected.', 'Replace the hero-led layout with a decision-first dashboard: key metric, filters, table/list, recent activity, and quick actions.', 'Dashboards are tools; they need operational density and a clear decision, not a landing-page hero.'));
    }
    if (!/\b(empty|loading|error|disabled|success)\b/i.test(lower)) {
      issues.push(profileIssue('design.states.missing-core-states', 'medium', 'Core UI states are missing', file, 'No empty/loading/error/success/disabled state copy was detected.', 'Add visible state handling for loading, empty, error, disabled, and success outcomes.', 'Production tools must explain what is happening when data is missing or actions fail.'));
    }
  }

  if (type === 'marketplace') {
    if (!/\b(search|filter)\b/i.test(lower)) issues.push(profileIssue('design.marketplace.missing-search-filter', 'high', 'Marketplace lacks search or filters', file, 'Search/filter language or controls were not detected.', 'Add prominent search and filter controls before the listing grid.', 'A marketplace without search/filter cannot scale beyond a brochure.'));
    if (!/(price|€|\$|location|status|available|seller|contact|request|favorite)/i.test(lower)) issues.push(profileIssue('design.marketplace.weak-cards', 'high', 'Marketplace cards lack buyer decision data', file, 'Price, location, status, seller, contact/request, or favorite signals were not detected.', 'Cards should expose image, title, price, location/status, trust signal, and a clear contact/request CTA.', 'Buyers need comparison signals before opening details.'));
  }

  if (type === 'mobile-app') {
    if (!/\b(safe-area-inset|env\(safe-area-inset|SafeAreaView)\b/i.test(lower)) issues.push(profileIssue('design.mobile.safe-area-missing', 'medium', 'Mobile safe area handling is missing', file, 'No safe-area handling was detected.', 'Use SafeAreaView or CSS env(safe-area-inset-*) and test on 390x844.', 'Mobile MVPs must not collide with notches, home indicators, or browser chrome.'));
    if (!/\b(bottom-nav|tabbar|tab bar|BottomTab|navigation)\b/i.test(lower)) issues.push(profileIssue('design.mobile.navigation-unclear', 'medium', 'Mobile navigation pattern is unclear', file, 'No bottom nav, tab bar, or navigation marker was detected.', 'Provide a clear primary navigation pattern and one primary CTA per screen.', 'Mobile users need orientation without desktop-style navigation squeezed into a small viewport.'));
  }
}

function profileIssue(id, severity, title, file, detail, suggestion, why) {
  return designIssue({ id, severity, title, file, line: file ? 1 : null, detail, suggestion, why });
}

function withLocation(files, regex, fields) {
  for (const file of files) {
    const match = regex.exec(file.content);
    regex.lastIndex = 0;
    if (match) {
      return designIssue({
        ...fields,
        file: file.relative,
        line: lineOf(file.content, match.index)
      });
    }
  }
  return designIssue(fields);
}

function findPrimaryFile(files) {
  return files.find((file) => /(^|\/)index\.html$/.test(file.relative))
    || files.find((file) => /app\/page\.(tsx|jsx)$/.test(file.relative))
    || files.find((file) => /src\/(App|main|index)\.(tsx|jsx|html)$/.test(file.relative))
    || files[0]
    || null;
}

function lineOf(content, index) {
  return content.slice(0, Math.max(0, index)).split('\n').length;
}

function stripTags(value) {
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function contrastRatio(fg, bg) {
  const a = luminance(hexToRgb(fg));
  const b = luminance(hexToRgb(bg));
  if (a === null || b === null) return 0;
  const light = Math.max(a, b);
  const dark = Math.min(a, b);
  return (light + 0.05) / (dark + 0.05);
}

function hexToRgb(hex) {
  const normalized = String(hex || '').replace('#', '').trim();
  if (![3, 6].includes(normalized.length)) return null;
  const value = normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized;
  const int = Number.parseInt(value, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255
  };
}

function luminance(rgb) {
  if (!rgb) return null;
  const values = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
}
