import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { redactText } from './redact.js';

export function runProjectCommands(root, options) {
  if (!options.runScripts) {
    return [{ name: 'project scripts', status: 'skipped', command: 'disabled by --no-run-scripts', language: 'all' }];
  }

  const commands = detectVerificationCommands(root, options.config || {});
  if (commands.length === 0) {
    return [{ name: 'verification', status: 'missing', command: 'no supported verification command found', language: 'unknown' }];
  }

  return commands.map((entry) => runCommand(root, entry, options.timeoutMs));
}

export function commandResultsToIssues(results) {
  const issues = [];

  for (const result of results) {
    if (result.status === 'failed') {
      issues.push({
        id: `verification.${result.name}.failed`,
        category: 'verification',
        severity: result.optional ? 'info' : (result.severity || severityForFailedCommand(result.name)),
        title: `${result.label || result.name} command failed`,
        detail: redactText(result.output || result.command),
        suggestion: result.optional
          ? `Optional command failed: \`${redactText(result.command)}\`. Fix it or mark why it can remain optional.`
          : `Run \`${redactText(result.command)}\` locally, fix the failure, then rerun AgentProof.`
      });
    }

    if (result.status === 'missing') {
      issues.push({
        id: 'verification.no-supported-commands',
        category: 'verification',
        severity: 'medium',
        title: 'No supported verification commands found',
        detail: 'AgentProof could not find package scripts, pytest, go, cargo, or another supported local verification path.',
        suggestion: 'Add at least one fast command that proves the project still works, or configure custom commands in agentproof.config.json.'
      });
    }
  }

  return issues;
}

export function detectVerificationCommands(root, config = {}) {
  return [
    ...detectCustomCommands(config),
    ...detectJavaScriptCommands(root, config),
    ...detectPythonCommands(root),
    ...detectGoCommands(root),
    ...detectRustCommands(root)
  ];
}

function detectCustomCommands(config) {
  const commands = Array.isArray(config.commands) ? config.commands : [];
  return commands
    .filter((entry) => entry && typeof entry.command === 'string' && entry.command.trim())
    .map((entry, index) => ({
      name: sanitizeName(entry.name || `custom-${index + 1}`),
      label: entry.label || entry.name || `custom ${index + 1}`,
      command: entry.command,
      language: entry.language || 'custom',
      severity: normalizeSeverity(entry.severity),
      optional: Boolean(entry.optional)
    }));
}

function detectJavaScriptCommands(root, config = {}) {
  const packageDirs = detectJavaScriptPackageDirs(root, config);
  const manager = detectPackageManager(root);

  return packageDirs.flatMap((packageDir) => {
    const packagePath = path.join(root, packageDir, 'package.json');
    if (!fs.existsSync(packagePath)) return [];

    let pkg;
    try {
      pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    } catch {
      const scope = packageDir || 'root';
      return [{
        name: scopedCommandName(scope, 'package-json'),
        label: packageDir ? `${packageDir} package.json` : 'package.json',
        command: 'read package.json',
        cwd: packageDir || '',
        language: 'javascript',
        syntheticFailure: 'Invalid package.json',
        severity: 'high'
      }];
    }

    const scripts = pkg.scripts || {};
    const scope = packageDir ? sanitizeName(packageDir) : '';
    return ['typecheck', 'lint', 'test', 'build']
      .filter((name) => scripts[name])
      .map((name) => ({
        name: scope ? `${scope}-${name}` : name,
        kind: name,
        label: packageDir ? `${packageDir} ${name}` : name,
        command: manager === 'npm' ? `npm run ${name}` : `${manager} run ${name}`,
        cwd: packageDir || '',
        language: 'javascript'
      }));
  });
}

function detectPythonCommands(root) {
  const hasPythonProject = existsAny(root, ['pyproject.toml', 'setup.py', 'setup.cfg', 'requirements.txt', 'pytest.ini']);
  if (!hasPythonProject) return [];

  const commands = [];
  if (hasDirectory(root, 'tests') || existsAny(root, ['pytest.ini'])) {
    commands.push({ name: 'python-test', label: 'python tests', command: 'python -m pytest', language: 'python' });
  }
  commands.push({ name: 'python-compile', label: 'python compile', command: 'python -m compileall .', language: 'python' });
  return commands;
}

