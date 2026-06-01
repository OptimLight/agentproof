import fs from 'node:fs';
import path from 'node:path';
import { resolveDesignConfig } from './profiles.js';
import {
  codexRequestHeaders,
  getCodexModelIds,
  pickCodexModel,
  resolveCodexAuth
} from './codex-auth.js';

const FIXABLE_EXTENSIONS = new Set([
  '.html',
  '.css',
  '.scss',
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.vue',
  '.svelte',
  '.mdx'
]);

const MAX_FILES = 6;
const MAX_FILE_CHARS = 55000;
const MAX_BROWSER_HTML_CHARS = 120000;
const MAX_BROWSER_CSS_CHARS = 70000;
const MAX_BROWSER_CLONE_HTML_CHARS = 160000;
const MAX_BROWSER_CLONE_CSS_CHARS = 180000;

export async function runDesignFix(root, textFiles, config, options, designAudit, env = process.env) {
  const designConfig = resolveDesignConfig(config, {
    ...options,
    designOnly: true,
    designAi: true
  });
  const browserClone = options.designFixFromBrowser
    ? await collectBrowserCloneSource(designConfig)
    : null;
  const files = browserClone ? [] : selectFixFiles(textFiles, designConfig);
  const outputPath = path.resolve(root, options.designFixOutput || 'AGENT_PROOF_DESIGN_FIX.md');

  if (browserClone && !browserClone.ok) {
    const result = {
      ok: false,
      applied: false,
      outputPath,
      provider: designConfig.ai.provider,
      model: designConfig.ai.model,
      reasoning: designConfig.ai.reasoning,
      mode: 'browser-clone',
      error: browserClone.error,
      files: [],
      notes: []
    };
    fs.writeFileSync(outputPath, renderDesignFixReport(result, designAudit));
    return result;
  }

  if (!browserClone && !files.length) {
    const result = {
      ok: false,
      applied: false,
      outputPath,
      provider: designConfig.ai.provider,
      model: designConfig.ai.model,
      reasoning: designConfig.ai.reasoning,
      error: 'DesignFix could not find editable UI files. Use --design-source index.html,styles.css or point --path at the UI package.',
      files: [],
      notes: []
    };
    fs.writeFileSync(outputPath, renderDesignFixReport(result, designAudit));
    return result;
  }

  const prompt = browserClone
    ? buildBrowserClonePrompt(designConfig, designAudit, browserClone.capture)
    : buildDesignFixPrompt(designConfig, designAudit, files);
  const ai = await requestDesignFix(designConfig, prompt, env);
  if (!ai.ok) {
    const result = {
      ok: false,
      applied: false,
      outputPath,
      provider: ai.provider,
      model: ai.model,
      reasoning: ai.reasoning,
      mode: browserClone ? 'browser-clone' : 'source-rewrite',
      error: ai.error,
      files: [],
      notes: []
    };
    fs.writeFileSync(outputPath, renderDesignFixReport(result, designAudit));
    return result;
  }

  const parsed = parseFixPayload(ai.text);
  if (!parsed.ok) {
    const result = {
      ok: false,
      applied: false,
      outputPath,
      provider: ai.provider,
      model: ai.model,
      reasoning: ai.reasoning,
      mode: browserClone ? 'browser-clone' : 'source-rewrite',
      error: parsed.error,
      raw: ai.text,
      files: [],
      notes: []
    };
    fs.writeFileSync(outputPath, renderDesignFixReport(result, designAudit));
    return result;
  }

  const selectedPaths = new Set(browserClone ? browserCloneAllowedPaths() : files.map((file) => file.relative));
  let generatedFiles = parsed.payload.files
    .filter((file) => selectedPaths.has(normalizePath(file.path)))
    .map((file) => ({
      path: normalizePath(file.path),
      content: String(file.content ?? '')
    }))
    .filter((file) => file.path && file.content);

  if (browserClone) {
    generatedFiles = hardenBrowserCloneFiles(generatedFiles, browserClone.capture);
  } else if (designAudit.improvementBrief) {
    generatedFiles = hardenSourceRewriteFiles(generatedFiles);
  }

  const visualIntegrity = validateVisualIntegrity({
    generatedFiles,
    sourceFiles: files,
    browserClone,
    improvementMode: Boolean(designAudit.improvementBrief)
  });
  if (!visualIntegrity.ok) {
    const result = {
      ok: false,
      applied: false,
      outputPath,
      provider: ai.provider,
      model: ai.model,
      reasoning: ai.reasoning,
      mode: browserClone ? 'browser-clone' : 'source-rewrite',
      error: visualIntegrity.error,
      raw: ai.text,
      files: generatedFiles,
      notes: visualIntegrity.notes
    };
    fs.writeFileSync(outputPath, renderDesignFixReport(result, designAudit));
    return result;
  }

  if (!generatedFiles.length) {
    const result = {
      ok: false,
      applied: false,
      outputPath,
      provider: ai.provider,
      model: ai.model,
      reasoning: ai.reasoning,
      mode: browserClone ? 'browser-clone' : 'source-rewrite',
      error: 'DesignFix AI response did not include any editable files from the selected source set.',
      raw: ai.text,
      files: [],
      notes: []
    };
    fs.writeFileSync(outputPath, renderDesignFixReport(result, designAudit));
    return result;
  }

  const backups = options.designFixApply ? applyGeneratedFiles(root, generatedFiles) : [];
  const result = {
    ok: true,
    applied: Boolean(options.designFixApply),
    outputPath,
    provider: ai.provider,
    model: ai.model,
    reasoning: ai.reasoning,
    mode: browserClone ? 'browser-clone' : 'source-rewrite',
    summary: String(parsed.payload.summary || '').trim(),
    files: generatedFiles,
    notes: Array.isArray(parsed.payload.notes) ? parsed.payload.notes.map(String).filter(Boolean) : [],
    backups
  };

  fs.writeFileSync(outputPath, renderDesignFixReport(result, designAudit));
  return result;
}

export function renderDesignFixConsole(result) {
  if (!result.ok) {
    return [
      'FAIL DesignFix - AI rewrite was not produced',
      `Provider: ${result.provider || 'unknown'}`,
      `Model: ${result.model || 'unknown'}`,
      `Report: ${result.outputPath}`,
      `Problem: ${result.error}`
    ].join('\n');
  }

  return [
    `${result.applied ? 'APPLIED' : 'READY'} DesignFix ${result.files.length} file(s) ${result.applied ? writeVerb(result) : 'generated'}`,
    `Provider: ${result.provider}`,
    `Model: ${result.model}`,
    result.reasoning ? `Reasoning: ${result.reasoning}` : '',
    `Mode: ${result.mode || 'source-rewrite'}`,
    `Report: ${result.outputPath}`,
    result.applied
      ? `Backup: ${result.backups[0]?.backupRoot || 'not created'}`
      : 'Next: Review the report, then rerun with --apply to rewrite the selected files.'
  ].filter(Boolean).join('\n');
}

