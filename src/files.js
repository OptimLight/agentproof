import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_IGNORE, TEXT_EXTENSIONS } from './constants.js';

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AGENT_TEMPLATE_TARGETS = {
  codex: {
    source: 'templates/agents/AGENTS.md',
    target: 'AGENTS.md'
  },
  claude: {
    source: 'templates/agents/CLAUDE.md',
    target: 'CLAUDE.md'
  },
  cursor: {
    source: 'templates/agents/cursor-agentproof.mdc',
    target: '.cursor/rules/agentproof.mdc'
  },
  copilot: {
    source: 'templates/agents/copilot-instructions.md',
    target: '.github/copilot-instructions.md'
  },
  opencode: {
    source: 'templates/agents/opencode-agentproof.md',
    target: '.opencode/agentproof.md'
  }
};

export function resolveTargetPath(cwd, inputPath) {
  return path.resolve(cwd, inputPath || '.');
}

export function loadConfig(root) {
  const configPath = path.join(root, 'agentproof.config.json');
  if (!fs.existsSync(configPath)) return { path: configPath, config: {} };

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return { path: configPath, config };
  } catch (error) {
    return {
      path: configPath,
      config: {},
      issue: {
        id: 'config.invalid-json',
        category: 'config',
        severity: 'high',
        title: 'agentproof.config.json is invalid JSON',
        file: 'agentproof.config.json',
        line: 1,
        detail: error.message,
        suggestion: 'Fix the JSON or remove the config file.'
      }
    };
  }
}

export function createDefaultConfig(root, configOverride = null) {
  const configPath = path.join(root, 'agentproof.config.json');
  if (fs.existsSync(configPath)) return { created: false, path: configPath };

  const defaultConfig = {
    $schema: 'https://raw.githubusercontent.com/runstudio/agentproof/main/schemas/agentproof.config.schema.json',
    profile: 'standard',
    failUnder: 80,
    ignore: ['fixtures', 'snapshots'],
    slopPhrases: ['coming soon', 'premium experience', 'lorem ipsum'],
    commandTimeoutSeconds: 120,
    commands: [],
    budgets: {
      critical: 0,
      high: 3,
      medium: 12
    },
    severityOverrides: {},
    suppressions: [
      {
        id: 'slop.generic-copy',
        file: 'docs/internal-drafts/*',
        reason: 'Internal draft copy is allowed before client review.',
        expires: '2026-12-31'
      }
    ]
  };

  const configToWrite = configOverride || defaultConfig;
  fs.writeFileSync(configPath, `${JSON.stringify(configToWrite, null, 2)}\n`);
  return { created: true, path: configPath };
}

export function createGithubWorkflow(root) {
  const workflowDir = path.join(root, '.github', 'workflows');
  const workflowPath = path.join(workflowDir, 'agentproof.yml');
  if (fs.existsSync(workflowPath)) return { created: false, path: workflowPath };

  fs.mkdirSync(workflowDir, { recursive: true });
  fs.writeFileSync(workflowPath, `name: AgentProof

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read
  security-events: write

jobs:
  proof:
    name: AgentProof QA gate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: AgentProof
        uses: runstudio/agentproof@v1
        with:
          path: .
          profile: strict
          fail-under: "85"
          changed: "true"
          base: origin/main
          # Enable after your CI starts the app and exposes a local URL:
          # design: saas
          # design-url: http://localhost:3000
          # design-viewports: mobile,desktop
          # design-ai: "false"
          github-annotations: "true"
          baseline: .agentproof/baseline.json
          sarif: agentproof.sarif
          badge: agentproof-badge.svg
          html: agentproof-report.html
          pr-comment: agentproof-pr-comment.md
          receipt: agentproof-receipt.json
          summary: agentproof-summary.json
          history: .agentproof/history.jsonl
      - name: Upload SARIF
        if: always()
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: agentproof.sarif
      - name: Upload AgentProof artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: agentproof-report
          path: |
            AGENT_PROOF_REPORT.md
            agentproof.sarif
            agentproof-badge.svg
            agentproof-report.html
            agentproof-pr-comment.md
            agentproof-receipt.json
            agentproof-summary.json
            .agentproof/history.jsonl
`);
  return { created: true, path: workflowPath };
}

