import fs from 'node:fs';
import path from 'node:path';
import { collectFiles, readTextFiles } from '../files.js';
import { runDesignGuard } from './index.js';
import { runDesignFix } from './fix.js';
import { scoreDesignIssues } from './scoring.js';

export async function runDesignImprove(target, textFiles, config, options, env = process.env) {
  const outputPath = path.resolve(target, options.designImproveOutput || 'AGENT_PROOF_DESIGN_IMPROVEMENT.md');
  const targetScore = normalizeTargetScore(options.designTargetScore, options.failUnder);
  const maxPasses = normalizeMaxPasses(options.designMaxPasses);
  const fixRoot = options.designFixFromBrowser && options.designCloneOutput
    ? path.resolve(target, options.designCloneOutput)
    : target;

  if (options.designFixFromBrowser) fs.mkdirSync(fixRoot, { recursive: true });

  const passes = [];
  let currentTextFiles = textFiles;
  let beforeAudit = await auditDesign(target, currentTextFiles, config, options, env);
  let beforeScoring = scoreDesignIssues(beforeAudit.issues, beforeAudit.config);
  let finalAudit = beforeAudit;
  let finalScoring = beforeScoring;
  let fixResult = null;
  let ok = beforeScoring.score >= targetScore && beforeScoring.counts.high === 0 && beforeScoring.counts.critical === 0;
  let stoppedReason = ok ? 'Initial DesignGate already meets the target score.' : '';

  const brief = buildImprovementBrief({
    audit: beforeAudit,
    scoring: beforeScoring,
    targetScore,
    passNumber: 1,
    applied: Boolean(options.designFixApply)
  });

  if (!ok) {
    for (let pass = 1; pass <= maxPasses; pass += 1) {
      const passBrief = buildImprovementBrief({
        audit: finalAudit,
        scoring: finalScoring,
        targetScore,
        passNumber: pass,
        applied: Boolean(options.designFixApply)
      });
      const enhancedAudit = {
        ...finalAudit,
        improvementBrief: passBrief.aiPrompt
      };
      fixResult = await runDesignFix(fixRoot, currentTextFiles, config, {
        ...options,
        designFix: true,
        designFixApply: options.designFixApply,
        designFixOutput: pass === 1
          ? (options.designFixOutput || 'AGENT_PROOF_DESIGN_FIX.md')
          : `.agentproof/AGENT_PROOF_DESIGN_FIX_PASS_${pass}.md`
      }, enhancedAudit, env);

      passes.push({
        pass,
        brief: passBrief,
        fix: summarizeFixResult(fixResult)
      });

      if (!fixResult.ok) {
        stoppedReason = fixResult.error || 'DesignFix failed.';
        break;
      }

      if (!options.designFixApply) {
        stoppedReason = 'Dry run only. Rerun with --apply to rewrite files and re-audit.';
        break;
      }

      currentTextFiles = rereadTextFiles(fixRoot, config, options);
      finalAudit = await auditDesign(fixRoot, currentTextFiles, config, options, env);
      finalScoring = scoreDesignIssues(finalAudit.issues, finalAudit.config);
      passes[passes.length - 1].after = summarizeAudit(finalAudit, finalScoring);

      ok = finalScoring.score >= targetScore && finalScoring.counts.high === 0 && finalScoring.counts.critical === 0;
      if (ok) {
        stoppedReason = `Target score reached after pass ${pass}.`;
        break;
      }
      stoppedReason = `Target score not reached after ${pass} pass(es).`;
    }
  }

  const result = {
    ok,
    applied: Boolean(options.designFixApply),
    outputPath,
    target,
    fixRoot,
    targetScore,
    maxPasses,
    before: summarizeAudit(beforeAudit, beforeScoring),
    after: summarizeAudit(finalAudit, finalScoring),
    brief,
    passes,
    stoppedReason,
    lastFix: fixResult ? summarizeFixResult(fixResult) : null
  };

  fs.writeFileSync(outputPath, renderDesignImproveReport(result));
  return result;
}