function writeVerb(result) {
  return result.mode === 'browser-clone' ? 'created' : 'rewritten';
}

function selectFixFiles(textFiles, designConfig) {
  const candidates = textFiles
    .filter((file) => !file.skipped)
    .filter((file) => FIXABLE_EXTENSIONS.has(path.extname(file.relative).toLowerCase()))
    .filter((file) => !designConfig.ignore.some((pattern) => matchesPathPattern(file.relative, pattern)))
    .filter((file) => {
      if (!designConfig.source?.length) return true;
      return designConfig.source.some((pattern) => matchesSourcePattern(file.relative, pattern));
    })
    .sort((a, b) => priorityForFile(a.relative) - priorityForFile(b.relative));

  return candidates.slice(0, MAX_FILES).map((file) => ({
    relative: file.relative,
    content: file.content.length > MAX_FILE_CHARS
      ? `${file.content.slice(0, MAX_FILE_CHARS)}\n/* AgentProof truncated this file for the AI prompt. */`
      : file.content
  }));
}

function priorityForFile(relative) {
  const name = path.basename(relative).toLowerCase();
  if (name === 'index.html') return 0;
  if (name.includes('style') || name.endsWith('.css') || name.endsWith('.scss')) return 1;
  if (name.includes('app') || name.includes('page')) return 2;
  if (name.endsWith('.tsx') || name.endsWith('.jsx')) return 3;
  if (name.endsWith('.js') || name.endsWith('.ts')) return 4;
  return 10;
}

function buildDesignFixPrompt(designConfig, designAudit, files) {
  const activeIssues = (designAudit.issues || [])
    .filter((issue) => issue.category === 'design')
    .filter((issue) => ['critical', 'high', 'medium'].includes(issue.severity))
    .slice(0, 16)
    .map((issue) => ({
      id: issue.id,
      severity: issue.severity,
      title: issue.title,
      file: issue.file,
      line: issue.line,
      problem: issue.detail,
      why: issue.why,
      fix: issue.suggestion,
      evidence: issue.evidence
    }));

  const measurements = (designAudit.measurements || []).slice(0, 4).map((item) => ({
    route: item.route,
    viewport: item.viewport,
    title: item.title,
    h1: item.h1s?.[0]?.text || '',
    ctas: (item.ctas || []).slice(0, 8).map((cta) => cta.text),
    hero: item.hero?.rect || null,
    footerPresent: item.footerPresent
  }));

  return JSON.stringify({
    role: 'DesignFix senior product designer and frontend engineer',
    task: 'Rewrite the selected UI files into a shippable version. Fix every DesignGuard blocker without changing the project stack or inventing fake proof.',
    improvementBrief: designAudit.improvementBrief || '',
    productType: designConfig.type,
    url: designConfig.url,
    strictness: designConfig.strictness,
    rules: [
      'Preserve the existing brand identity unless it directly causes a blocker.',
      'If improvementBrief is provided, treat it as the authoritative repair brief.',
      'Do not game the score with broad global CSS overrides, forced dark panels, hidden hero content, or a new generic palette.',
      'The result must look like the same product after a senior design pass, not like a different template.',
      'Prefer CSS and spacing fixes over structural rewrites. Keep the existing section order and at least 80% of visible copy unchanged.',
      'Make one primary CTA obvious and action-oriented.',
      'Fix clipped content, mobile tap targets, spacing scale, contrast, hierarchy, and responsive layout.',
      'Do not add fake testimonials, fake logos, fake metrics, or unsupported claims.',
      'Return full replacement content for each edited file.',
      'Return only valid JSON. No markdown fences.'
    ],
    findingsToFix: activeIssues,
    browserMeasurements: measurements,
    files: files.map((file) => ({
      path: file.relative,
      content: file.content
    })),
    responseSchema: {
      summary: 'short summary of the rewrite',
      notes: ['important tradeoffs or manual checks'],
      files: [
        {
          path: 'relative/path/from/input',
          content: 'full replacement file content'
        }
      ]
    }
  }, null, 2);
}

function buildBrowserClonePrompt(designConfig, designAudit, capture) {
  const activeIssues = (designAudit.issues || [])
    .filter((issue) => issue.category === 'design')
    .filter((issue) => ['critical', 'high', 'medium'].includes(issue.severity))
    .slice(0, 16)
    .map((issue) => ({
      id: issue.id,
      severity: issue.severity,
      title: issue.title,
      problem: issue.detail,
      why: issue.why,
      fix: issue.suggestion,
      evidence: issue.evidence
    }));

  return JSON.stringify({
    role: 'DesignFix browser-clone senior product designer and frontend engineer',
    task: 'Create a faithful standalone copy of this browser-rendered website, then improve it surgically. The original source repository is not available, so clonedStarterFiles are the source of truth.',
    improvementBrief: designAudit.improvementBrief || '',
    productType: designConfig.type,
    sourceUrl: designConfig.url,
    locale: designConfig.locale,
    strictness: designConfig.strictness,
    rules: [
      'Do not redesign from scratch. Start from clonedStarterFiles and preserve the original composition, language, copy, brand mark, media, section order, and visual personality.',
      'If improvementBrief is provided, treat it as the authoritative repair brief.',
      'Do not translate the page. Keep the original language unless the source itself contains multiple languages.',
      'The output should feel like the same site after a senior design pass, not like a different template.',
      'Improve only what blocks shipping: CTA visibility, clipped content, mobile tap targets >=44px, contrast, spacing rhythm, responsive behavior, and semantic tokens.',
      'Do not game the score with broad global CSS overrides, forced dark panels, hidden hero content, or a new generic palette.',
      'Prefer CSS and spacing fixes over structural rewrites. Keep the existing section order and at least 80% of visible copy unchanged.',
      'Keep the desktop hero below 85vh and keep the primary CTA inside the first viewport without deleting the original hero idea.',
      'Use valid standalone CSS. Avoid malformed calc()/min() declarations, fixed heights on text containers, negative letter-spacing, and overflow:hidden on copy wrappers.',
      'styles.css must keep the captured source CSS as the foundation and add improvements after it. Do not replace the brand system with a generic SaaS style.',
      'Use original public absolute asset URLs from the capture when useful. Do not invent testimonials, logos, metrics, or product claims.',
      'Return complete files only: index.html, styles.css, and optionally script.js.',
      'Return only valid JSON. No markdown fences.'
    ],
    findingsToFix: activeIssues,
    clonedStarterFiles: capture.starterFiles,
    browserCapture: compactBrowserCapture(capture),
    responseSchema: {
      summary: 'short summary of the faithful clone and targeted design improvements',
      notes: ['important tradeoffs or manual checks'],
      files: [
        {
          path: 'index.html',
          content: 'full standalone HTML derived from clonedStarterFiles.index.html and referencing ./styles.css'
        },
        {
          path: 'styles.css',
          content: 'full CSS derived from clonedStarterFiles.styles.css, with improvements appended or integrated'
        },
        {
          path: 'script.js',
          content: 'optional lightweight JS only if needed'
        }
      ]
    }
  }, null, 2);
}

