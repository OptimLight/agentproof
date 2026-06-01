import fs from 'node:fs';
import path from 'node:path';

export function loadBaseline(root, baselineInput) {
  if (!baselineInput) return null;

  const baselinePath = path.resolve(root, baselineInput);
  if (!fs.existsSync(baselinePath)) {
    return {
      path: baselinePath,
      exists: false,
      fingerprints: new Set(),
      entries: [],
      issue: {
        id: 'baseline.missing',
        category: 'baseline',
        severity: 'low',
        title: 'Baseline file does not exist yet',
        file: path.relative(root, baselinePath).split(path.sep).join('/'),
        line: 1,
        detail: 'AgentProof will treat all findings as new until a baseline file is created.',
        suggestion: 'Run with --update-baseline to capture known debt intentionally.'
      }
    };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    const entries = Array.isArray(parsed.findings) ? parsed.findings : [];
    return {
      path: baselinePath,
      exists: true,
      fingerprints: new Set(entries.map((entry) => entry.fingerprint).filter(Boolean)),
      entries,
      issue: null
    };
  } catch (error) {
    return {
      path: baselinePath,
      exists: true,
      fingerprints: new Set(),
      entries: [],
      issue: {
        id: 'baseline.invalid-json',
        category: 'baseline',
        severity: 'high',
        title: 'Baseline file is invalid JSON',
        file: path.relative(root, baselinePath).split(path.sep).join('/'),
        line: 1,
        detail: error.message,
        suggestion: 'Fix the baseline JSON or regenerate it with --update-baseline.'
      }
    };
  }
}

export function applyBaseline(issues, baseline) {
  if (!baseline) return { issues, matched: [] };

  const active = [];
  const matched = [];

  for (const issue of issues) {
    const fingerprint = fingerprintIssue(issue);
    const withFingerprint = { ...issue, fingerprint };

    if (baseline.fingerprints.has(fingerprint)) {
      matched.push(withFingerprint);
    } else {
      active.push(withFingerprint);
    }
  }

  if (baseline.issue) active.push(baseline.issue);
  return { issues: active, matched };
}

export function writeBaseline(root, baselineInput, issues) {
  if (!baselineInput) return null;

  const baselinePath = path.resolve(root, baselineInput);
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true });

  const findings = issues.map((issue) => ({
    fingerprint: fingerprintIssue(issue),
    id: issue.id,
    category: issue.category,
    severity: issue.severity,
    title: issue.title,
    file: issue.file || null,
    line: issue.line || null
  })).sort((a, b) => a.fingerprint.localeCompare(b.fingerprint));

  const document = {
    version: 1,
    generatedAt: new Date().toISOString(),
    description: 'Known AgentProof findings. Baseline entries are excluded from the active score but remain visible as known debt.',
    findings
  };

  fs.writeFileSync(baselinePath, `${JSON.stringify(document, null, 2)}\n`);
  return { path: baselinePath, count: findings.length };
}

export function fingerprintIssue(issue) {
  return stableHash([
    issue.id || '',
    issue.category || '',
    issue.file || '',
    issue.line || '',
    issue.title || '',
    normalizeDetail(issue.detail || '')
  ].join('|'));
}

function normalizeDetail(detail) {
  return String(detail).replace(/\s+/g, ' ').slice(0, 220);
}

function stableHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
