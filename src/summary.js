import path from 'node:path';
import { sortIssues } from './scoring.js';

export function renderSummary(result) {
  const topFindings = sortIssues(result.issues).slice(0, 10).map((issue) => ({
    id: issue.id,
    category: issue.category,
    severity: issue.severity,
    title: issue.title,
    file: issue.file || null,
    line: issue.line || null
  }));

  const summary = {
    $schema: 'https://raw.githubusercontent.com/runstudio/agentproof/main/schemas/agentproof.summary.schema.json',
    schemaVersion: 'agentproof.summary.v1',
    generatedAt: new Date().toISOString(),
    target: result.target,
    scanMode: result.scanMode || 'full',
    base: result.base || null,
    profile: result.policy?.profileName || 'standard',
    failUnder: result.failUnder,
    score: result.scoring.score,
    verdict: result.scoring.verdict,
    exitCode: result.scoring.exitCode,
    counts: result.scoring.counts,
    mode: result.designOnly ? 'design-only' : 'full',
    technical: result.technicalScoring ? {
      score: result.technicalScoring.score,
      verdict: result.technicalScoring.verdict,
      exitCode: result.technicalScoring.exitCode,
      counts: result.technicalScoring.counts
    } : null,
    design: result.design?.enabled ? {
      enabled: true,
      type: result.design.config.type,
      mode: result.design.mode,
      score: result.design.scoring.score,
      verdict: result.design.scoring.verdict,
      exitCode: result.design.scoring.exitCode,
      failUnder: result.design.scoring.failUnder,
      counts: result.design.scoring.counts,
      findings: result.design.issues.length,
      routes: result.design.routes,
      viewports: result.design.viewports,
      screenshots: result.design.screenshots || []
    } : {
      enabled: false,
      type: null,
      mode: 'disabled',
      score: null,
      verdict: 'NOT RUN',
      exitCode: 0,
      failUnder: null,
      counts: null,
      findings: 0,
      routes: [],
      viewports: [],
      screenshots: []
    },
    findings: result.issues.length,
    suppressedFindings: result.suppressedIssues?.length || 0,
    baseline: result.baseline ? {
      path: result.baseline.path,
      exists: result.baseline.exists,
      entries: result.baseline.entries,
      matched: result.baseline.matched
    } : null,
    claim: result.claim ? {
      audited: true,
      source: result.claim.source,
      fromFile: result.claim.fromFile
    } : {
      audited: false,
      source: null,
      fromFile: false
    },
    artifacts: artifactSummary(result),
    topFindings
  };

  return `${JSON.stringify(summary, null, 2)}\n`;
}

function artifactSummary(result) {
  return {
    report: result.reportPath || null,
    sarif: result.sarifPath || null,
    badge: result.badgePath || null,
    html: result.htmlPath || null,
    prComment: result.prCommentPath || null,
    receipt: result.receiptPath || null,
    history: result.history?.path || null,
    summary: result.summaryPath || null,
    relative: {
      report: relative(result.reportPath),
      sarif: relative(result.sarifPath),
      badge: relative(result.badgePath),
      html: relative(result.htmlPath),
      prComment: relative(result.prCommentPath),
      receipt: relative(result.receiptPath),
      history: relative(result.history?.path),
      summary: relative(result.summaryPath)
    }
  };
}

function relative(filePath) {
  if (!filePath) return null;
  return path.relative(process.cwd(), filePath) || filePath;
}