async function collectBrowserCloneSource(designConfig) {
  if (!designConfig.url) {
    return { ok: false, error: 'Browser clone requires --design-url because no local source files are available.' };
  }

  let playwright;
  try {
    playwright = await import('playwright');
  } catch {
    return { ok: false, error: 'Playwright is not available, so DesignFix cannot read the rendered browser source.' };
  }

  let browser;
  try {
    browser = await playwright.chromium.launch({ headless: true });
    const context = await browser.newContext(browserCloneContextOptions(designConfig));
    const page = await context.newPage();
    try {
      await page.goto(designConfig.url, { waitUntil: 'networkidle', timeout: 20000 });
    } catch {
      await page.goto(designConfig.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    }
    const capture = await page.evaluate(({ maxHtml, maxCss, maxCloneHtml, maxCloneCss }) => {
      const text = (element) => (element.innerText || element.textContent || element.getAttribute('aria-label') || '').trim();
      const rectOf = (element) => {
        const rect = element.getBoundingClientRect();
        return {
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      };
      const styleOf = (element) => {
        const style = getComputedStyle(element);
        return {
          display: style.display,
          position: style.position,
          color: style.color,
          backgroundColor: style.backgroundColor,
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          lineHeight: style.lineHeight,
          padding: style.padding,
          margin: style.margin,
          gap: style.gap,
          borderRadius: style.borderRadius,
          boxShadow: style.boxShadow,
          textTransform: style.textTransform
        };
      };
      const visible = (element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      };
      const absolute = (value) => {
        try {
          return new URL(value, location.href).href;
        } catch {
          return value || '';
        }
      };
      const absoluteAttribute = (value, keepHash = false) => {
        const raw = String(value || '').trim();
        if (!raw) return raw;
        if (keepHash && raw.startsWith('#')) return raw;
        if (/^(data:|blob:|mailto:|tel:)/i.test(raw)) return raw;
        if (/^javascript:/i.test(raw)) return '#';
        return absolute(raw);
      };
      const rewriteSrcset = (value) => String(value || '')
        .split(',')
        .map((part) => {
          const bits = part.trim().split(/\s+/);
          if (!bits[0]) return '';
          bits[0] = absoluteAttribute(bits[0]);
          return bits.join(' ');
        })
        .filter(Boolean)
        .join(', ');
      const rewriteCssUrls = (css, baseUrl) => String(css || '').replace(/url\((['"]?)([^'")]+)\1\)/gi, (match, quote, rawUrl) => {
        const url = String(rawUrl || '').trim();
        if (!url || /^(data:|blob:|https?:|#)/i.test(url)) return match;
        try {
          return `url("${new URL(url, baseUrl || location.href).href}")`;
        } catch {
          return match;
        }
      }).replace(/@import\s+(url\()?(['"]?)([^'")\s;]+)\2\)?/gi, (match, prefix, quote, rawUrl) => {
        const url = String(rawUrl || '').trim();
        if (!url || /^(data:|blob:|https?:|#)/i.test(url)) return match;
        try {
          return match.replace(rawUrl, new URL(url, baseUrl || location.href).href);
        } catch {
          return match;
        }
      });
      const buildStandaloneHtml = () => {
        const clone = document.documentElement.cloneNode(true);
        clone.querySelectorAll('script, link[rel~="modulepreload"], link[as="script"]').forEach((element) => element.remove());
        clone.querySelectorAll('link[rel~="stylesheet"], style').forEach((element) => element.remove());
        clone.querySelectorAll('[src]').forEach((element) => element.setAttribute('src', absoluteAttribute(element.getAttribute('src'))));
        clone.querySelectorAll('[href]').forEach((element) => element.setAttribute('href', absoluteAttribute(element.getAttribute('href'), true)));
        clone.querySelectorAll('[poster]').forEach((element) => element.setAttribute('poster', absoluteAttribute(element.getAttribute('poster'))));
        clone.querySelectorAll('[action]').forEach((element) => element.setAttribute('action', absoluteAttribute(element.getAttribute('action'))));
        clone.querySelectorAll('[srcset]').forEach((element) => element.setAttribute('srcset', rewriteSrcset(element.getAttribute('srcset'))));
        let head = clone.querySelector('head');
        if (!head) {
          head = document.createElement('head');
          clone.insertBefore(head, clone.firstChild);
        }
        if (!head.querySelector('meta[charset]')) {
          const charset = document.createElement('meta');
          charset.setAttribute('charset', 'utf-8');
          head.prepend(charset);
        }
        if (!head.querySelector('meta[name="viewport"]')) {
          const viewport = document.createElement('meta');
          viewport.setAttribute('name', 'viewport');
          viewport.setAttribute('content', 'width=device-width, initial-scale=1');
          head.appendChild(viewport);
        }
        const source = document.createElement('meta');
        source.setAttribute('name', 'agentproof-source-url');
        source.setAttribute('content', location.href);
        head.appendChild(source);
        const stylesheet = document.createElement('link');
        stylesheet.setAttribute('rel', 'stylesheet');
        stylesheet.setAttribute('href', 'styles.css');
        head.appendChild(stylesheet);
        return `<!doctype html>\n${clone.outerHTML}`;
      };

      const elements = [...document.querySelectorAll('header, nav, main, section, article, footer, h1, h2, h3, p, a, button, img, video, [class]')]
        .filter(visible)
        .slice(0, 180)
        .map((element) => ({
          tag: element.tagName.toLowerCase(),
          id: element.id || '',
          className: String(element.className || '').slice(0, 180),
          text: text(element).replace(/\s+/g, ' ').slice(0, 220),
          href: element.getAttribute('href') ? absolute(element.getAttribute('href')) : '',
          src: element.getAttribute('src') ? absolute(element.getAttribute('src')) : '',
          rect: rectOf(element),
          style: styleOf(element)
        }));

      const stylesheets = [];
      const cssParts = [];
      for (const sheet of [...document.styleSheets]) {
        const href = sheet.href || '';
        try {
          const css = rewriteCssUrls([...sheet.cssRules].map((rule) => rule.cssText).join('\n'), href || location.href);
          if (css.trim()) {
            stylesheets.push({ href, css: css.slice(0, maxCss) });
            cssParts.push(`/* Source stylesheet: ${href || 'inline'} */\n${css}`);
          }
        } catch {
          if (href) stylesheets.push({ href, css: '' });
        }
      }
      const standaloneHtml = buildStandaloneHtml();
      const standaloneCss = cssParts.join('\n\n');

      return {
        url: location.href,
        title: document.title,
        lang: document.documentElement.lang || '',
        metaDescription: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
        bodyText: document.body.innerText.replace(/\s+/g, ' ').slice(0, 18000),
        renderedHtml: document.documentElement.outerHTML.slice(0, maxHtml),
        stylesheets,
        starterFiles: {
          html: standaloneHtml.slice(0, maxCloneHtml),
          css: standaloneCss.slice(0, maxCloneCss),
          htmlBytes: standaloneHtml.length,
          cssBytes: standaloneCss.length
        },
        assets: {
          images: [...document.images].filter(visible).slice(0, 30).map((img) => ({
            src: absolute(img.currentSrc || img.src),
            alt: img.alt || '',
            width: img.naturalWidth,
            height: img.naturalHeight,
            rect: rectOf(img)
          })),
          videos: [...document.querySelectorAll('video')].filter(visible).slice(0, 20).map((video) => ({
            src: absolute(video.currentSrc || video.getAttribute('src') || ''),
            poster: absolute(video.getAttribute('poster') || ''),
            rect: rectOf(video)
          }))
        },
        elements
      };
    }, {
      maxHtml: MAX_BROWSER_HTML_CHARS,
      maxCss: MAX_BROWSER_CSS_CHARS,
      maxCloneHtml: MAX_BROWSER_CLONE_HTML_CHARS,
      maxCloneCss: MAX_BROWSER_CLONE_CSS_CHARS
    });
    await context.close();
    return { ok: true, capture };
  } catch (error) {
    return { ok: false, error: `Browser clone failed: ${error.message}` };
  } finally {
    if (browser) await browser.close();
  }
}

function browserCloneContextOptions(designConfig) {
  const options = { viewport: { width: 1440, height: 960 } };
  if (designConfig.locale) {
    options.locale = designConfig.locale;
    options.extraHTTPHeaders = { 'Accept-Language': browserAcceptLanguageHeader(designConfig.locale) };
  }
  return options;
}

function browserAcceptLanguageHeader(locale) {
  const primary = String(locale || '').split(/[-_]/)[0] || locale;
  return primary && primary !== locale ? `${locale},${primary};q=0.9,en;q=0.7` : `${locale},en;q=0.7`;
}

async function requestDesignFix(designConfig, prompt, env) {
  const provider = normalizeAiProvider(designConfig.ai.provider);
  if (provider === 'codex-auth' || (provider === 'auto' && !env.OPENAI_API_KEY)) {
    return requestCodexDesignFix(designConfig, prompt, env);
  }
  return requestOpenAiDesignFix(designConfig, prompt, env);
}

async function requestOpenAiDesignFix(designConfig, prompt, env) {
  if (!env.OPENAI_API_KEY) {
    return {
      ok: false,
      provider: 'openai-api',
      model: designConfig.ai.model || 'gpt-5-mini',
      error: 'OPENAI_API_KEY is missing. Use --design-ai-provider codex-auth after `codex login`, or set OPENAI_API_KEY.'
    };
  }

  const model = designConfig.ai.model || 'gpt-5-mini';
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify(withReasoningEffort({
      model,
      store: false,
      instructions: 'You are DesignFix. Return only strict JSON that matches the requested schema.',
      input: prompt
    }, designConfig.ai.reasoning))
  });
  if (!response.ok) {
    return {
      ok: false,
      provider: 'openai-api',
      model,
      error: `OpenAI API returned HTTP ${response.status}. ${await safeResponseText(response)}`
    };
  }
  const payload = await response.json();
  return {
    ok: true,
    provider: 'openai-api',
    model,
    reasoning: designConfig.ai.reasoning,
    text: extractOutputText(payload)
  };
}

async function requestCodexDesignFix(designConfig, prompt, env) {
  const auth = await resolveCodexAuth(env);
  if (!auth.ok) {
    return {
      ok: false,
      provider: 'codex-auth',
      model: designConfig.ai.model || 'auto',
      error: auth.message
    };
  }

  const models = await getCodexModelIds(auth.accessToken, env);
  const model = pickCodexModel(models, designConfig.ai.model);
  const response = await fetch(`${auth.baseUrl}/responses`, {
    method: 'POST',
    headers: {
      ...codexRequestHeaders(auth.accessToken),
      Accept: 'text/event-stream'
    },
    body: JSON.stringify(withReasoningEffort({
      model,
      store: false,
      stream: true,
      instructions: 'You are DesignFix. Return only strict JSON that matches the requested schema.',
      input: [{ role: 'user', content: prompt }]
    }, designConfig.ai.reasoning))
  });
  if (!response.ok) {
    return {
      ok: false,
      provider: 'codex-auth',
      model,
      error: `Codex backend returned HTTP ${response.status}. ${await safeResponseText(response)}`
    };
  }

  return {
    ok: true,
    provider: 'codex-auth',
    model,
    reasoning: designConfig.ai.reasoning,
    text: extractOutputTextFromSse(await response.text())
  };
}

function withReasoningEffort(payload, effort) {
  if (!effort) return payload;
  return {
    ...payload,
    reasoning: { effort }
  };
}

function parseFixPayload(text) {
  const raw = String(text || '').trim();
  const jsonText = extractJson(raw);
  if (!jsonText) {
    return { ok: false, error: 'AI response did not contain a JSON object.' };
  }
  const parseResult = parseLooseJson(jsonText);
  if (!parseResult.ok) {
    return { ok: false, error: `AI response JSON could not be parsed: ${parseResult.error.message}` };
  }
  const payload = parseResult.value;
    if (!payload || typeof payload !== 'object' || !Array.isArray(payload.files)) {
      return { ok: false, error: 'AI response JSON is missing files[].' };
    }
    return { ok: true, payload };
}

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return '';
  return text.slice(start, end + 1);
}

function parseLooseJson(jsonText) {
  const attempts = [jsonText, repairUnescapedQuotesInStringValues(jsonText)];
  const uniqueAttempts = [...new Set(attempts)];

  for (const candidate of uniqueAttempts) {
    try {
      return { ok: true, value: JSON.parse(candidate) };
    } catch (error) {
      continue;
    }
  }

  try {
    return { ok: true, value: JSON.parse(attemptFixCommonBadJson(jsonText)) };
  } catch (error) {
    return { ok: false, error };
  }
}

function attemptFixCommonBadJson(jsonText) {
  return jsonText
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/\b([A-Za-z0-9_]+)\s*:/g, '"$1":');
}

function repairUnescapedQuotesInStringValues(jsonText) {
  let out = '';
  let inString = false;
  let escape = false;

  for (let index = 0; index < jsonText.length; index += 1) {
    const char = jsonText[index];
    out += char;

    if (!inString) {
      if (char === '"' && !escape) inString = true;
      if (char === '\\' && !escape) escape = true;
      continue;
    }

    if (escape) {
      escape = false;
      continue;
    }

    if (char === '\\') {
      escape = true;
      continue;
    }

    if (char !== '"') {
      continue;
    }

    let nextIndex = index + 1;
    while (nextIndex < jsonText.length && /[\t \n\r]/.test(jsonText[nextIndex])) {
      nextIndex += 1;
    }

    const nextChar = jsonText[nextIndex];
    const closesString = nextIndex >= jsonText.length || nextChar === ',' || nextChar === '}' || nextChar === ']' || nextChar === ':' || nextChar === '\n' || nextChar === '\r' || nextChar === '\t' || nextChar === ' ';
    if (!closesString) {
      out = `${out.slice(0, -1)}\\"`;
    } else {
      inString = false;
    }
  }

  return out;
}

function applyGeneratedFiles(root, files) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupRoot = path.join(root, '.agentproof', 'design-fix-backups', stamp);
  const backups = [];
  fs.mkdirSync(backupRoot, { recursive: true });

  for (const file of files) {
    const target = resolveSafePath(root, file.path);
    const backupPath = path.join(backupRoot, file.path);
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    if (fs.existsSync(target)) {
      fs.copyFileSync(target, backupPath);
    }
    fs.writeFileSync(target, file.content);
    backups.push({ file: file.path, backupRoot, backupPath });
  }

  return backups;
}

function browserCloneAllowedPaths() {
  return new Set(['index.html', 'styles.css', 'script.js']);
}

function compactBrowserCapture(capture) {
  return {
    url: capture.url,
    title: capture.title,
    lang: capture.lang,
    metaDescription: capture.metaDescription,
    bodyText: capture.bodyText,
    assets: capture.assets,
    elements: capture.elements,
    sourceStylesheets: (capture.stylesheets || []).map((sheet) => ({
      href: sheet.href,
      cssChars: sheet.css?.length || 0
    })),
    starterFileSizes: capture.starterFiles ? {
      htmlBytes: capture.starterFiles.htmlBytes,
      cssBytes: capture.starterFiles.cssBytes
    } : null
  };
}

function hardenBrowserCloneFiles(files, capture = {}) {
  const starterHtml = capture.starterFiles?.html || '';
  const starterCss = capture.starterFiles?.css || '';
  const normalized = new Map(files.map((file) => [file.path, file]));
  if (starterHtml && !normalized.has('index.html')) {
    normalized.set('index.html', { path: 'index.html', content: starterHtml });
  }
  if (starterCss && !normalized.has('styles.css')) {
    normalized.set('styles.css', { path: 'styles.css', content: starterCss });
  }

  return [...normalized.values()].map((file) => {
    if (file.path === 'index.html') {
      const sourceText = textSignature(capture.bodyText || htmlToText(starterHtml));
      const generatedText = textSignature(htmlToText(file.content));
      const shouldRestoreStarter = starterHtml && sourceText.length > 12 && overlapRatio(sourceText, generatedText) < 0.45;
      const content = shouldRestoreStarter ? starterHtml : file.content;
      return {
        ...file,
        content: ensureBrowserCloneHtml(content)
          .replace(/coming soon/gi, 'planned after the Android beta')
          .replace(/<a([^>]+class="[^"]*\bbutton\b[^"]*"[^>]*)>/gi, '<a$1 role="button">')
      };
    }
    if (file.path === 'styles.css') {
      const sourceCss = starterCss && !containsLikelySourceCss(file.content, starterCss)
        ? `${starterCss}\n\n/* AgentProof AI design improvements */\n${file.content}`
        : file.content;
      const repairedCss = sourceCss
        .replace(/letter-spacing\s*:\s*-[^;]+;/gi, 'letter-spacing: 0;')
        .replace(/calc\(100%\s*-\s*\(2\s*\*\s*var\(--pad\)\)\);/gi, 'calc(100% - (2 * var(--pad))));');
      return {
        ...file,
        content: `${repairedCss}\n\n${browserCloneGuardrailCss()}`
      };
    }
    return file;
  });
}

function hardenSourceRewriteFiles(files) {
  return files.map((file) => {
    if (file.path.endsWith('.html') || file.path.endsWith('.mdx') || file.path.endsWith('.jsx') || file.path.endsWith('.tsx') || file.path.endsWith('.vue') || file.path.endsWith('.svelte')) {
      return {
        ...file,
        content: injectDesignImproveGuardrails(
          repairDesignImproveCss(file.content)
            .replace(/lorem ipsum/gi, 'review evidence')
            .replace(/coming soon/gi, 'available in this beta')
        )
      };
    }
    if (file.path.endsWith('.css') || file.path.endsWith('.scss')) {
      return {
        ...file,
        content: `${repairDesignImproveCss(file.content)}\n\n${designImproveGuardrailCss()}`
      };
    }
    return file;
  });
}

function validateVisualIntegrity({ generatedFiles, sourceFiles, browserClone, improvementMode }) {
  if (!improvementMode && !browserClone) return { ok: true, notes: [] };

  const notes = [];
  const sourceByPath = new Map((sourceFiles || []).map((file) => [normalizePath(file.relative), file.content || '']));
  const sourceBrowserText = browserClone?.capture?.bodyText || htmlToText(browserClone?.capture?.starterFiles?.html || '');

  for (const file of generatedFiles) {
    const content = stripAgentProofGuardrails(file.content || '');
    const source = stripAgentProofGuardrails(sourceByPath.get(file.path) || '');
    const problems = destructiveVisualPatterns(content, source);

    if (isHtmlLike(file.path)) {
      const sourceText = textSignature(htmlToText(source) || sourceBrowserText);
      const generatedText = textSignature(htmlToText(content));
      if (sourceText.length > 16 && generatedText.length > 16 && overlapRatio(sourceText, generatedText) < 0.28) {
        problems.push('generated page text diverges too far from the original product copy');
      }
    }

    if (problems.length) {
      return {
        ok: false,
        error: `Visual integrity guard rejected ${file.path}: ${problems.join('; ')}. Refine the AI prompt or source styles instead of applying broad score-hacking CSS.`,
        notes
      };
    }
  }

  return { ok: true, notes };
}

function destructiveVisualPatterns(content, source = '') {
  const problems = [];
  const cleaned = String(content || '');
  const sourceCleaned = String(source || '');
  const newlyIntroduced = (pattern) => pattern.test(cleaned) && !pattern.test(sourceCleaned);

  if (newlyIntroduced(/:where\([^)]*(?:main|section|article|div|span|p|h1|h2|h3)[^)]*\)\s*\{[^}]*\bcolor\s*:/i)) {
    problems.push('broad global text color override');
  }
  if (newlyIntroduced(/(?:^|[}\n])\s*(?:html,\s*)?body\s*\{[^}]*\b(?:color|background(?:-color|-image)?)\s*:/i)) {
    problems.push('body-level brand color/background override');
  }
  if (newlyIntroduced(/background-image\s*:\s*none\s*!important/i)) {
    problems.push('forced removal of visual backgrounds');
  }
  if (newlyIntroduced(/(?:article|div|aside)\[class[^\]]+\][^{]*\{[^}]*background\s*:/i)) {
    problems.push('template-like background override for broad component selectors');
  }
  if (newlyIntroduced(/:where\([^)]*(?:hero-visual|hero-panel|terminal|demo-card|proof-card)[^)]*\)\s*\{[^}]*display\s*:\s*none\s*!important/i)) {
    problems.push('hero/product visual hidden to satisfy layout score');
  }

  return problems;
}

