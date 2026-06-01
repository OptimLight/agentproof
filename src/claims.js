import fs from 'node:fs';
import path from 'node:path';

export function loadClaim(root, claimInput) {
  if (!claimInput) return null;

  const candidate = path.resolve(root, claimInput);
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    return {
      source: path.relative(root, candidate).split(path.sep).join('/'),
      text: fs.readFileSync(candidate, 'utf8'),
      fromFile: true
    };
  }

  return {
    source: 'inline claim',
    text: claimInput,
    fromFile: false
  };
}

export function auditClaims(claim, commands, existingIssues) {
  if (!claim || !claim.text.trim()) return [];

  const text = claim.text;
  const lower = text.toLowerCase();
  const issues = [];
  const highOrCritical = existingIssues.filter((item) => item.severity === 'critical' || item.severity === 'high');

  if (mentionsTests(lower) && !commandPassed(commands, 'test')) {
    issues.push(claimIssue({
      id: 'claims.unproven-tests',
      severity: 'high',
      title: 'Agent claimed tests passed without local proof',
      claim,
      pattern: /(tests? (passed|pass|green)|test suite passed|verified with tests|all tests passed)/i,
      detail: 'The final claim mentions passing tests, but AgentProof did not observe a passing test command.',
      suggestion: 'Run the project test command or remove the claim.'
    }));
  }

  if (mentionsBuild(lower) && !commandPassed(commands, 'build')) {
    issues.push(claimIssue({
      id: 'claims.unproven-build',
      severity: 'high',
      title: 'Agent claimed build readiness without local proof',
      claim,
      pattern: /(build (passed|passes|green|succeeds|succeeded)|production[- ]ready|ready to deploy)/i,
      detail: 'The final claim implies build or production readiness, but no passing build command was observed.',
      suggestion: 'Run the build or change the final message to reflect the actual evidence.'
    }));
  }

  if (mentionsLint(lower) && !commandPassed(commands, 'lint')) {
    issues.push(claimIssue({
      id: 'claims.unproven-lint',
      severity: 'medium',
      title: 'Agent claimed lint passed without local proof',
      claim,
      pattern: /(lint (passed|passes|green|clean)|no lint errors)/i,
      detail: 'The final claim mentions lint success, but AgentProof did not observe a passing lint command.',
      suggestion: 'Run lint or remove the lint claim.'
    }));
  }

  if (mentionsTypecheck(lower) && !commandPassed(commands, 'typecheck')) {
    issues.push(claimIssue({
      id: 'claims.unproven-typecheck',
      severity: 'medium',
      title: 'Agent claimed typecheck passed without local proof',
      claim,
      pattern: /(typecheck|type check|types passed|typescript passed)/i,
      detail: 'The final claim mentions type safety, but AgentProof did not observe a passing typecheck command.',
      suggestion: 'Run typecheck or remove the type-safety claim.'
    }));
  }

  if (claimsDone(lower) && highOrCritical.length > 0) {
    issues.push(claimIssue({
      id: 'claims.done-conflicts-with-findings',
      severity: 'high',
      title: 'Agent claimed completion despite blocking findings',
      claim,
      pattern: /(done|complete|completed|ready|ship|shippable|finished|production[- ]ready)/i,
      detail: `The claim sounds final, but AgentProof found ${highOrCritical.length} high or critical issue(s).`,
      suggestion: 'Do not present this as complete until blockers are fixed or explicitly accepted.'
    }));
  }

  if (claimsNoIssues(lower) && existingIssues.length > 0) {
    issues.push(claimIssue({
      id: 'claims.no-issues-conflicts-with-report',
      severity: 'medium',
      title: 'Agent claimed no issues despite AgentProof findings',
      claim,
      pattern: /(no issues|no blockers|no errors|nothing left|all good|clean)/i,
      detail: `The claim says there are no issues, but AgentProof found ${existingIssues.length} finding(s).`,
      suggestion: 'Summarize the actual findings instead of claiming a clean state.'
    }));
  }

  return issues.filter(Boolean);
}

function commandPassed(commands, name) {
  return commands.some((command) => (command.name === name || command.kind === name || command.name.endsWith(`-${name}`)) && command.status === 'passed');
}

function mentionsTests(text) {
  return /(tests? (passed|pass|green)|test suite passed|verified with tests|all tests passed)/i.test(text);
}

function mentionsBuild(text) {
  return /(build (passed|passes|green|succeeds|succeeded)|production[- ]ready|ready to deploy)/i.test(text);
}

function mentionsLint(text) {
  return /(lint (passed|passes|green|clean)|no lint errors)/i.test(text);
}

function mentionsTypecheck(text) {
  return /(typecheck|type check|types passed|typescript passed)/i.test(text);
}

function claimsDone(text) {
  return /(done|complete|completed|ready|ship|shippable|finished|production[- ]ready)/i.test(text);
}

function claimsNoIssues(text) {
  return /(no issues|no blockers|no errors|nothing left|all good|clean)/i.test(text);
}

function claimIssue({ id, severity, title, claim, pattern, detail, suggestion }) {
  const match = claim.text.match(pattern);
  if (!match) return null;

  return {
    id,
    category: 'claims',
    severity,
    title,
    file: claim.fromFile ? claim.source : null,
    line: match.index == null ? 1 : lineOf(claim.text, match.index),
    detail,
    suggestion
  };
}

function lineOf(content, index) {
  return content.slice(0, Math.max(0, index)).split('\n').length;
}
