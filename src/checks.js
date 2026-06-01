import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { DEFAULT_SLOP_PHRASES, UI_EXTENSIONS } from './constants.js';
import { redactText } from './redact.js';

function issue(fields) {
  return {
    id: fields.id,
    category: fields.category,
    severity: fields.severity,
    title: fields.title,
    file: fields.file || null,
    line: fields.line || null,
    detail: redactText(fields.detail || ''),
    suggestion: redactText(fields.suggestion || '')
  };
}

function lineOf(content, index) {
  return content.slice(0, Math.max(0, index)).split('\n').length;
}

function addRegexIssue(issues, textFile, regex, fields, limit = 8) {
  let match;
  let count = 0;
  regex.lastIndex = 0;
  while ((match = regex.exec(textFile.content)) && count < limit) {
    issues.push(issue({
      ...fields,
      file: textFile.relative,
      line: lineOf(textFile.content, match.index),
      detail: redactText(fields.detail || `Matched: ${String(match[0]).slice(0, 120)}`)
    }));
    count += 1;
  }
}

export function runStaticChecks(root, textFiles, configResult) {
  const config = configResult.config || {};
  const issues = [];
  if (configResult.issue) issues.push(configResult.issue);

  const slopPhrases = [...new Set([...(config.slopPhrases || []), ...DEFAULT_SLOP_PHRASES])];

  for (const textFile of textFiles) {
    if (textFile.skipped) continue;
    const ext = path.extname(textFile.relative).toLowerCase();
    const lower = textFile.content.toLowerCase();

    if (/\.env($|\.)/.test(path.basename(textFile.relative)) && !textFile.relative.endsWith('.example')) {
      issues.push(issue({
        id: 'security.env-committed',
        category: 'security',
        severity: 'high',
        title: 'Environment file appears to be committed',
        file: textFile.relative,
        line: 1,
        detail: 'Committed .env files often contain private credentials.',
        suggestion: 'Move secrets to your deployment environment and keep only .env.example in git.'
      }));
    }

    addRegexIssue(issues, textFile, /(AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{20,}|sk-[A-Za-z0-9_-]{24,})/g, {
      id: 'security.secret-pattern',
      category: 'security',
      severity: 'critical',
      title: 'Possible secret or API token committed',
      detail: 'A token-shaped string was found in source.',
      suggestion: 'Rotate the secret, remove it from history, and load it from environment variables.'
    }, 4);

    addRegexIssue(issues, textFile, /(?:api[_-]?key|secret|token|password)\s*[:=]\s*['\"][^'\"]{12,}['\"]/gi, {
      id: 'security.hardcoded-credential',
      category: 'security',
      severity: 'high',
      title: 'Hardcoded credential-like value',
      suggestion: 'Use environment variables or a secret manager instead of literals.'
    }, 6);

    addRegexIssue(issues, textFile, /\b(eval|Function)\s*\(/g, {
      id: 'security.dynamic-code-execution',
      category: 'security',
      severity: 'high',
      title: 'Dynamic code execution detected',
      suggestion: 'Replace eval/new Function with a safe parser or explicit command map.'
    }, 8);

    addRegexIssue(issues, textFile, /dangerouslySetInnerHTML|\.innerHTML\s*=/g, {
      id: 'security.unsafe-html',
      category: 'security',
      severity: 'medium',
      title: 'Unsafe HTML injection surface',
      suggestion: 'Sanitize content and prefer safe rendering primitives.'
    }, 8);

    if (/\bdebugger\b/.test(textFile.content)) {
      addRegexIssue(issues, textFile, /\bdebugger\b/g, {
        id: 'hygiene.debugger',
        category: 'hygiene',
        severity: 'medium',
        title: 'Debugger statement left in code',
        suggestion: 'Remove debugger statements before shipping.'
      }, 8);
    }

    if (/console\.(log|debug|trace)\s*\(/.test(textFile.content) && !textFile.relative.includes('examples/')) {
      addRegexIssue(issues, textFile, /console\.(log|debug|trace)\s*\(/g, {
        id: 'hygiene.console-log',
        category: 'hygiene',
        severity: 'low',
        title: 'Console debugging left in code',
        suggestion: 'Remove noisy logs or route them through a structured logger.'
      }, 8);
    }

    for (const phrase of slopPhrases) {
      const phraseLower = String(phrase).toLowerCase();
      const index = lower.indexOf(phraseLower);
      if (index !== -1 && !textFile.relative.includes('node_modules')) {
        issues.push(issue({
          id: 'slop.generic-copy',
          category: 'slop',
          severity: phraseLower === 'todo' || phraseLower === 'fixme' ? 'medium' : 'low',
          title: `Generic or unfinished AI copy: "${phrase}"`,
          file: textFile.relative,
          line: lineOf(textFile.content, index),
          detail: 'This wording often signals unfinished agent output or template copy.',
          suggestion: 'Replace with specific product language, real proof, or a tracked issue.'
        }));
      }
    }

    if (UI_EXTENSIONS.has(ext)) {
      addRegexIssue(issues, textFile, /<img\b(?![^>]*\balt=)[^>]*>/gi, {
        id: 'ui.image-missing-alt',
        category: 'ui',
        severity: 'medium',
        title: 'Image missing alt text',
        suggestion: 'Add useful alt text or alt="" for decorative images.'
      }, 10);

      addRegexIssue(issues, textFile, /<a\b[^>]*href=['\"]#['\"][^>]*>/gi, {
        id: 'ui.dead-link',
        category: 'ui',
        severity: 'low',
        title: 'Placeholder link href="#"',
        suggestion: 'Use a real route, button, or remove the link until it works.'
      }, 10);

      addRegexIssue(issues, textFile, /<button\b[^>]*>\s*(?:<[^>]+>\s*)*<\/button>/gi, {
        id: 'ui.empty-button',
        category: 'ui',
        severity: 'medium',
        title: 'Button has no accessible label',
        suggestion: 'Add visible text or aria-label for icon-only buttons.'
      }, 10);
    }
  }

  runDocumentationChecks(root, issues);
  return issues;
}

function runDocumentationChecks(root, issues) {
  const readmePath = path.join(root, 'README.md');
  const licensePath = path.join(root, 'LICENSE');
  const packagePath = path.join(root, 'package.json');

  if (!fs.existsSync(readmePath)) {
    issues.push(issue({
      id: 'docs.missing-readme',
      category: 'docs',
      severity: 'high',
      title: 'README.md is missing',
      detail: 'A public repo needs a clear promise, install path, usage example, and contribution path.',
      suggestion: 'Add README.md before launch.'
    }));
  } else {
    const readme = fs.readFileSync(readmePath, 'utf8');
    if (!/(install|quick start|usage|get started)/i.test(readme)) {
      issues.push(issue({
        id: 'docs.readme-no-usage',
        category: 'docs',
        severity: 'medium',
        title: 'README lacks install or usage instructions',
        file: 'README.md',
        line: 1,
        detail: 'Developers star tools they understand in under 30 seconds.',
        suggestion: 'Add a Quick Start with one copy-paste command.'
      }));
    }
  }

  if (!fs.existsSync(licensePath)) {
    issues.push(issue({
      id: 'docs.missing-license',
      category: 'docs',
      severity: 'low',
      title: 'LICENSE file is missing',
      suggestion: 'Add a permissive license if this is meant for open-source adoption.'
    }));
  }

  if (fs.existsSync(packagePath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      if (!pkg.description || pkg.description.length < 20) {
        issues.push(issue({
          id: 'docs.weak-package-description',
          category: 'docs',
          severity: 'low',
          title: 'package.json description is weak',
          file: 'package.json',
          line: 1,
          suggestion: 'Make the package promise clear in one sentence.'
        }));
      }
    } catch {
      issues.push(issue({
        id: 'config.package-json-invalid',
        category: 'config',
        severity: 'high',
        title: 'package.json is invalid JSON',
        file: 'package.json',
        line: 1,
        suggestion: 'Fix package.json before publishing or installing.'
      }));
    }
  }
}

export function runProjectCommands(root, options) {
  if (!options.runScripts) {
    return [{ name: 'project scripts', status: 'skipped', command: 'disabled by --no-run-scripts' }];
  }

  const packagePath = path.join(root, 'package.json');
  if (!fs.existsSync(packagePath)) {
    return [{ name: 'package scripts', status: 'skipped', command: 'no package.json found' }];
  }

  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  } catch {
    return [{ name: 'package scripts', status: 'failed', command: 'read package.json', output: 'Invalid package.json' }];
  }

  const scripts = pkg.scripts || {};
  const commands = ['typecheck', 'lint', 'test', 'build'].filter((name) => scripts[name]);
  if (commands.length === 0) {
    return [{ name: 'verification scripts', status: 'missing', command: 'typecheck/lint/test/build' }];
  }

  const manager = detectPackageManager(root);
  return commands.map((name) => {
    const command = manager === 'npm' ? `npm run ${name}` : `${manager} run ${name}`;
    const started = Date.now();
    const child = spawnSync(command, {
      cwd: root,
      shell: true,
      encoding: 'utf8',
      timeout: options.timeoutMs,
      maxBuffer: 1024 * 1024
    });

    const output = `${child.stdout || ''}\n${child.stderr || ''}`.trim();
    const status = child.error || child.status !== 0 ? 'failed' : 'passed';
    return {
      name,
      status,
      command,
      durationMs: Date.now() - started,
      output: redactText(tail(output, 24))
    };
  });
}

export function commandResultsToIssues(results) {
  const issues = [];
  for (const result of results) {
    if (result.status === 'failed') {
      issues.push(issue({
        id: `verification.${result.name}.failed`,
        category: 'verification',
        severity: result.name === 'build' || result.name === 'test' ? 'critical' : 'high',
        title: `${result.name} command failed`,
        detail: result.output || result.command,
        suggestion: `Run \`${result.command}\` locally, fix the failure, then rerun AgentProof.`
      }));
    }

    if (result.status === 'missing') {
      issues.push(issue({
        id: 'verification.no-standard-scripts',
        category: 'verification',
        severity: 'medium',
        title: 'No standard verification scripts found',
        detail: 'Missing typecheck, lint, test, and build scripts in package.json.',
        suggestion: 'Add at least one fast verification command before trusting agent-generated changes.'
      }));
    }
  }
  return issues;
}

function detectPackageManager(root) {
  if (fs.existsSync(path.join(root, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(root, 'yarn.lock'))) return 'yarn';
  if (fs.existsSync(path.join(root, 'bun.lockb')) || fs.existsSync(path.join(root, 'bun.lock'))) return 'bun';
  return 'npm';
}

function tail(text, lines) {
  if (!text) return '';
  return text.split('\n').slice(-lines).join('\n');
}