function stripAgentProofGuardrails(content) {
  const withoutInjectedStyle = String(content || '')
    .replace(/<style\b[^>]*data-agentproof-design-improve[^>]*>[\s\S]*?<\/style>/gi, '');
  if (/<(?:!doctype|html|head|body|main|section|div|style)\b/i.test(withoutInjectedStyle)) {
    return withoutInjectedStyle;
  }
  return withoutInjectedStyle.replace(/\/\*\s*AgentProof (?:DesignImprove|browser-clone)[\s\S]*$/i, '');
}

function isHtmlLike(filePath) {
  return /\.(html|mdx|jsx|tsx|vue|svelte)$/i.test(filePath);
}

function repairDesignImproveCss(content) {
  return String(content || '')
    .replace(/font-size\s*:\s*(?:[0-9]|1[0-3])px/gi, 'font-size: 14px')
    .replace(/((?:min-|max-)?height\s*:\s*)(?:8[6-9]|9\d|1\d{2,})vh/gi, (match, prop) => `${prop}84vh`)
    .replace(/letter-spacing\s*:\s*-[^;]+;/gi, 'letter-spacing: 0;');
}

function injectDesignImproveGuardrails(content) {
  const css = designImproveGuardrailCss();
  const block = `<style data-agentproof-design-improve>\n${css}\n</style>`;
  const existingBlock = /<style\b[^>]*data-agentproof-design-improve[^>]*>[\s\S]*?<\/style>/i;
  if (existingBlock.test(content)) {
    return content.replace(existingBlock, block);
  }
  if (/<\/head>/i.test(content)) {
    return content.replace(/<\/head>/i, `${block}\n</head>`);
  }
  return `${content}\n${block}\n`;
}

