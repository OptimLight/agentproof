import fs from 'node:fs';
import path from 'node:path';

export function appendHistory(root, historyInput, result) {
  if (!historyInput) return null;

  const historyPath = path.resolve(root, historyInput);
  fs.mkdirSync(path.dirname(historyPath), { recursive: true });

  const entry = {
    timestamp: new Date().toISOString(),
    score: result.scoring.score,
    verdict: result.scoring.verdict,
    exitCode: result.scoring.exitCode,
    profile: result.policy?.profileName || 'standard',
    scanMode: result.scanMode || 'full',
    base: result.base || null,
    scannedFiles: result.scannedFiles,
    counts: result.scoring.counts,
    findings: result.issues.length,
    baselineMatched: result.baseline?.matched || 0,
    suppressed: result.suppressedIssues?.length || 0,
    commands: result.commands.map((command) => ({
      name: command.name,
      status: command.status,
      language: command.language || null,
      durationMs: command.durationMs || 0
    }))
  };

  fs.appendFileSync(historyPath, `${JSON.stringify(entry)}\n`);
  return { path: historyPath, entry };
}

export function renderTrend(root, historyInput, limit = 20) {
  const historyPath = path.resolve(root, historyInput || '.agentproof/history.jsonl');
  if (!fs.existsSync(historyPath)) {
    return `No AgentProof history found at ${historyPath}\nRun with --history ${historyInput || '.agentproof/history.jsonl'} to start tracking.\n`;
  }

  const entries = fs.readFileSync(historyPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => safeParse(line))
    .filter(Boolean)
    .slice(-limit);

  if (entries.length === 0) {
    return `AgentProof history is empty at ${historyPath}\n`;
  }

  const first = entries[0];
  const last = entries[entries.length - 1];
  const delta = last.score - first.score;
  const passRate = Math.round((entries.filter((entry) => entry.exitCode === 0).length / entries.length) * 100);
  const avgScore = Math.round(entries.reduce((sum, entry) => sum + entry.score, 0) / entries.length);

  const lines = [];
  lines.push('# AgentProof Trend');
  lines.push('');
  lines.push(`History: \`${historyPath}\``);
  lines.push(`Runs analyzed: **${entries.length}**`);
  lines.push(`Average score: **${avgScore}/100**`);
  lines.push(`Latest score: **${last.score}/100** (${last.verdict})`);
  lines.push(`Score delta: **${formatDelta(delta)}**`);
  lines.push(`Pass rate: **${passRate}%**`);
  lines.push('');
  lines.push('| Time | Score | Verdict | Critical | High | Medium | Baseline | Suppressed |');
  lines.push('|---|---:|---|---:|---:|---:|---:|---:|');

  for (const entry of entries) {
    lines.push(`| ${entry.timestamp} | ${entry.score} | ${entry.verdict} | ${entry.counts?.critical || 0} | ${entry.counts?.high || 0} | ${entry.counts?.medium || 0} | ${entry.baselineMatched || 0} | ${entry.suppressed || 0} |`);
  }

  lines.push('');
  lines.push(recommendation(delta, last));
  lines.push('');

  return `${lines.join('\n')}\n`;
}

function safeParse(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function formatDelta(delta) {
  if (delta > 0) return `+${delta}`;
  return String(delta);
}

function recommendation(delta, latest) {
  if (latest.exitCode !== 0) return 'Recommendation: latest run is outside the gate. Fix active blockers before merge.';
  if (delta < -10) return 'Recommendation: quality is passing but trending down. Review recent agent workflow changes.';
  if (delta > 10) return 'Recommendation: quality is improving. Keep this gate in CI and preserve the current workflow.';
  return 'Recommendation: quality is stable. Watch for critical/high spikes over time.';
}
