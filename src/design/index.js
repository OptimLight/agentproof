import { resolveDesignConfig } from './profiles.js';
import { runBrowserDesignAudit } from './browser.js';
import { runStaticDesignAudit, designIssue } from './static.js';
import { runAiDesignReview } from './ai-review.js';

export async function runDesignGuard(root, textFiles, config, options, env = process.env) {
  const designConfig = resolveDesignConfig(config, options);
  if (!designConfig.enabled) {
    return {
      enabled: false,
      config: designConfig,
      mode: 'disabled',
      issues: [],
      screenshots: [],
      measurements: []
    };
  }

  const browserAudit = await runBrowserDesignAudit(root, designConfig);
  const designTextFiles = filterDesignTextFiles(textFiles, designConfig);
  const staticIssues = runStaticDesignAudit(root, designTextFiles, designConfig, browserAudit);
  const aiIssues = await runAiDesignReview(designConfig, browserAudit, [...browserAudit.issues, ...staticIssues], env);
  const issues = [
    ...browserAudit.issues,
    ...staticIssues,
    ...aiIssues
  ];

  return {
    enabled: true,
    config: designConfig,
    mode: browserAudit.mode === 'browser' ? 'browser+static' : 'static',
    issues,
    screenshots: browserAudit.screenshots || [],
    measurements: browserAudit.measurements || [],
    routes: designConfig.routes,
    viewports: designConfig.viewports
  };
}

function filterDesignTextFiles(textFiles, designConfig) {
  return textFiles.filter((file) => {
    const relative = file.relative || '';
    if (designConfig.ignore.some((pattern) => matchesPathPattern(relative, pattern))) return false;
    if (!designConfig.source?.length) return true;
    return designConfig.source.some((pattern) => matchesSourcePattern(relative, pattern));
  });
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

export function designNotConfiguredIssue() {
  return designIssue({
    id: 'design.config.disabled',
    severity: 'info',
    title: 'DesignGuard is disabled',
    detail: 'Run with --design <type> or set design.enabled=true in agentproof.config.json.',
    suggestion: 'For MVP delivery, use --design saas|landing|dashboard|marketplace|ecommerce|webapp|mobile-app with --design-url.',
    why: 'Technical proof alone cannot prove the interface is client-ready.'
  });
}