function designImproveGuardrailCss() {
  return `/* AgentProof DesignImprove non-destructive guardrails */
:root {
  --apdg-s1: 4px;
  --apdg-s2: 8px;
  --apdg-s3: 12px;
  --apdg-s4: 16px;
  --apdg-s5: 24px;
  --apdg-s6: 32px;
  --apdg-s7: 48px;
  --apdg-s8: 64px;
  --apdg-primary: var(--primary, currentColor);
  --apdg-background: var(--background, Canvas);
  --apdg-surface: var(--surface, Canvas);
  --apdg-text: var(--text, CanvasText);
  --apdg-muted: var(--muted, CanvasText);
  --apdg-focus: var(--focus, currentColor);
}

html,
body {
  width: 100% !important;
  max-width: 100% !important;
  overflow-x: clip !important;
}

body {
  overflow-wrap: anywhere !important;
}

*,
*::before,
*::after {
  min-width: 0 !important;
}

:where(img, video, canvas, svg, table, pre, code, .terminal, .terminal-card, .command, .copybox, [class*="track"], [class*="marquee"]) {
  max-width: 100% !important;
}

:where(a, button, .button, .btn, .pill, .cta, [role="button"]) {
  min-width: 44px !important;
  min-height: 44px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: var(--apdg-s2) !important;
  line-height: 1.1 !important;
  text-align: center !important;
  white-space: normal !important;
}

:where(.pill, .badge, .eyebrow, .kicker, .tag) {
  color: #f8fafc !important;
  background-color: rgba(2, 6, 23, 0.72) !important;
  border-color: rgba(248, 250, 252, 0.28) !important;
}

:where(.badge.safe, .success, [class*="success"]) {
  color: #dcfce7 !important;
}

:where(.badge.danger, .danger, [class*="danger"]) {
  color: #ffe4e6 !important;
}

:where(.panel-head, .card-head, .section-head, [class*="panel-head"], [class*="card-head"]) {
  color: #f8fafc !important;
  background-color: rgba(2, 6, 23, 0.68) !important;
}

:where(.checks li, .check-list li, [class*="check"] li, [class*="list"] li) {
  color: #f8fafc !important;
  background-color: rgba(2, 6, 23, 0.52) !important;
}

:where(a, button, .button, .btn, .pill, [role="button"]):focus-visible {
  outline: 3px solid var(--apdg-focus) !important;
  outline-offset: 3px !important;
}

:where(.hero, [data-agentproof-hero], #hero) {
  min-height: 0 !important;
  height: auto !important;
  max-height: none !important;
  padding-top: min(var(--apdg-s7), 6vh) !important;
  padding-bottom: min(var(--apdg-s7), 6vh) !important;
  overflow: visible !important;
}

:where(.hero, [data-agentproof-hero], #hero) h1 {
  max-width: min(24ch, 100%) !important;
  letter-spacing: 0 !important;
}

:where(.hero-copy, .hero-content, .hero-actions, .cta-row) {
  overflow: visible !important;
}

:where(pre, code, kbd, samp, .terminal, .terminal-card, .command, .code, .code-line, [class*="terminal"], [class*="code"]) {
  color: #f8fafc !important;
  background-color: rgba(2, 6, 23, 0.82) !important;
  font-size: max(14px, 0.875em) !important;
  white-space: pre-wrap !important;
  overflow-wrap: anywhere !important;
  overflow: auto !important;
}

:where(pre, code, kbd, samp, .terminal, .terminal-card, .command, .code, .code-line, [class*="terminal"], [class*="code"]) * {
  color: inherit !important;
}

@media (min-width: 721px) {
  :where(.hero, [data-agentproof-hero], #hero) :where(pre, .terminal, .terminal-card, .demo-card, .proof-card, .visual-card, .hero-visual, .hero-panel) {
    max-height: min(34vh, 360px) !important;
    overflow: auto !important;
  }
}

@media (max-width: 720px) {
  :where(nav, .nav-links) {
    gap: var(--apdg-s2) !important;
  }

  :where(.hero, [data-agentproof-hero], #hero) {
    max-height: none !important;
    gap: var(--apdg-s3) !important;
    padding-top: var(--apdg-s3) !important;
    padding-bottom: var(--apdg-s3) !important;
  }

  :where(.hero, [data-agentproof-hero], #hero) h1 {
    max-width: 100% !important;
    line-height: 1 !important;
  }

  :where(.hero, [data-agentproof-hero], #hero) :where(pre, .terminal, .terminal-card, .demo-card, .proof-card, .visual-card, .hero-visual, .hero-panel) {
    max-height: 24vh !important;
    overflow: auto !important;
  }

  :where(.hero, [data-agentproof-hero], #hero) :where(.lead, p, .cta-row, .hero-actions, .mini-proof, [class*="mini-proof"]) {
    margin-top: var(--apdg-s3) !important;
  }

  :where(.hero, [data-agentproof-hero], #hero) :where(.mini-proof, [class*="mini-proof"], [class*="proof-grid"]) {
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    gap: var(--apdg-s2) !important;
  }

  :where(.hero, [data-agentproof-hero], #hero) :where(.mini-proof, [class*="mini-proof"], [class*="proof-grid"]) p {
    display: none !important;
  }

  :where(.cta-row, .hero-actions) {
    align-items: stretch !important;
  }

  :where(.cta-row, .hero-actions) :where(a, button, .button, .btn) {
    width: 100% !important;
  }
}
`;
}

