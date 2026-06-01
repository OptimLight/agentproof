import path from 'node:path';
import { sortIssues } from './scoring.js';

export function renderMarkdownReport(result) {
  const sortedIssues = sortIssues(result.issues);
  const lines = [];

  lines.push('# AgentProof Report');
  lines.push('');
  lines.push(`Verdict: **${result.scoring.verdict}**`);
  lines.push(`Score: **${result.scoring.score}/100**`);
  lines.push(`Technical Gate: **${gateLine(result.technicalScoring)}**`);
  lines.push(`Design Gate: **${result.design?.enabled ? gateLine(result.design.scoring) : 'NOT RUN'}**`);
  lines.push(`Target: \`${result.target}\``);
  lines.push(`Scan mode: **${result.scanMode || 'full'}**${result.base ? ` against \`${result.base}\`` : ''}`);
  lines.push(`Risk profile: **${result.policy?.profileName || 'standard'}**`);
  lines.push(`Fail under: **${result.failUnder}**`);
  lines.push(`Scanned files: **${result.scannedFiles}**`);
  if (result.designOnly) lines.push('Mode: **DesignGuard only**');
  lines.push(`Claim audited: **${result.claim ? result.claim.source : 'No'}**`);
  if (result.design?.enabled) {
    lines.push(`Design type: **${result.design.config.type}**`);
    lines.push(`Design mode: **${result.design.mode}**`);
    lines.push(`Design routes: **${result.design.routes.join(', ')}**`);
    lines.push(`Design viewports: **${result.design.viewports.join(', ')}**`);
    if (result.design.screenshots?.length) lines.push(`Design screenshots: **${result.design.screenshots.length}**`);
  }
  lines.push(`Baseline matched: **${result.baseline?.matched || 0}**`);
  lines.push(`Suppressed findings: **${result.suppressedIssues?.length || 0}**`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Signal');
  lines.push('');
  lines.push('| Severity | Count | Budget |');
  lines.push('|---|---:|---:|');
  for (const severity of ['critical', 'high', 'medium', 'low', 'info']) {
    const budget = result.policy?.budgets?.[severity];
    lines.push(`| ${severity} | ${result.scoring.counts[severity] || 0} | ${Number.isFinite(budget) ? budget : ''} |`);
  }
  lines.push('');
  lines.push('## Verification Commands');
  lines.push('');
  lines.push('| Check | Status | Command | Duration |');
  lines.push('|---|---|---|---:|');
  for (const command of result.commands) {
    const cwd = command.cwd ? ` from ${command.cwd}` : '';
    lines.push(`| ${escapeCell(command.name)} | ${command.status} | \`${escapeCell(command.command || '')}\`${escapeCell(cwd)} | ${command.durationMs ? `${command.durationMs}ms` : ''} |`);
  }
  lines.push('');

  if (result.baseline) {
    lines.push('## Baseline');
    lines.push('');
    lines.push(`- Path: \`${result.baseline.path}\``);
    lines.push(`- Exists: ${result.baseline.exists ? 'yes' : 'no'}`);
    lines.push(`- Entries: ${result.baseline.entries}`);
    lines.push(`- Matched known findings: ${result.baseline.matched}`);
    if (result.baseline.updated) lines.push(`- Updated: ${result.baseline.updated.count} finding(s) written to \`${result.baseline.updated.path}\``);
    lines.push('');
  }

  if (sortedIssues.length === 0) {
    lines.push('## Findings');
    lines.push('');
    lines.push('No active findings. This does not prove perfection, but the configured AgentProof gates did not catch new blockers.');
  } else {
    lines.push('## Findings');
    lines.push('');
    for (const found of sortedIssues) {
      const location = found.file ? `${found.file}${found.line ? `:${found.line}` : ''}` : 'project';
      lines.push(`### [${found.severity.toUpperCase()}] ${found.title}`);
      lines.push('');
      lines.push(`- Category: ${found.category}`);
      lines.push(`- Location: ${location}`);
      if (found.fingerprint) lines.push(`- Fingerprint: \`${found.fingerprint}\``);
      if (found.category === 'design') {
        lines.push(`- Problem: ${singleLine(found.detail || found.title)}`);
        if (found.evidence) lines.push(`- Evidence: ${singleLine(formatEvidence(found.evidence))}`);
        if (found.why) lines.push(`- Why it matters: ${singleLine(found.why)}`);
        if (found.suggestion) lines.push(`- Exact fix: ${found.suggestion}`);
      } else {
        if (found.detail) lines.push(`- Detail: ${singleLine(found.detail)}`);
        if (found.suggestion) lines.push(`- Fix: ${found.suggestion}`);
      }
      lines.push('');
    }
  }

  if (result.baselineIssues?.length) {
    lines.push('## Baseline Findings');
    lines.push('');
    lines.push('Known findings matched by the baseline. They are visible here but excluded from the active score.');
    lines.push('');
    lines.push('| Severity | Rule | Location | Fingerprint |');
    lines.push('|---|---|---|---|');
    for (const found of result.baselineIssues) {
      const location = found.file ? `${found.file}${found.line ? `:${found.line}` : ''}` : 'project';
      lines.push(`| ${found.severity} | ${found.id} | ${escapeCell(location)} | \`${found.fingerprint}\` |`);
    }
    lines.push('');
  }

  if (result.suppressedIssues?.length) {
    lines.push('## Suppressed Findings');
    lines.push('');
    lines.push('| Severity | Rule | Location | Reason | Expires |');
    lines.push('|---|---|---|---|---|');
    for (const found of result.suppressedIssues) {
      const location = found.file ? `${found.file}${found.line ? `:${found.line}` : ''}` : 'project';
      lines.push(`| ${found.severity} | ${found.id} | ${escapeCell(location)} | ${escapeCell(found.suppression.reason || 'No reason provided')} | ${escapeCell(found.suppression.expires || '')} |`);
    }
    lines.push('');
  }

  lines.push('## What AgentProof Checked');
  lines.push('');
  lines.push('- Verification commands: JS/TS package scripts, Python pytest/compile, Go test/vet, and Rust cargo checks when detected.');
  lines.push('- Security smells: committed env files, token-shaped strings, hardcoded credentials, dynamic code execution, unsafe HTML.');
  lines.push('- AI slop: placeholders, generic launch copy, TODO/FIXME, fake names, unfinished content.');
  lines.push('- UI polish: missing image alt text, dead links, empty buttons.');
  lines.push('- DesignGuard when enabled: rendered/mobile layout, hero size, CTA position, contrast, typography, spacing, color tokens, product-type rules, screenshots, and optional AI review.');
  lines.push('- Docs readiness: README usage, license, package description.');
  lines.push('- Agent claim audit when `--claim` is provided.');
  lines.push('- Baseline gates for known debt when `--baseline` is provided.');
  lines.push('- Policy gates: risk profile, severity budgets, severity overrides, and documented suppressions.');
  lines.push('');
  lines.push('## Recommended Next Move');
  lines.push('');
  for (const step of nextSteps(result)) {
    lines.push(`- ${step}`);
  }
  lines.push('');

  return `${lines.join('\n')}\n`;
}