export function renderDesignImproveConsole(result) {
  const before = result.before?.score ?? 'unknown';
  const after = result.after?.score ?? before;
  return [
    `${result.ok ? 'PASS' : 'FAIL'} DesignImprove ${before}/100 -> ${after}/100 target ${result.targetScore}/100`,
    `Applied: ${result.applied ? 'yes' : 'no'}`,
    `Report: ${result.outputPath}`,
    result.lastFix?.report ? `DesignFix: ${result.lastFix.report}` : '',
    result.stoppedReason ? `Next: ${result.stoppedReason}` : ''
  ].filter(Boolean).join('\n');
}

function auditDesign(root, textFiles, config, options, env) {
  return runDesignGuard(root, textFiles, config, {
    ...options,
    designOnly: true,
    designAi: false
  }, env);
}

function rereadTextFiles(root, config, options) {
  const maxFiles = Number.isFinite(config.maxFiles) ? config.maxFiles : options.maxFiles;
  return readTextFiles(root, collectFiles(root, config, maxFiles));
}

function normalizeTargetScore(value, failUnder) {
  const explicit = Number.isFinite(value) ? value : null;
  const threshold = Number.isFinite(failUnder) ? failUnder : 90;
  return Math.max(0, Math.min(100, explicit ?? Math.max(90, threshold)));
}

function normalizeMaxPasses(value) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(3, Math.trunc(value)));
}

function summarizeAudit(audit, scoring) {
  return {
    score: scoring.score,
    verdict: scoring.verdict,
    failUnder: scoring.failUnder,
    counts: scoring.counts,
    mode: audit.mode,
    issues: (audit.issues || []).map(summarizeIssue),
    measurements: (audit.measurements || []).slice(0, 4).map((item) => ({
      route: item.route,
      viewport: item.viewport,
      title: item.title,
      h1: item.h1s?.[0]?.text || '',
      hero: item.hero?.rect || null,
      ctas: (item.ctas || []).slice(0, 8).map((cta) => ({
        text: cta.text,
        top: Math.round(cta.rect?.top || 0),
        width: Math.round(cta.rect?.width || 0),
        height: Math.round(cta.rect?.height || 0)
      })),
      footerPresent: item.footerPresent
    }))
  };
}

function summarizeFixResult(fix) {
  return {
    ok: fix.ok,
    applied: fix.applied,
    provider: fix.provider,
    model: fix.model,
    reasoning: fix.reasoning,
    mode: fix.mode,
    report: fix.outputPath,
    error: fix.error || '',
    files: (fix.files || []).map((file) => file.path),
    backups: fix.backups || []
  };
}

function summarizeIssue(issue) {
  return {
    id: issue.id,
    severity: issue.severity,
    title: issue.title,
    file: issue.file,
    line: issue.line,
    problem: issue.detail,
    why: issue.why,
    fix: issue.suggestion,
    evidence: issue.evidence
  };
}