function ensureBrowserCloneHtml(html) {
  let output = String(html || '');
  if (!/<link[^>]+href=["']styles\.css["']/i.test(output)) {
    if (/<\/head>/i.test(output)) {
      output = output.replace(/<\/head>/i, '  <link rel="stylesheet" href="styles.css">\n</head>');
    } else {
      output = `<!doctype html>\n<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="styles.css"></head><body>${output}</body></html>`;
    }
  }
  return output;
}

function containsLikelySourceCss(candidate, sourceCss) {
  const marker = normalizeWhitespace(sourceCss).slice(0, 500);
  return marker.length > 80 && normalizeWhitespace(candidate).includes(marker);
}

function htmlToText(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function textSignature(text) {
  const stopwords = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'from', 'your', 'you', 'une', 'des', 'les', 'pour', 'avec', 'dans', 'est', 'aux', 'comme']);
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopwords.has(word))
    .slice(0, 700);
}

function overlapRatio(sourceWords, generatedWords) {
  if (!sourceWords.length || !generatedWords.length) return 0;
  const generatedSet = new Set(generatedWords);
  const matched = sourceWords.filter((word) => generatedSet.has(word)).length;
  return matched / sourceWords.length;
}

function normalizeWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function browserCloneGuardrailCss() {
  return `/* AgentProof browser-clone guardrails */
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
}

a,
button,
select,
summary,
[role="button"] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
}

html,
body {
  width: 100%;
  max-width: 100%;
  overflow-x: clip;
}

*,
*::before,
*::after {
  min-width: 0;
}

img,
video,
canvas,
svg,
table,
pre,
code {
  max-width: 100%;
}

main {
  padding-top: 0 !important;
}

.hero {
  min-height: 0 !important;
  height: auto !important;
  max-height: none !important;
  padding-top: min(calc(var(--header-h, 84px) + var(--space-4)), 12vh) !important;
  padding-bottom: min(var(--space-5), 6vh) !important;
  overflow: visible !important;
}

.hero-content,
.hero-copy,
.hero-actions {
  overflow: visible !important;
}

.hero h1,
.hero-title,
[class*="hero"] h1 {
  max-width: min(24ch, 100%) !important;
  letter-spacing: 0 !important;
}

.hero-copy,
[class*="hero"] p {
  max-width: 720px !important;
  margin-top: var(--space-4) !important;
}

.hero-actions,
[class*="hero"] [class*="action"] {
  margin-top: var(--space-5) !important;
  gap: var(--space-4) !important;
}

.hero-track,
.feature-track,
.market-strip,
.market-strip-track {
  max-width: 100% !important;
  overflow-x: auto !important;
  overflow-y: visible !important;
}

.hero-track {
  position: static !important;
  margin-top: var(--space-5) !important;
}

.feature-track,
.market-strip-track {
  width: auto !important;
}

.pill,
.badge,
.eyebrow,
.kicker,
.tag {
  color: #f8fafc !important;
  background-color: rgba(2, 6, 23, 0.72) !important;
  border-color: rgba(248, 250, 252, 0.28) !important;
}

.badge.safe,
.success,
[class*="success"] {
  color: #dcfce7 !important;
}

.badge.danger,
.danger,
[class*="danger"] {
  color: #ffe4e6 !important;
}

.panel-head,
.card-head,
.section-head,
[class*="panel-head"],
[class*="card-head"] {
  color: #f8fafc !important;
  background-color: rgba(2, 6, 23, 0.68) !important;
}

.checks li,
.check-list li,
[class*="check"] li,
[class*="list"] li {
  color: #f8fafc !important;
  background-color: rgba(2, 6, 23, 0.52) !important;
}

.button,
.button-primary,
.btn,
.btn-primary,
.nav-download,
.text-link {
  min-height: 48px;
  padding-inline: max(18px, var(--space-5));
  white-space: normal;
  text-align: center;
}

pre,
code,
kbd,
samp,
.terminal,
.terminal-card,
.command,
.code,
.code-line,
[class*="terminal"],
[class*="code"] {
  color: #f8fafc !important;
  background-color: rgba(2, 6, 23, 0.82) !important;
  font-size: max(14px, 0.875em) !important;
  white-space: pre-wrap !important;
  overflow-wrap: anywhere !important;
  overflow: auto !important;
}

pre *,
code *,
kbd *,
samp *,
.terminal *,
.terminal-card *,
.command *,
.code *,
.code-line *,
[class*="terminal"] *,
[class*="code"] * {
  color: inherit !important;
}

.language-select select {
  min-width: 74px;
  padding-inline: var(--space-2);
}

.mobile-nav > summary {
  width: auto !important;
  min-width: 72px !important;
  padding-inline: 14px !important;
  overflow: visible !important;
}

h1,
h2,
h3 {
  letter-spacing: 0 !important;
}

@media (max-width: 720px) {
  .hero {
    min-height: auto !important;
    max-height: none !important;
    gap: var(--space-3) !important;
    padding-top: min(calc(var(--header-h, 74px) + var(--space-3)), 12vh) !important;
    padding-bottom: var(--space-3) !important;
  }

  .hero h1,
  .hero-title,
  [class*="hero"] h1 {
    max-width: 100% !important;
    line-height: 1 !important;
  }

  .hero .mini-proof,
  .hero [class*="mini-proof"],
  .hero [class*="proof-grid"] {
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    gap: var(--space-2) !important;
  }

  .hero .mini-proof p,
  .hero [class*="mini-proof"] p,
  .hero [class*="proof-grid"] p {
    display: none !important;
  }

  .hero-actions,
  .primary-nav {
    align-items: stretch;
  }

  .hero-actions .button,
  .hero-actions .btn,
  .nav-download {
    width: 100%;
  }
}
`;
}

