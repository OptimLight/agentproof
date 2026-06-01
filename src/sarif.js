export function renderSarif(result) {
  const rules = new Map();

  for (const issue of result.issues) {
    if (!rules.has(issue.id)) {
      rules.set(issue.id, {
        id: issue.id,
        name: issue.title,
        shortDescription: { text: issue.title },
        fullDescription: { text: issue.detail || issue.title },
        help: { text: issue.suggestion || 'Review this finding before shipping.' },
        defaultConfiguration: { level: sarifLevel(issue.severity) },
        properties: {
          category: issue.category,
          severity: issue.severity
        }
      });
    }
  }

  return JSON.stringify({
    version: '2.1.0',
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    runs: [
      {
        tool: {
          driver: {
            name: 'AgentProof',
            informationUri: 'https://github.com/runstudio/agentproof',
            rules: [...rules.values()]
          }
        },
        results: result.issues.map((issue) => ({
          ruleId: issue.id,
          level: sarifLevel(issue.severity),
          message: {
            text: [issue.title, issue.detail, issue.suggestion].filter(Boolean).join(' - ')
          },
          locations: issue.file ? [
            {
              physicalLocation: {
                artifactLocation: { uri: issue.file },
                region: { startLine: issue.line || 1 }
              }
            }
          ] : []
        }))
      }
    ]
  }, null, 2);
}

function sarifLevel(severity) {
  if (severity === 'critical' || severity === 'high') return 'error';
  if (severity === 'medium') return 'warning';
  return 'note';
}
