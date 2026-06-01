import fs from 'node:fs';
import path from 'node:path';
import { detectVerificationCommands } from './verification.js';

export function renderDoctor(root, config, policy) {
  const commands = detectVerificationCommands(root, config);
  const files = detectProjectFiles(root);
  const lines = [];

  lines.push('# AgentProof Doctor');
  lines.push('');
  lines.push(`Project: \`${root}\``);
  lines.push(`Profile: **${policy.profileName}**`);
  lines.push(`Fail under: **${policy.failUnder}**`);
  lines.push(`Budgets: \`${JSON.stringify(policy.budgets || {})}\``);
  lines.push(`Baseline: ${config.baseline ? `\`${config.baseline}\`` : 'not configured'}`);
  lines.push(`History: ${config.history ? `\`${config.history}\`` : 'not configured'}`);
  lines.push(`Suppressions: **${policy.suppressions?.length || 0}**`);
  lines.push(`Severity overrides: **${Object.keys(policy.severityOverrides || {}).length}**`);
  lines.push('');

  lines.push('## Detected project files');
  lines.push('');
  if (files.length === 0) {
    lines.push('No known project markers found. AgentProof will still run static checks.');
  } else {
    for (const file of files) lines.push(`- \`${file}\``);
  }
  lines.push('');

  lines.push('## Verification commands AgentProof would run');
  lines.push('');
  if (commands.length === 0) {
    lines.push('No verification commands detected. Add custom `commands` in `agentproof.config.json` if this repo has a canonical proof command.');
  } else {
    lines.push('| Name | Language | Severity | Optional | Command |');
    lines.push('|---|---|---|---:|---|');
    for (const command of commands) {
      lines.push(`| ${escapeCell(command.name)} | ${escapeCell(command.language || '')} | ${escapeCell(command.severity || 'auto')} | ${command.optional ? 'yes' : 'no'} | \`${escapeCell(command.command || '')}\` |`);
    }
  }
  lines.push('');

  lines.push('## Output capabilities');
  lines.push('');
  lines.push('- Markdown report: `--output AGENT_PROOF_REPORT.md`');
  lines.push('- JSON: `--json`');
  lines.push('- SARIF: `--sarif agentproof.sarif`');
  lines.push('- HTML: `--html agentproof-report.html`');
  lines.push('- Badge: `--badge agentproof-badge.svg`');
  lines.push('- PR comment: `--pr-comment agentproof-pr-comment.md`');
  lines.push('- History: `--history .agentproof/history.jsonl`');
  lines.push('');

  lines.push('## Suggested next command');
  lines.push('');
  lines.push('```bash');
  lines.push('agentproof --profile strict --history .agentproof/history.jsonl');
  lines.push('```');
  lines.push('');

  return `${lines.join('\n')}\n`;
}

function detectProjectFiles(root) {
  return [
    'package.json',
    'pyproject.toml',
    'setup.py',
    'setup.cfg',
    'requirements.txt',
    'pytest.ini',
    'go.mod',
    'Cargo.toml',
    'agentproof.config.json'
  ].filter((file) => fs.existsSync(path.join(root, file)));
}

function escapeCell(value) {
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