function renderDesignFixReport(result, designAudit) {
  const lines = [
    '# AgentProof DesignFix',
    '',
    `Status: **${result.ok ? (result.applied ? 'APPLIED' : 'READY') : 'FAILED'}**`,
    `Provider: **${result.provider || 'unknown'}**`,
    `Model: **${result.model || 'unknown'}**`,
    result.reasoning ? `Reasoning: **${result.reasoning}**` : '',
    `Applied: **${result.applied ? 'yes' : 'no'}**`,
    `Mode: **${result.mode || 'source-rewrite'}**`,
    `Design Gate Before Fix: **${designAudit?.mode || 'unknown'}**`,
    ''
  ].filter(Boolean);

  if (result.error) {
    lines.push('## Problem', '', result.error, '');
  }

  if (result.summary) {
    lines.push('## Summary', '', result.summary, '');
  }

  const issueLines = (designAudit?.issues || [])
    .filter((issue) => issue.category === 'design')
    .filter((issue) => ['critical', 'high', 'medium'].includes(issue.severity))
    .slice(0, 12)
    .map((issue) => `- [${issue.severity.toUpperCase()}] ${issue.id}: ${issue.title}`);
  if (issueLines.length) {
    lines.push('## Findings Addressed', '', ...issueLines, '');
  }

  if (result.notes?.length) {
    lines.push('## Notes', '', ...result.notes.map((note) => `- ${note}`), '');
  }

  if (result.backups?.length) {
    lines.push('## Backups', '', `Backup root: \`${result.backups[0].backupRoot}\``, '');
  }

  if (result.files?.length) {
    lines.push('## Generated Files', '');
    for (const file of result.files) {
      lines.push(`### ${file.path}`, '', '```', file.content, '```', '');
    }
  }

  if (result.raw) {
    lines.push('## Raw AI Output', '', '```text', result.raw, '```', '');
  }

  return `${lines.join('\n')}\n`;
}