function buildImprovementBrief({ audit, scoring, targetScore, passNumber, applied }) {
  const blockers = (audit.issues || [])
    .filter((issue) => ['critical', 'high', 'medium'].includes(issue.severity))
    .map(summarizeIssue);
  const criticalOrHigh = blockers.filter((issue) => issue.severity === 'critical' || issue.severity === 'high');
  const measurements = (audit.measurements || []).slice(0, 4).map((item) => ({
    route: item.route,
    viewport: item.viewport,
    h1: item.h1s?.[0]?.text || '',
    heroHeight: item.hero?.rect?.height ? `${Math.round((item.hero.rect.height / item.viewport.height) * 100)}vh` : 'unknown',
    firstCtas: (item.ctas || []).slice(0, 6).map((cta) => cta.text).filter(Boolean),
    footerPresent: item.footerPresent
  }));

  const aiPrompt = [
    'You are a senior product designer and frontend engineer improving a real MVP landing page.',
    `Current DesignGate score: ${scoring.score}/100.`,
    `Target DesignGate score: ${targetScore}/100.`,
    `Pass: ${passNumber}.`,
    '',
    'Mission:',
    '- Improve the existing page enough to pass DesignGuard.',
    '- Preserve the product identity, real claims, language, content intent, and code stack.',
    '- Preserve the original visual direction: typography personality, palette, spacing rhythm, composition, atmosphere, and component style.',
    '- Keep the existing section order and at least 80% of visible copy unchanged; only replace placeholders or generic copy called out by findings.',
    '- Prefer CSS, responsive spacing, tap target, contrast, and hierarchy fixes over rebuilding the page structure.',
    '- Fix the listed blockers before adding decorative changes.',
    '- Do not pass the score by flattening the design, forcing a generic dark theme, hiding hero visuals, or replacing the page with a template.',
    '- Do not invent fake testimonials, fake logos, fake metrics, fake security claims, or unsupported product claims.',
    '- Return full replacement files only in the schema requested by DesignFix.',
    '',
    'Design priorities:',
    '- WCAG AA text contrast for normal text.',
    '- Hero within the first viewport: <=85vh desktop, <=92vh mobile.',
    '- Primary CTA visible above the fold and action-oriented.',
    '- Mobile tap targets >=44px.',
    '- H1 readable: <=3 lines desktop, <=4 lines mobile.',
    '- Compact spacing scale with CSS variables.',
    '- Body text >=16px where possible, helper text >=14px.',
    '- Remove placeholder or generic copy such as lorem ipsum.',
    '- Keep only one primary CTA per section.',
    '',
    `Apply mode requested: ${applied ? 'yes' : 'no'}.`,
    '',
    'Blocking findings:',
    JSON.stringify(criticalOrHigh.length ? criticalOrHigh : blockers, null, 2),
    '',
    'Rendered measurements:',
    JSON.stringify(measurements, null, 2)
  ].join('\n');

  return {
    score: scoring.score,
    targetScore,
    passNumber,
    blockers,
    measurements,
    aiPrompt
  };
}

function renderDesignImproveReport(result) {
  const lines = [
    '# AgentProof DesignImprove',
    '',
    `Status: **${result.ok ? 'PASS' : 'FAIL'}**`,
    `Applied: **${result.applied ? 'yes' : 'no'}**`,
    `Target score: **${result.targetScore}/100**`,
    `Before: **${result.before.score}/100 ${result.before.verdict}**`,
    `After: **${result.after.score}/100 ${result.after.verdict}**`,
    `Fix root: \`${result.fixRoot}\``,
    ''
  ];

  if (result.stoppedReason) {
    lines.push('## Result', '', result.stoppedReason, '');
  }

  lines.push('## Improvement Brief', '');
  lines.push(`Current score: **${result.brief.score}/100**`);
  lines.push(`Target score: **${result.brief.targetScore}/100**`, '');

  if (result.brief.blockers.length) {
    lines.push('### Findings to fix', '');
    for (const issue of result.brief.blockers.slice(0, 16)) {
      lines.push(`- [${issue.severity.toUpperCase()}] ${issue.id}: ${issue.title}`);
      if (issue.problem) lines.push(`  Problem: ${issue.problem}`);
      if (issue.fix) lines.push(`  Exact fix: ${issue.fix}`);
    }
    lines.push('');
  }

  lines.push('### AI improvement prompt', '', '```text', result.brief.aiPrompt, '```', '');

  if (result.passes.length) {
    lines.push('## AI Passes', '');
    for (const item of result.passes) {
      lines.push(`### Pass ${item.pass}`, '');
      lines.push(`DesignFix: **${item.fix.ok ? 'ok' : 'failed'}**`);
      lines.push(`Applied: **${item.fix.applied ? 'yes' : 'no'}**`);
      if (item.fix.report) lines.push(`Report: \`${item.fix.report}\``);
      if (item.after) lines.push(`After pass score: **${item.after.score}/100 ${item.after.verdict}**`);
      if (item.fix.error) lines.push(`Error: ${item.fix.error}`);
      lines.push('');
    }
  }

  if (result.after.issues.length) {
    lines.push('## Remaining Findings', '');
    for (const issue of result.after.issues.slice(0, 16)) {
      lines.push(`- [${issue.severity.toUpperCase()}] ${issue.id}: ${issue.title}`);
    }
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}