export function createAgentContract(root) {
  const contractDir = path.join(root, '.agentproof');
  const contractPath = path.join(contractDir, 'AGENT_CONTRACT.md');
  if (fs.existsSync(contractPath)) return { created: false, path: contractPath };

  fs.mkdirSync(contractDir, { recursive: true });
  fs.writeFileSync(contractPath, `# AgentProof Agent Contract

This repository uses AgentProof as the local trust gate for AI-generated code.

## Before claiming a task is done

1. Draft your final message into:

   \`\`\`text
   .agentproof/final-claim.md
   \`\`\`

2. Run AgentProof:

   \`\`\`bash
   npx agentproof --path . --profile strict --claim .agentproof/final-claim.md --receipt agentproof-receipt.json --pr-comment agentproof-pr-comment.md
   \`\`\`

3. If AgentProof returns \`DO NOT SHIP\` or \`FIX BEFORE MERGE\`, do not claim completion.

4. If AgentProof reports unproven claims, rewrite the final message so it only says what the evidence proves.

5. In your final response, include:

   - AgentProof verdict
   - score
   - receipt path
   - verification scope
   - any remaining risks

## Never claim

- tests passed unless the test command passed;
- build passed unless the build command passed;
- lint/typecheck passed unless those commands passed;
- production-ready when critical or high findings remain;
- no blockers when AgentProof reported active blockers.

## If verification is skipped

Say exactly what was skipped and why. Static-only proof is not the same as full verification.

## Final answer template

\`\`\`text
AgentProof: <VERDICT> (<SCORE>/100)
Receipt: agentproof-receipt.json
Verification: <commands observed or static-only>
Risks: <remaining risks or none>
\`\`\`
`);

  return { created: true, path: contractPath };
}

export function createAgentIntegrations(root, input = 'all') {
  const available = Object.keys(AGENT_TEMPLATE_TARGETS);
  const requested = normalizeAgentSelection(input, available);
  const unknown = requested.filter((name) => !AGENT_TEMPLATE_TARGETS[name]);
  if (unknown.length > 0) return { available, unknown, items: [] };

  const items = requested.map((name) => {
    const template = AGENT_TEMPLATE_TARGETS[name];
    const sourcePath = path.join(PACKAGE_ROOT, template.source);
    const targetPath = path.join(root, template.target);
    if (fs.existsSync(targetPath)) return { name, created: false, path: targetPath };

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, fs.readFileSync(sourcePath, 'utf8'));
    return { name, created: true, path: targetPath };
  });

  return { available, unknown: [], items };
}

function normalizeAgentSelection(input, available) {
  const text = String(input || 'all').trim().toLowerCase();
  if (!text || text === 'all') return available;
  return [...new Set(text.split(',').map((item) => item.trim()).filter(Boolean))];
}

export function collectFiles(root, config = {}, maxFiles = 900) {
  const ignore = new Set([...(config.ignore || []), ...DEFAULT_IGNORE]);
  const files = [];

  function shouldIgnore(filePath, dirent) {
    const name = dirent.name;
    if (ignore.has(name)) return true;
    const relative = path.relative(root, filePath).split(path.sep).join('/');
    return [...ignore].some((pattern) => pattern && relative.includes(pattern));
  }

  function walk(current) {
    if (files.length >= maxFiles) return;
    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (files.length >= maxFiles) break;
      const fullPath = path.join(current, entry.name);
      if (shouldIgnore(fullPath, entry)) continue;
      if (entry.isDirectory()) walk(fullPath);
      else if (entry.isFile() && isTextFile(fullPath)) files.push(fullPath);
    }
  }

  walk(root);
  return files;
}

export function readTextFiles(root, files) {
  return files.map((fullPath) => {
    const relative = path.relative(root, fullPath).split(path.sep).join('/');
    try {
      const stat = fs.statSync(fullPath);
      if (stat.size > 1_000_000) {
        return { fullPath, relative, content: '', skipped: 'large-file' };
      }
      return { fullPath, relative, content: fs.readFileSync(fullPath, 'utf8') };
    } catch (error) {
      return { fullPath, relative, content: '', skipped: error.message };
    }
  });
}

export function isTextFile(filePath) {
  const basename = path.basename(filePath);
  if (basename === 'Dockerfile' || basename === 'Makefile' || basename.startsWith('.env')) return true;
  return TEXT_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

export function relativePath(root, fullPath) {
  return path.relative(root, fullPath).split(path.sep).join('/');
}