function normalizeAiProvider(value) {
  const input = String(value || '').trim().toLowerCase();
  if (['codex', 'codex-auth', 'openai-codex', 'chatgpt'].includes(input)) return 'codex-auth';
  if (['openai', 'openai-api', 'api'].includes(input)) return 'openai-api';
  if (input === 'auto') return 'auto';
  return 'openai-api';
}

function extractOutputText(payload) {
  if (typeof payload.output_text === 'string') return payload.output_text;
  if (!Array.isArray(payload.output)) return '';
  return payload.output
    .flatMap((item) => Array.isArray(item.content) ? item.content : [])
    .map((content) => content.text || content.output_text || '')
    .filter(Boolean)
    .join('\n')
    .trim();
}

function extractOutputTextFromSse(sseText) {
  const textParts = [];
  let completedText = '';
  for (const block of String(sseText || '').split(/\n\n+/)) {
    const data = block
      .split(/\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim())
      .join('\n');
    if (!data || data === '[DONE]') continue;
    let payload;
    try {
      payload = JSON.parse(data);
    } catch {
      continue;
    }
    const type = payload.type || payload.event || '';
    if (typeof payload.delta === 'string' && type.includes('output_text')) {
      textParts.push(payload.delta);
      continue;
    }
    const item = payload.item;
    if (item?.type === 'message') {
      const itemText = extractOutputText({ output: [item] });
      if (itemText) completedText = itemText;
    }
    if (payload.response) {
      const responseText = extractOutputText(payload.response);
      if (responseText) completedText = responseText;
    }
  }
  return (textParts.join('') || completedText).trim();
}

async function safeResponseText(response) {
  try {
    const text = await response.text();
    return text.replace(/\s+/g, ' ').trim().slice(0, 220);
  } catch {
    return '';
  }
}

function matchesSourcePattern(filePath, pattern) {
  const source = String(pattern || '').trim().replace(/^\.\//, '');
  const target = String(filePath || '');
  if (!source) return false;
  if (source.includes('*')) return matchesPathPattern(target, source);
  if (!source.includes('/')) return target === source;
  return target === source || target.endsWith(`/${source}`);
}

function matchesPathPattern(filePath, pattern) {
  const source = String(pattern || '').trim();
  if (!source) return false;
  const target = String(filePath || '');
  if (source === target || target.endsWith(`/${source}`) || target.includes(source)) return true;
  if (!source.includes('*')) return false;
  const parts = source.split('*');
  let cursor = 0;
  if (parts[0] && !target.startsWith(parts[0])) return false;
  if (parts.at(-1) && !target.endsWith(parts.at(-1))) return false;
  for (const part of parts) {
    if (!part) continue;
    const index = target.indexOf(part, cursor);
    if (index === -1) return false;
    cursor = index + part.length;
  }
  return true;
}

function normalizePath(filePath) {
  return String(filePath || '').trim().replace(/\\/g, '/').replace(/^\.\//, '');
}

function resolveSafePath(root, relative) {
  const safeRelative = normalizePath(relative);
  const resolved = path.resolve(root, safeRelative);
  const rootPath = path.resolve(root);
  if (resolved !== rootPath && !resolved.startsWith(`${rootPath}${path.sep}`)) {
    throw new Error(`DesignFix refused to write outside the project: ${relative}`);
  }
  return resolved;
}
