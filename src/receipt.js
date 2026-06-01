export function renderReceipt(result) {
  const blockers = result.issues
    .filter((issue) => issue.severity === 'critical' || issue.severity === 'high')
    .slice(0, 12)
    .map((issue) => receiptIssue(issue));

  const receipt = {
    schema: 'https://raw.githubusercontent.com/runstudio/agentproof/main/schemas/agentproof.receipt.schema.json',
    tool: 'AgentProof',
    version: '0.1.0',
    generatedAt: new Date().toISOString(),
    target: result.target,
    verdict: result.scoring.verdict,
    score: result.scoring.score,
    passed: result.scoring.exitCode === 0,
    mode: result.designOnly ? 'design-only' : 'full',
    gates: {
      technical: result.technicalScoring ? {
        verdict: result.technicalScoring.verdict,
        score: result.technicalScoring.score,
        passed: result.technicalScoring.exitCode === 0,
        counts: result.technicalScoring.counts
      } : null,
      design: result.design?.enabled ? {
        enabled: true,
        type: result.design.config.type,
        mode: result.design.mode,
        verdict: result.design.scoring.verdict,
        score: result.design.scoring.score,
        passed: result.design.scoring.exitCode === 0,
        failUnder: result.design.scoring.failUnder,
        routes: result.design.routes,
        viewports: result.design.viewports,
        screenshots: result.design.screenshots || [],
        counts: result.design.scoring.counts
      } : { enabled: false }
    },
    policy: {
      profile: result.policy?.profileName || 'standard',
      failUnder: result.failUnder,
      budgets: result.policy?.budgets || {}
    },
    scan: {
      mode: result.scanMode || 'full',
      base: result.base || null,
      scannedFiles: result.scannedFiles
    },
    evidence: {
      counts: result.scoring.counts,
      findings: result.issues.length,
      blockers,
      baselineMatched: result.baseline?.matched || 0,
      suppressed: result.suppressedIssues?.length || 0,
      claimAudited: result.claim ? result.claim.source : null,
      commands: result.commands.map((command) => ({
        name: command.name,
        label: command.label || command.name,
        language: command.language || null,
        status: command.status,
        command: command.command || '',
        cwd: command.cwd || '',
        durationMs: command.durationMs || 0
      }))
    },
    artifacts: {
      markdown: result.reportPath || null,
      sarif: result.sarifPath || null,
      html: result.htmlPath || null,
      badge: result.badgePath || null,
      prComment: result.prCommentPath || null,
      history: result.history?.path || null
    }
  };

  return `${JSON.stringify(receipt, null, 2)}\n`;
}

function receiptIssue(issue) {
  return {
    id: issue.id,
    category: issue.category,
    severity: issue.severity,
    title: issue.title,
    file: issue.file || null,
    line: issue.line || null,
    fingerprint: issue.fingerprint || null,
    evidence: issue.evidence || null
  };
}
