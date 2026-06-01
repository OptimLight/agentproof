#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const node = process.execPath;
const cli = path.join(root, 'bin', 'agentproof.mjs');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agentproof-release-'));

const checks = [
  command('help', ['--help']),
  command('version', ['--version']),
  command('policy packs', ['--policy-packs']),
  command('recipes', ['--recipes']),
  command('troubleshooting', ['--troubleshoot']),
  command('faq', ['--faq']),
  command('claim template', ['--claim-template']),
  command('rules', ['--rules', 'markdown']),
  command('rule explanation', ['--explain', 'security.secret-pattern']),
  command('doctor', ['--doctor', '--path', '.']),
  command('bad fixture blocks', [
    '--path', 'examples/bad-agent-pr',
    '--profile', 'strict',
    '--no-run-scripts',
    '--claim', '../agent-claim.md',
    '--output', artifact('bad-report.md'),
    '--html', artifact('bad-report.html'),
    '--sarif', artifact('bad.sarif'),
    '--badge', artifact('bad-badge.svg'),
    '--pr-comment', artifact('bad-pr-comment.md'),
    '--receipt', artifact('bad-receipt.json'),
    '--summary', artifact('bad-summary.json'),
    '--fail-under', '80'
  ], { expectExit: 1 }),
  command('bad fixture observe-only exits zero', [
    '--path', 'examples/bad-agent-pr',
    '--profile', 'strict',
    '--no-run-scripts',
    '--claim', '../agent-claim.md',
    '--output', artifact('observe-report.md'),
    '--fail-under', '80',
    '--observe-only'
  ]),
  githubAnnotationsCheck(),
  command('bad receipt verifies as failed', ['--verify-receipt', artifact('bad-receipt.json')], { expectExit: 1 }),
  command('good fixture passes static gate', [
    '--path', 'examples/good-agent-pr',
    '--no-run-scripts',
    '--claim', '../good-agent-claim.md',
    '--output', artifact('good-report.md'),
    '--summary', artifact('good-summary.json'),
    '--fail-under', '50'
  ]),
  command('bad SaaS design fixture blocks', [
    '--path', 'examples/design-bad-saas',
    '--design', 'saas',
    '--profile', 'strict',
    '--no-run-scripts',
    '--output', artifact('design-bad-saas-report.md'),
    '--summary', artifact('design-bad-saas-summary.json'),
    '--fail-under', '85'
  ], { expectExit: 1 }),
  command('good SaaS design fixture passes', [
    '--path', 'examples/design-good-saas',
    '--design', 'saas',
    '--profile', 'strict',
    '--no-run-scripts',
    '--output', artifact('design-good-saas-report.md'),
    '--summary', artifact('design-good-saas-summary.json'),
    '--fail-under', '85'
  ]),
  command('design-only good SaaS fixture passes', [
    '--path', 'examples/design-good-saas',
    '--design-only',
    '--design', 'saas',
    '--profile', 'strict',
    '--output', artifact('design-only-good-saas-report.md'),
    '--summary', artifact('design-only-good-saas-summary.json'),
    '--fail-under', '85'
  ]),
  command('bad marketplace design fixture blocks', [
    '--path', 'examples/design-bad-marketplace',
    '--design', 'marketplace',
    '--profile', 'strict',
    '--no-run-scripts',
    '--output', artifact('design-bad-marketplace-report.md'),
    '--fail-under', '85'
  ], { expectExit: 1 }),
  command('design ai without key is non-blocking', [
    '--path', 'examples/design-good-saas',
    '--design', 'saas',
    '--design-ai',
    '--profile', 'strict',
    '--no-run-scripts',
    '--output', artifact('design-ai-no-key-report.md'),
    '--fail-under', '85'
  ]),
  command('monorepo fixture blocks', [
    '--path', 'examples/monorepo-agent-pr',
    '--profile', 'strict',
    '--claim', 'agent-claim.md',
    '--output', artifact('monorepo-report.md'),
    '--receipt', artifact('monorepo-receipt.json'),
    '--summary', artifact('monorepo-summary.json'),
    '--fail-under', '85'
  ], { expectExit: 1 }),
  communityScaffoldCheck(),
  packageManifestCheck(),
  initAllCheck()
];

let failures = 0;
for (const check of checks) {
  const result = check.run();
  const ok = result.ok;
  const status = ok ? 'PASS' : 'FAIL';
  console.log(`${status} ${check.name}`);
  if (!ok) {
    failures += 1;
    if (result.detail) console.log(indent(result.detail));
  }
}

console.log('');
console.log(`Artifacts: ${tempRoot}`);

if (failures > 0) {
  console.error(`Release validation failed: ${failures} check(s) failed.`);
  process.exit(1);
}

console.log('Release validation passed.');