export function renderConsoleSummary(result) {
  const icon = result.scoring.exitCode === 0 ? 'PASS' : 'FAIL';
  const artifacts = [
    `Report: ${path.relative(process.cwd(), result.reportPath) || result.reportPath}`,
    result.sarifPath ? `SARIF: ${path.relative(process.cwd(), result.sarifPath) || result.sarifPath}` : '',
    result.badgePath ? `Badge: ${path.relative(process.cwd(), result.badgePath) || result.badgePath}` : '',
    result.htmlPath ? `HTML: ${path.relative(process.cwd(), result.htmlPath) || result.htmlPath}` : '',
    result.prCommentPath ? `PR comment: ${path.relative(process.cwd(), result.prCommentPath) || result.prCommentPath}` : '',
    result.receiptPath ? `Receipt: ${path.relative(process.cwd(), result.receiptPath) || result.receiptPath}` : '',
    result.summaryPath ? `Summary: ${path.relative(process.cwd(), result.summaryPath) || result.summaryPath}` : '',
    result.history?.path ? `History: ${path.relative(process.cwd(), result.history.path) || result.history.path}` : ''
  ].filter(Boolean);

  return [
    `${icon} AgentProof ${result.scoring.score}/100 - ${result.scoring.verdict}`,
    `Technical Gate: ${gateLine(result.technicalScoring)}`,
    result.design?.enabled ? `Design Gate: ${gateLine(result.design.scoring)} (${result.design.config.type}, ${result.design.mode})` : '',
    result.designOnly ? 'Mode: design-only, technical/docs/security/verification gates excluded' : '',
    `Policy: ${result.policy?.profileName || 'standard'} profile, fail-under ${result.failUnder}`,
    result.observeOnly ? 'Mode: observe-only, verdict preserved and exit code forced to 0' : '',
    result.baseline ? `Baseline: ${result.baseline.matched} matched known finding(s)` : '',
    ...artifacts,
    `Findings: ${result.issues.length} (${result.scoring.counts.critical} critical, ${result.scoring.counts.high} high, ${result.scoring.counts.medium} medium, ${result.scoring.counts.low} low)`,
    result.suppressedIssues?.length ? `Suppressed: ${result.suppressedIssues.length}` : '',
    '',
    ...nextSteps(result).map((step, index) => `${index === 0 ? 'Next' : 'Tip'}: ${step}`)
  ].filter(Boolean).join('\n');
}

function nextSteps(result) {
  const steps = [nextMove(result.scoring)];

  if (result.issues.length > 0) {
    steps.push('Open the report, then run `agentproof --troubleshoot` if the first failure path is unclear.');
  }

  if (result.scoring.exitCode !== 0 && !result.observeOnly) {
    steps.push('For a non-blocking rollout, rerun with `--observe-only` while your team tunes the gate.');
  }

  if (!result.claim) {
    steps.push('To audit the agent final message, add `--claim .agentproof/final-claim.md`.');
  }

  return steps.slice(0, 4);
}

function nextMove(scoring) {
  if (scoring.verdict === 'DESIGN REVIEW REQUIRED') return 'Do not ship yet. Fix DesignGuard blockers or run a senior design review before merge.';
  if (scoring.verdict === 'DO NOT SHIP') return 'Block the PR. Fix critical failures first, then rerun AgentProof.';
  if (scoring.verdict === 'FIX BEFORE MERGE') return 'Fix high-severity issues before merge. Human review is still required.';
  if (scoring.verdict === 'SHIP WITH CARE') return 'Review medium findings and decide whether they belong in this PR or a follow-up.';
  return 'Ship. Keep AgentProof in CI so the next agent-generated PR has the same bar.';
}

function escapeCell(value) {
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function singleLine(value) {
  return String(value).replace(/\s+/g, ' ').slice(0, 500);
}

function gateLine(scoring) {
  if (!scoring) return 'NOT RUN';
  if (scoring.score === null) return scoring.verdict || 'NOT RUN';
  return `${scoring.verdict} ${scoring.score}/100`;
}

function formatEvidence(evidence) {
  if (!evidence) return '';
  if (typeof evidence === 'string') return evidence;
  return Object.entries(evidence)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`)
    .join('; ');
}
