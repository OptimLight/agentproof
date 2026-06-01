import fs from 'node:fs';
import path from 'node:path';
import { designIssue } from './static.js';
import { viewportSize } from './profiles.js';

export async function runBrowserDesignAudit(root, designConfig) {
  if (!designConfig.enabled || !designConfig.url) {
    return { mode: 'static', unavailableReason: designConfig.url ? '' : 'No --design-url was provided.', issues: [], measurements: [], screenshots: [] };
  }

  let playwright;
  try {
    playwright = await import('playwright');
  } catch {
    return {
      mode: 'static',
      unavailableReason: 'Playwright is not available in this install, so DesignGuard could not open the page.',
      issues: [],
      measurements: [],
      screenshots: []
    };
  }

  const screenshots = [];
  const measurements = [];
  const issues = [];
  const screenshotDir = path.join(root, '.agentproof', 'design-screenshots');
  fs.mkdirSync(screenshotDir, { recursive: true });

  let browser;
  try {
    browser = await playwright.chromium.launch({ headless: true });
    for (const route of designConfig.routes) {
      for (const viewport of designConfig.viewports) {
        const context = await browser.newContext(browserContextOptions(designConfig, viewportSize(viewport)));
        const page = await context.newPage();
        const url = joinUrl(designConfig.url, route);
        try {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        } catch {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        }

        const screenshotPath = path.join(screenshotDir, `${safeName(route || 'root')}-${viewport}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        screenshots.push(path.relative(root, screenshotPath).split(path.sep).join('/'));

        const metric = await page.evaluate(() => {
          const visible = (element) => {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
          };
          const text = (element) => (element.innerText || element.textContent || element.getAttribute('aria-label') || '').trim();
          const rectOf = (element) => {
            const rect = element.getBoundingClientRect();
            return { top: rect.top, left: rect.left, width: rect.width, height: rect.height, bottom: rect.bottom };
          };
          const all = [...document.querySelectorAll('body *')].filter(visible);
          const h1s = [...document.querySelectorAll('h1')].filter(visible).map((element) => ({
            text: text(element).slice(0, 160),
            rect: rectOf(element),
            lines: Math.max(1, Math.round(element.getBoundingClientRect().height / Number.parseFloat(getComputedStyle(element).lineHeight || '24')))
          }));
          const hero = document.querySelector('[data-agentproof-hero], .hero, #hero, header, main section, section');
          const ctas = [...document.querySelectorAll('a, button, [role="button"]')]
            .filter(visible)
            .map((element) => ({
              text: text(element).slice(0, 120),
              rect: rectOf(element),
              tag: element.tagName.toLowerCase(),
              className: String(element.className || ''),
              href: element.getAttribute('href') || ''
            }));
          const tapTargets = ctas.filter((item) => item.rect.width < 44 || item.rect.height < 44);
          const clipped = all.filter((element) => {
            if (isIntentionalA11yHidden(element)) return false;
            const style = getComputedStyle(element);
            return /(hidden|clip)/.test(`${style.overflow}${style.overflowX}${style.overflowY}`) &&
              (element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1);
          }).length;
          const textSamples = all
            .filter((element) => hasOwnReadableText(element) && !isDecorativeText(element))
            .slice(0, 120)
            .map((element) => {
              const style = getComputedStyle(element);
              return {
                text: text(element).slice(0, 80),
                color: style.color,
                backgroundColor: firstBackground(element),
                fontFamily: style.fontFamily,
                fontSize: style.fontSize,
                rect: rectOf(element)
              };
            });
          const imgs = [...document.images].filter(visible).map((img) => ({
            alt: img.getAttribute('alt'),
            rect: rectOf(img),
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight
          }));
          const rootStyle = getComputedStyle(document.documentElement);
          const semanticVars = [];
          for (let index = 0; index < rootStyle.length; index += 1) {
            const name = rootStyle[index];
            if (/--(primary|background|surface|text|muted|danger|success|accent)/i.test(name)) semanticVars.push(name);
          }
          return {
            title: document.title,
            bodyText: document.body.innerText.slice(0, 10000),
            viewport: { width: window.innerWidth, height: window.innerHeight },
            scrollWidth: document.documentElement.scrollWidth,
            scrollHeight: document.documentElement.scrollHeight,
            h1s,
            hero: hero && visible(hero) ? { text: text(hero).slice(0, 240), rect: rectOf(hero) } : null,
            ctas,
            tapTargets,
            clipped,
            textSamples,
            imgs,
            footerPresent: Boolean(document.querySelector('footer, [role="contentinfo"]')),
            semanticVars
          };

          function firstBackground(element) {
            let current = element;
            while (current && current !== document.documentElement) {
              const image = getComputedStyle(current).backgroundImage;
              if (image && image !== 'none') return 'unmeasured-gradient';
              const bg = getComputedStyle(current).backgroundColor;
              if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
              current = current.parentElement;
            }
            return getComputedStyle(document.body).backgroundColor || 'rgb(255, 255, 255)';
          }

          function hasOwnReadableText(element) {
            const ownText = [...element.childNodes]
              .filter((node) => node.nodeType === Node.TEXT_NODE)
              .map((node) => node.textContent || '')
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim();
            if (!ownText) return false;
            const style = getComputedStyle(element);
            const size = Number.parseFloat(style.fontSize || '0');
            return size >= 10 && ownText.length > 1;
          }

          function isDecorativeText(element) {
            const style = getComputedStyle(element);
            const className = String(element.className || '');
            const id = String(element.id || '');
            const label = `${className} ${id} ${element.getAttribute('data-role') || ''} ${element.getAttribute('aria-label') || ''}`;
            if (element.closest('[aria-hidden="true"], [role="presentation"], [data-decorative="true"]')) return true;
            if (/(watermark|background|backdrop|decorative|ghost|brand-bg|mega-word|ambient)/i.test(label)) return true;
            if (style.pointerEvents === 'none') return true;
            const opacity = Number.parseFloat(style.opacity || '1');
            const fontSize = Number.parseFloat(style.fontSize || '0');
            if (opacity > 0 && opacity < 0.45) return true;
            if (fontSize >= 96 && !/^(h1|h2|h3)$/i.test(element.tagName)) return true;
            return false;
          }

          function isIntentionalA11yHidden(element) {
            const label = `${element.className || ''} ${element.id || ''} ${element.getAttribute('data-role') || ''}`;
            if (element.closest('[hidden], [aria-hidden="true"], [inert]')) return true;
            if (/(sr-only|screen-reader|visually-hidden|u-visually-hidden|a11y-hidden)/i.test(label)) return true;
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.position === 'absolute' &&
              rect.width <= 2 &&
              rect.height <= 2 &&
              /(hidden|clip)/.test(`${style.overflow}${style.overflowX}${style.overflowY}`);
          }
        });

        measurements.push({ route, viewport, url, screenshot: path.relative(root, screenshotPath).split(path.sep).join('/'), ...metric });
        issues.push(...issuesFromMetric({ route, viewport, url, metric, designConfig }));
        await context.close();
      }
    }

    return { mode: 'browser', unavailableReason: '', issues, measurements, screenshots };
  } catch (error) {
    return {
      mode: 'static',
      unavailableReason: `Browser audit failed: ${error.message}`,
      issues,
      measurements,
      screenshots
    };
  } finally {
    if (browser) await browser.close();
  }
}

function issuesFromMetric({ route, viewport, url, metric, designConfig }) {
  const issues = [];
  const evidenceBase = { route, viewport, url, source: 'browser DOM' };
  const isMobile = viewport === 'mobile';

  if (metric.scrollWidth > metric.viewport.width + 2) {
    issues.push(designIssue({
      id: 'design.layout.horizontal-overflow',
      severity: 'critical',
      title: 'Rendered page has horizontal overflow',
      detail: `Document width is ${metric.scrollWidth}px in a ${metric.viewport.width}px viewport.`,
      suggestion: 'Find the overflowing container, replace fixed/oversized widths with max-width: 100%, and test the mobile viewport again.',
      why: 'Horizontal overflow is a production blocker for mobile usability.',
      evidence: { ...evidenceBase, actual: `${metric.scrollWidth}px`, expected: `<=${metric.viewport.width}px` }
    }));
  }

  if (metric.h1s.length === 0) {
    issues.push(designIssue({
      id: 'design.heading.missing-h1',
      severity: 'high',
      title: 'Rendered page has no H1',
      detail: 'No visible H1 was found in the rendered route.',
      suggestion: 'Add one visible H1 that states the page promise clearly.',
      why: 'A shippable screen needs a clear hierarchy and top-level promise.',
      evidence: { ...evidenceBase, actual: '0 H1', expected: '1 H1' }
    }));
  } else if (metric.h1s.length > 1) {
    issues.push(designIssue({
      id: 'design.heading.multiple-h1',
      severity: 'medium',
      title: 'Rendered page has multiple H1 headings',
      detail: `Found ${metric.h1s.length} visible H1 headings.`,
      suggestion: 'Keep one H1 and demote section headings to H2/H3.',
      why: 'Multiple H1s create competing page promises and weaken scanability.',
      evidence: { ...evidenceBase, actual: metric.h1s.length, expected: 1 }
    }));
  }

  const firstH1 = metric.h1s[0];
  if (firstH1 && ((isMobile && firstH1.lines > 4) || (!isMobile && firstH1.lines > 3))) {
    issues.push(designIssue({
      id: 'design.heading.h1-too-long',
      severity: 'medium',
      title: 'H1 wraps into too many lines',
      detail: `The primary H1 wraps into ${firstH1.lines} lines on ${viewport}.`,
      suggestion: 'Shorten the H1, tune font-size/line-height, or move secondary detail into supporting copy.',
      why: 'Long generated headlines push the action away and reduce comprehension.',
      evidence: { ...evidenceBase, actual: `${firstH1.lines} lines`, expected: isMobile ? '<=4 lines' : '<=3 lines' }
    }));
  }

  if (metric.hero) {
    const heroRatio = metric.hero.rect.height / metric.viewport.height;
    const maxRatio = isMobile ? 0.92 : 0.85;
    if (heroRatio > maxRatio) {
      issues.push(designIssue({
        id: 'design.hero.too-tall',
        severity: 'high',
        title: 'Hero section is too tall',
        detail: `Hero is ${Math.round(heroRatio * 100)}vh on ${viewport}.`,
        suggestion: 'Reduce hero padding/visual height and keep proof plus primary CTA visible earlier.',
        why: 'Oversized heroes look impressive in isolation but slow down product comprehension.',
        evidence: { ...evidenceBase, actual: `${Math.round(heroRatio * 100)}vh`, expected: isMobile ? '<=92vh' : '<=85vh' }
      }));
    }
  }

  const strongCtas = metric.ctas.filter((item) => /\b(start|try|run|scan|audit|create|get|book|buy|contact|request|publish|download|install|sign|commencer|essayer|lancer|auditer|créer|creer|obtenir|réserver|reserver|acheter|vendre|contacter|demander|publier|télécharger|telecharger|installer|rejoindre)\b/i.test(item.text));
  const primary = strongCtas[0] || metric.ctas[0];
  if (!primary) {
    issues.push(designIssue({
      id: 'design.cta.missing-primary',
      severity: 'high',
      title: 'No visible primary CTA',
      detail: 'No visible link, button, or role=button was detected.',
      suggestion: 'Add one prominent primary action tied to the product loop.',
      why: 'MVP screens must make the next useful action explicit.',
      evidence: { ...evidenceBase, actual: '0 visible CTA', expected: '>=1 strong CTA' }
    }));
  } else if (primary.rect.top > metric.viewport.height) {
    issues.push(designIssue({
      id: 'design.cta.below-fold',
      severity: 'high',
      title: 'Primary CTA is below the first fold',
      detail: `First useful CTA starts at ${Math.round(primary.rect.top)}px in a ${metric.viewport.height}px viewport.`,
      suggestion: 'Move the primary CTA into the hero or first visible product panel.',
      why: 'Users should not need to scroll before knowing how to act.',
      evidence: { ...evidenceBase, actual: `${Math.round(primary.rect.top)}px`, expected: `<=${metric.viewport.height}px` }
    }));
  }

  if (isMobile && metric.tapTargets.length > 0) {
    issues.push(designIssue({
      id: 'design.mobile.tap-target-small',
      severity: 'high',
      title: 'Mobile tap targets are too small',
      detail: `${metric.tapTargets.length} visible controls are smaller than 44x44px.`,
      suggestion: 'Set min-height/min-width to 44px for interactive controls and preserve spacing between them.',
      why: 'Tiny controls make mobile MVPs feel broken even when the code builds.',
      evidence: { ...evidenceBase, actual: `${metric.tapTargets.length} small targets`, expected: '0 targets below 44x44px' }
    }));
  }

  if (metric.clipped > 0) {
    issues.push(designIssue({
      id: 'design.layout.clipped-content',
      severity: 'high',
      title: 'Rendered content appears clipped',
      detail: `${metric.clipped} visible element(s) have hidden overflow while scroll dimensions exceed client dimensions.`,
      suggestion: 'Remove fixed heights, allow wrapping, or add responsive breakpoints for long copy.',
      why: 'Clipped copy/buttons are direct production defects.',
      evidence: { ...evidenceBase, actual: `${metric.clipped} clipped elements`, expected: '0 clipped elements' }
    }));
  }

  const lowContrast = metric.textSamples
    .map((sample) => ({ sample, ratio: contrastRatio(parseRgb(sample.color), parseRgb(sample.backgroundColor)) }))
    .filter((item) => item.ratio > 0 && item.ratio < 4.5 && item.sample.rect.width > 16 && item.sample.rect.height > 8)
    .sort((a, b) => a.ratio - b.ratio)[0];
  if (lowContrast) {
    issues.push(designIssue({
      id: 'design.color.low-contrast',
      severity: 'high',
      title: 'Rendered text contrast is below WCAG AA',
      detail: `Sample "${lowContrast.sample.text.slice(0, 40)}" has contrast ${lowContrast.ratio.toFixed(2)}:1.`,
      suggestion: 'Adjust text and surface tokens so normal text reaches at least 4.5:1 contrast.',
      why: 'Readable contrast is a non-negotiable production UI rule.',
      evidence: { ...evidenceBase, actual: `${lowContrast.ratio.toFixed(2)}:1`, expected: '>=4.5:1' }
    }));
  }

  const fontFamilies = new Set(metric.textSamples.map((sample) => sample.fontFamily.split(',')[0].replace(/["']/g, '').trim()).filter(Boolean));
  if (fontFamilies.size > 3) {
    issues.push(designIssue({
      id: 'design.typography.too-many-fonts',
      severity: 'medium',
      title: 'Rendered page uses too many font families',
      detail: `Detected ${fontFamilies.size} primary font families.`,
      suggestion: 'Limit the system to one display family and one body/mono family unless the brand rules require more.',
      why: 'Font sprawl makes AI-generated UI feel inconsistent.',
      evidence: { ...evidenceBase, actual: fontFamilies.size, expected: '<=3' }
    }));
  }

  if (designConfig.strictness === 'strict' && metric.semanticVars.length === 0) {
    issues.push(designIssue({
      id: 'design.color.missing-semantic-tokens',
      severity: 'low',
      title: 'Rendered page does not expose semantic color tokens',
      detail: 'No primary/background/surface/text/muted semantic CSS variables were detected on :root.',
      suggestion: 'Define semantic design tokens and bind components to them.',
      why: 'A repeatable design system needs named color intent, not one-off values.',
      evidence: { ...evidenceBase, actual: '0 semantic vars', expected: 'semantic color vars' }
    }));
  }

  return issues;
}

function joinUrl(base, route) {
  try {
    return new URL(route || '/', base.endsWith('/') ? base : `${base}/`).href;
  } catch {
    return base;
  }
}

function browserContextOptions(designConfig, viewport) {
  const options = { viewport };
  if (designConfig.locale) {
    options.locale = designConfig.locale;
    options.extraHTTPHeaders = { 'Accept-Language': acceptLanguageHeader(designConfig.locale) };
  }
  return options;
}

function acceptLanguageHeader(locale) {
  const primary = String(locale || '').split(/[-_]/)[0] || locale;
  return primary && primary !== locale ? `${locale},${primary};q=0.9,en;q=0.7` : `${locale},en;q=0.7`;
}

function safeName(route) {
  return String(route || 'root').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'root';
}

function parseRgb(value) {
  const match = /rgba?\((\d+),\s*(\d+),\s*(\d+)/i.exec(String(value || ''));
  if (!match) return null;
  return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]) };
}

function contrastRatio(fg, bg) {
  const a = luminance(fg);
  const b = luminance(bg);
  if (a === null || b === null) return 0;
  const light = Math.max(a, b);
  const dark = Math.min(a, b);
  return (light + 0.05) / (dark + 0.05);
}

function luminance(rgb) {
  if (!rgb) return null;
  const values = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
}