function command(name, args, options = {}) {
  return {
    name,
    run() {
      const child = spawnSync(node, [cli, ...args], {
        cwd: root,
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 4
      });
      const expected = options.expectExit ?? 0;
      const actual = child.status ?? 1;
      return {
        ok: actual === expected,
        detail: actual === expected ? '' : [
          `expected exit ${expected}, got ${actual}`,
          trimOutput(child.stdout),
          trimOutput(child.stderr)
        ].filter(Boolean).join('\n')
      };
    }
  };
}

function packageManifestCheck() {
  return {
    name: 'package manifest includes release assets',
    run() {
      const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
      const files = Array.isArray(manifest.files) ? manifest.files : [];
      const required = ['bin', 'src', 'scripts', 'examples', 'templates', 'docs', 'schemas', 'action.yml', 'README.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md', 'GOVERNANCE.md', 'LIMITATIONS.md', 'PRIVACY.md', 'SUPPORT.md', 'SECURITY.md', 'LICENSE'];
      const missing = required.filter((entry) => !files.includes(entry));
      return {
        ok: missing.length === 0,
        detail: missing.length ? `package.json files is missing: ${missing.join(', ')}` : ''
      };
    }
  };
}

function communityScaffoldCheck() {
  return {
    name: 'community scaffold exists',
    run() {
      const required = [
        '.github/labels.yml',
        'SUPPORT.md',
        'CODE_OF_CONDUCT.md',
        'GOVERNANCE.md',
        'PRIVACY.md',
        'LIMITATIONS.md',
        'docs/GITHUB_LABELS.md',
        'docs/MAINTAINER_TRIAGE.md'
      ];
      const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
      return {
        ok: missing.length === 0,
        detail: missing.length ? `missing community files: ${missing.join(', ')}` : ''
      };
    }
  };
}

function initAllCheck() {
  return {
    name: 'init all scaffolds starter files',
    run() {
      const target = fs.mkdtempSync(path.join(tempRoot, 'init-all-'));
      const child = spawnSync(node, [cli, '--path', target, '--init', '--all'], {
        cwd: root,
        encoding: 'utf8',
        maxBuffer: 1024 * 1024
      });
      if ((child.status ?? 1) !== 0) {
        return { ok: false, detail: trimOutput(`${child.stdout}\n${child.stderr}`) };
      }

      const required = [
        'agentproof.config.json',
        '.github/workflows/agentproof.yml',
        '.agentproof/AGENT_CONTRACT.md',
        'AGENTS.md',
        'CLAUDE.md',
        '.cursor/rules/agentproof.mdc',
        '.github/copilot-instructions.md',
        '.opencode/agentproof.md'
      ];
      const missing = required.filter((file) => !fs.existsSync(path.join(target, file)));
      const workflowPath = path.join(target, '.github/workflows/agentproof.yml');
      const workflow = fs.existsSync(workflowPath) ? fs.readFileSync(workflowPath, 'utf8') : '';
      const missingWorkflowHints = [
        ['github-annotations: "true"', 'generated workflow should enable GitHub annotations explicitly'],
        ['fetch-depth: 0', 'generated workflow should fetch enough history for changed-file scans']
      ].filter(([text]) => !workflow.includes(text)).map(([, message]) => message);
      return {
        ok: missing.length === 0 && missingWorkflowHints.length === 0,
        detail: [
          missing.length ? `missing files: ${missing.join(', ')}` : '',
          missingWorkflowHints.length ? `workflow issues: ${missingWorkflowHints.join(', ')}` : ''
        ].filter(Boolean).join('\n')
      };
    }
  };
}

function githubAnnotationsCheck() {
  return {
    name: 'github annotations keep json stdout parseable',
    run() {
      const child = spawnSync(node, [cli,
        '--path', 'examples/bad-agent-pr',
        '--profile', 'strict',
        '--no-run-scripts',
        '--claim', '../agent-claim.md',
        '--output', artifact('annotations-report.md'),
        '--github-annotations',
        '--observe-only',
        '--json'
      ], {
        cwd: root,
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 4
      });

      const actual = child.status ?? 1;
      if (actual !== 0) {
        return {
          ok: false,
          detail: [
            `expected exit 0, got ${actual}`,
            trimOutput(child.stdout),
            trimOutput(child.stderr)
          ].filter(Boolean).join('\n')
        };
      }

      try {
        JSON.parse(child.stdout);
      } catch (error) {
        return {
          ok: false,
          detail: [
            `stdout was not valid JSON: ${error.message}`,
            trimOutput(child.stdout),
            trimOutput(child.stderr)
          ].filter(Boolean).join('\n')
        };
      }

      const hasAnnotation = child.stderr.includes('::error') || child.stderr.includes('::warning') || child.stderr.includes('::notice');
      return {
        ok: hasAnnotation,
        detail: hasAnnotation ? '' : [
          'expected GitHub annotation commands on stderr',
          trimOutput(child.stderr)
        ].filter(Boolean).join('\n')
      };
    }
  };
}

function artifact(name) {
  return path.join(tempRoot, name);
}

function trimOutput(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.split('\n').slice(-24).join('\n');
}

function indent(value) {
  return String(value).split('\n').map((line) => `  ${line}`).join('\n');
}