function detectGoCommands(root) {
  if (!fs.existsSync(path.join(root, 'go.mod'))) return [];
  return [
    { name: 'go-test', label: 'go test', command: 'go test ./...', language: 'go' },
    { name: 'go-vet', label: 'go vet', command: 'go vet ./...', language: 'go' }
  ];
}

function detectRustCommands(root) {
  if (!fs.existsSync(path.join(root, 'Cargo.toml'))) return [];
  return [
    { name: 'cargo-check', label: 'cargo check', command: 'cargo check --all-targets', language: 'rust' },
    { name: 'cargo-test', label: 'cargo test', command: 'cargo test --all', language: 'rust' }
  ];
}

function runCommand(root, entry, timeoutMs) {
  const started = Date.now();
  const cwd = entry.cwd ? path.join(root, entry.cwd) : root;

  if (entry.syntheticFailure) {
    return {
      ...entry,
      status: 'failed',
      durationMs: 0,
      output: entry.syntheticFailure
    };
  }

  const child = spawnSync(entry.command, {
    cwd,
    shell: true,
    encoding: 'utf8',
    timeout: timeoutMs,
    maxBuffer: 1024 * 1024
  });

  const output = `${child.stdout || ''}\n${child.stderr || ''}`.trim();
  const status = child.error || child.status !== 0 ? 'failed' : 'passed';

  return {
    ...entry,
    status,
    durationMs: Date.now() - started,
    command: redactText(entry.command),
    output: redactText(tail(output, 28))
  };
}

function severityForFailedCommand(name) {
  if (name.includes('test') || name.includes('build') || name === 'cargo-check' || name === 'go-test') return 'critical';
  if (name.includes('typecheck') || name.includes('lint') || name.includes('vet') || name.includes('compile')) return 'high';
  return 'medium';
}

function normalizeSeverity(value) {
  return ['critical', 'high', 'medium', 'low', 'info'].includes(value) ? value : undefined;
}

function sanitizeName(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'custom';
}

function detectPackageManager(root) {
  if (fs.existsSync(path.join(root, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(root, 'yarn.lock'))) return 'yarn';
  if (fs.existsSync(path.join(root, 'bun.lockb')) || fs.existsSync(path.join(root, 'bun.lock'))) return 'bun';
  return 'npm';
}

function detectJavaScriptPackageDirs(root, config = {}) {
  const dirs = new Set(['']);
  const configured = Array.isArray(config.packages) ? config.packages : [];
  for (const entry of configured) addPackagePattern(root, dirs, entry);

  const rootPackage = readPackageJson(path.join(root, 'package.json'));
  const workspaces = workspacePatterns(rootPackage);
  for (const pattern of workspaces) addPackagePattern(root, dirs, pattern);

  return [...dirs].filter((dir) => fs.existsSync(path.join(root, dir, 'package.json')));
}

function workspacePatterns(pkg) {
  if (!pkg) return [];
  if (Array.isArray(pkg.workspaces)) return pkg.workspaces;
  if (pkg.workspaces && Array.isArray(pkg.workspaces.packages)) return pkg.workspaces.packages;
  return [];
}

function addPackagePattern(root, dirs, input) {
  const pattern = normalizePackagePattern(input);
  if (!pattern || pattern === '.') return;

  if (!pattern.includes('*')) {
    dirs.add(pattern);
    return;
  }

  const starIndex = pattern.indexOf('*');
  const prefix = pattern.slice(0, starIndex).replace(/\/+$/, '');
  const baseDir = path.join(root, prefix);
  if (!fs.existsSync(baseDir) || !fs.statSync(baseDir).isDirectory()) return;

  let entries = [];
  try {
    entries = fs.readdirSync(baseDir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === 'node_modules') continue;
    const relative = path.join(prefix, entry.name).split(path.sep).join('/');
    if (fs.existsSync(path.join(root, relative, 'package.json'))) dirs.add(relative);
  }
}

function normalizePackagePattern(input) {
  return String(input || '').trim().replace(/^\.\/+/, '').replace(/\/+$/, '');
}

function readPackageJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function scopedCommandName(scope, name) {
  return scope === 'root' ? name : `${sanitizeName(scope)}-${name}`;
}

function existsAny(root, names) {
  return names.some((name) => fs.existsSync(path.join(root, name)));
}

function hasDirectory(root, name) {
  const fullPath = path.join(root, name);
  return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
}

function tail(text, lines) {
  if (!text) return '';
  return text.split('\n').slice(-lines).join('\n');
}
