import fs from 'node:fs';
import path from 'node:path';

export function verifyReceipt(cwd, receiptInput) {
  const receiptPath = path.resolve(cwd, receiptInput);
  if (!fs.existsSync(receiptPath)) {
    return {
      exitCode: 2,
      output: `AgentProof receipt not found: ${receiptPath}\n`
    };
  }

  let receipt;
  try {
    receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
  } catch (error) {
    return {
      exitCode: 2,
      output: `AgentProof receipt is invalid JSON: ${receiptPath}\n${error.message}\n`
    };
  }

  const missing = requiredFields(receipt).filter((field) => !hasPath(receipt, field));
  if (missing.length) {
    return {
      exitCode: 2,
      output: [
        `AgentProof receipt is missing required fields: ${receiptPath}`,
        ...missing.map((field) => `- ${field}`),
        ''
      ].join('\n')
    };
  }

  const lines = [];
  lines.push('# AgentProof Receipt Verification');
  lines.push('');
  lines.push(`Receipt: \`${receiptPath}\``);
  lines.push(`Tool: **${receipt.tool} ${receipt.version || ''}**`);
  lines.push(`Generated: **${receipt.generatedAt}**`);
  lines.push(`Verdict: **${receipt.verdict}**`);
  lines.push(`Score: **${receipt.score}/100**`);
  lines.push(`Passed: **${receipt.passed ? 'yes' : 'no'}**`);
  lines.push(`Profile: **${receipt.policy?.profile || 'unknown'}**`);
  lines.push(`Fail under: **${receipt.policy?.failUnder ?? 'unknown'}**`);
  lines.push(`Findings: **${receipt.evidence?.findings ?? 0}**`);
  lines.push(`Critical: **${receipt.evidence?.counts?.critical ?? 0}**`);
  lines.push(`High: **${receipt.evidence?.counts?.high ?? 0}**`);
  lines.push('');

  if (receipt.evidence?.blockers?.length) {
    lines.push('## Blockers');
    lines.push('');
    for (const blocker of receipt.evidence.blockers.slice(0, 12)) {
      lines.push(`- **${blocker.severity?.toUpperCase?.() || blocker.severity}** ${blocker.title} (${blocker.id})${blocker.file ? ` - \`${blocker.file}${blocker.line ? `:${blocker.line}` : ''}\`` : ''}`);
    }
    lines.push('');
  }

  lines.push(receipt.passed ? 'Receipt status: PASS' : 'Receipt status: FAIL');
  lines.push('');

  return {
    exitCode: receipt.passed ? 0 : 1,
    output: `${lines.join('\n')}\n`
  };
}

function requiredFields() {
  return [
    'tool',
    'generatedAt',
    'verdict',
    'score',
    'passed',
    'policy.profile',
    'policy.failUnder',
    'evidence.counts',
    'evidence.commands'
  ];
}

function hasPath(object, dottedPath) {
  return dottedPath.split('.').every((part) => {
    if (object && Object.prototype.hasOwnProperty.call(object, part)) {
      object = object[part];
      return true;
    }
    return false;
  });
}
