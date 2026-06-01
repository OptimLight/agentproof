import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { isTextFile } from './files.js';

export function getChangedTextFiles(root, base) {
  const primary = runGit(root, ['diff', '--name-only', '--diff-filter=ACMR', `${base}...HEAD`]);
  const selected = primary.ok ? primary : runGit(root, ['diff', '--name-only', '--diff-filter=ACMR', 'HEAD']);

  if (!selected.ok) {
    return {
      files: [],
      issue: {
        id: 'git.changed-scan-unavailable',
        category: 'git',
        severity: 'medium',
        title: 'Changed-file scan is unavailable',
        detail: selected.output || 'Git diff failed. AgentProof could not determine changed files.',
        suggestion: 'Run a full scan or pass a valid --base ref.'
      }
    };
  }

  const files = selected.output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((relative) => path.resolve(root, relative))
    .filter((fullPath) => fs.existsSync(fullPath) && fs.statSync(fullPath).isFile() && isTextFile(fullPath));

  return { files, issue: null };
}

function runGit(root, args) {
  const child = spawnSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    timeout: 30000,
    maxBuffer: 1024 * 1024
  });

  return {
    ok: !child.error && child.status === 0,
    output: `${child.stdout || ''}\n${child.stderr || ''}`.trim()
  };
}
