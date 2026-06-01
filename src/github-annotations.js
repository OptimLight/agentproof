const DEFAULT_LIMIT = 50;

export function renderGithubAnnotations(result, limit = DEFAULT_LIMIT) {
  if (!Array.isArray(result.issues) || result.issues.length === 0) return '';

  const annotations = result.issues.slice(0, limit).map((issue) => {
    const level = annotationLevel(issue.severity);
    const properties = [
      issue.file ? `file=${escapeProperty(issue.file)}` : '',
      issue.line ? `line=${escapeProperty(String(issue.line))}` : '',
      `title=${escapeProperty(annotationTitle(issue))}`
    ].filter(Boolean).join(',');

    return `::${level} ${properties}::${escapeMessage(annotationMessage(issue))}`;
  });

  const remaining = result.issues.length - annotations.length;
  if (remaining > 0) {
    annotations.push(`::notice title=${escapeProperty('AgentProof findings truncated')}::${escapeMessage(`${remaining} additional finding(s) omitted from GitHub annotations. Open ${result.reportPath || 'AGENT_PROOF_REPORT.md'} for the full report.`)}`);
  }

  return annotations.join('\n');
}

function annotationLevel(severity) {
  if (severity === 'critical' || severity === 'high') return 'error';
  if (severity === 'medium') return 'warning';
  return 'notice';
}

function annotationTitle(issue) {
  return ['AgentProof', issue.severity, issue.id || issue.title].filter(Boolean).join(': ');
}

function annotationMessage(issue) {
  return [
    issue.title,
    issue.detail,
    issue.suggestion
  ].filter(Boolean).join(' - ') || 'Review this AgentProof finding before shipping.';
}

function escapeMessage(value) {
  return String(value)
    .replace(/%/g, '%25')
    .replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A');
}

function escapeProperty(value) {
  return escapeMessage(value)
    .replace(/:/g, '%3A')
    .replace(/,/g, '%2C');
}
