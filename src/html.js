import { sortIssues } from './scoring.js';

export function renderHtmlReport(result) {
  const issues = sortIssues(result.issues);
  const color = colorFor(result.scoring.verdict);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AgentProof Report - ${escapeHtml(result.scoring.verdict)}</title>
  <style>
    :root { color-scheme: dark; --bg: #050609; --panel: #10131f; --line: #263044; --ink: #f8fafc; --muted: #a7b0c3; --accent: ${color}; }
    * { box-sizing: border-box; }
    body { margin: 0; background: radial-gradient(circle at top left, color-mix(in srgb, var(--accent), transparent 62%), transparent 34rem), var(--bg); color: var(--ink); font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    main { width: min(1120px, calc(100% - 32px)); margin: 0 auto; padding: 42px 0 70px; }
    .hero { border: 1px solid var(--line); background: rgba(16, 19, 31, .78); border-radius: 28px; padding: clamp(24px, 5vw, 48px); box-shadow: 0 30px 100px rgba(0,0,0,.38); }
    .kicker, code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .kicker { color: var(--muted); text-transform: uppercase; letter-spacing: .14em; font-size: 12px; }
    h1 { margin: 12px 0 0; font-size: clamp(44px, 9vw, 104px); line-height: .9; letter-spacing: -.08em; }
    .score { color: var(--accent); }
    .meta { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin-top: 28px; }
    .box, .finding { border: 1px solid var(--line); background: rgba(255,255,255,.035); border-radius: 18px; padding: 16px; }
    .box strong { display:block; font-size: 24px; margin-top: 4px; }
    h2 { margin: 34px 0 14px; }
    table { width: 100%; border-collapse: collapse; overflow: hidden; border-radius: 16px; }
    th, td { border-bottom: 1px solid var(--line); text-align: left; padding: 12px; color: var(--muted); vertical-align: top; }
    th { color: var(--ink); background: rgba(255,255,255,.05); }
    .findings { display: grid; gap: 12px; }
    .finding h3 { margin: 0 0 10px; }
    .finding p { color: var(--muted); margin: 6px 0; line-height: 1.55; }
    .sev { color: var(--accent); font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; text-transform: uppercase; }
    @media (max-width: 980px) { .meta { grid-template-columns: 1fr 1fr 1fr; } }
    @media (max-width: 620px) { .meta { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main>
    <section class="hero">
      <div class="kicker">AgentProof Report</div>
      <h1><span class="score">${escapeHtml(String(result.scoring.score))}/100</span><br>${escapeHtml(result.scoring.verdict)}</h1>
      <div class="meta">
        <div class="box">Critical<strong>${result.scoring.counts.critical}</strong></div>
        <div class="box">High<strong>${result.scoring.counts.high}</strong></div>
        <div class="box">Medium<strong>${result.scoring.counts.medium}</strong></div>
        <div class="box">Low<strong>${result.scoring.counts.low}</strong></div>
        <div class="box">Baseline<strong>${result.baseline?.matched || 0}</strong></div>
        <div class="box">Suppressed<strong>${result.suppressedIssues?.length || 0}</strong></div>
      </div>
      <div class="meta">
        <div class="box">Technical Gate<strong>${escapeHtml(gateLine(result.technicalScoring))}</strong></div>
        <div class="box">Design Gate<strong>${escapeHtml(result.design?.enabled ? gateLine(result.design.scoring) : 'NOT RUN')}</strong></div>
        <div class="box">Design Mode<strong>${escapeHtml(result.design?.enabled ? result.design.mode : 'off')}</strong></div>
        <div class="box">Design Type<strong>${escapeHtml(result.design?.enabled ? result.design.config.type : 'none')}</strong></div>
        <div class="box">Routes<strong>${escapeHtml(result.design?.enabled ? String(result.design.routes.length) : '0')}</strong></div>
        <div class="box">Screenshots<strong>${escapeHtml(String(result.design?.screenshots?.length || 0))}</strong></div>
      </div>
    </section>

    <h2>Evidence</h2>
    <table>
      <tbody>
        <tr><th>Target</th><td><code>${escapeHtml(result.target)}</code></td></tr>
        <tr><th>Scan mode</th><td>${escapeHtml(result.scanMode || 'full')}${result.base ? ` against <code>${escapeHtml(result.base)}</code>` : ''}</td></tr>
        <tr><th>Risk profile</th><td>${escapeHtml(result.policy?.profileName || 'standard')} - ${escapeHtml(result.policy?.profileDescription || '')}</td></tr>
        <tr><th>Fail under</th><td>${escapeHtml(String(result.failUnder))}</td></tr>
        <tr><th>Mode</th><td>${result.designOnly ? 'DesignGuard only' : 'Full AgentProof gate'}</td></tr>
        <tr><th>Budgets</th><td><code>${escapeHtml(JSON.stringify(result.policy?.budgets || {}))}</code></td></tr>
        <tr><th>Baseline</th><td>${result.baseline ? `${escapeHtml(String(result.baseline.matched))} known finding(s) matched from <code>${escapeHtml(result.baseline.path)}</code>` : 'No baseline'}</td></tr>
        <tr><th>Scanned files</th><td>${result.scannedFiles}</td></tr>
        <tr><th>Claim audited</th><td>${result.claim ? escapeHtml(result.claim.source) : 'No'}</td></tr>
      </tbody>
    </table>

    <h2>Commands</h2>
    <table>
      <thead><tr><th>Check</th><th>Status</th><th>Command</th></tr></thead>
      <tbody>${result.commands.map((command) => `<tr><td>${escapeHtml(command.name)}</td><td>${escapeHtml(command.status)}</td><td><code>${escapeHtml(command.command || '')}</code></td></tr>`).join('')}</tbody>
    </table>

    <h2>Active Findings</h2>
    <div class="findings">
      ${issues.length === 0 ? '<div class="finding"><h3>No active findings</h3><p>No configured AgentProof blocker was detected outside the baseline.</p></div>' : issues.map((issue) => findingHtml(issue)).join('')}
    </div>

    ${result.baselineIssues?.length ? `<h2>Baseline Findings</h2><div class="findings">${result.baselineIssues.map((issue) => findingHtml(issue)).join('')}</div>` : ''}
  </main>
</body>
</html>
`;
}

function findingHtml(issue) {
  const location = issue.file ? `${issue.file}${issue.line ? `:${issue.line}` : ''}` : 'project';
  return `<article class="finding">
    <div class="sev">${escapeHtml(issue.severity)} / ${escapeHtml(issue.category)}</div>
    <h3>${escapeHtml(issue.title)}</h3>
    <p><strong>Location:</strong> ${escapeHtml(location)}</p>
    ${issue.fingerprint ? `<p><strong>Fingerprint:</strong> <code>${escapeHtml(issue.fingerprint)}</code></p>` : ''}
    ${issue.detail ? `<p><strong>Detail:</strong> ${escapeHtml(issue.detail)}</p>` : ''}
    ${issue.evidence ? `<p><strong>Evidence:</strong> ${escapeHtml(formatEvidence(issue.evidence))}</p>` : ''}
    ${issue.why ? `<p><strong>Why:</strong> ${escapeHtml(issue.why)}</p>` : ''}
    ${issue.suggestion ? `<p><strong>Fix:</strong> ${escapeHtml(issue.suggestion)}</p>` : ''}
  </article>`;
}

function colorFor(verdict) {
  if (verdict === 'SHIP') return '#22c55e';
  if (verdict === 'DESIGN REVIEW REQUIRED') return '#f97316';
  if (verdict === 'SHIP WITH CARE') return '#f59e0b';
  if (verdict === 'FIX BEFORE MERGE') return '#fb923c';
  return '#ef4444';
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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
