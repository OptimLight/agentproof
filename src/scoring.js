import { SEVERITY_RANK, SEVERITY_WEIGHT } from './constants.js';

export function scoreIssues(issues, failUnder) {
  const penalty = issues.reduce((sum, issue) => sum + (SEVERITY_WEIGHT[issue.severity] || 0), 0);
  const score = Math.max(0, 100 - penalty);
  const counts = countBySeverity(issues);
  const verdict = verdictFor(score, counts);
  const exitCode = score < failUnder || counts.critical > 0 ? 1 : 0;

  return { score, penalty, counts, verdict, exitCode };
}

export function sortIssues(issues) {
  return [...issues].sort((a, b) => {
    const rank = (SEVERITY_RANK[a.severity] ?? 99) - (SEVERITY_RANK[b.severity] ?? 99);
    if (rank !== 0) return rank;
    return `${a.category}.${a.id}`.localeCompare(`${b.category}.${b.id}`);
  });
}

function countBySeverity(issues) {
  return issues.reduce((counts, issue) => {
    counts[issue.severity] = (counts[issue.severity] || 0) + 1;
    return counts;
  }, { critical: 0, high: 0, medium: 0, low: 0, info: 0 });
}

function verdictFor(score, counts) {
  if (counts.critical > 0 || score < 50) return 'DO NOT SHIP';
  if (score < 75 || counts.high > 0) return 'FIX BEFORE MERGE';
  if (score < 90 || counts.medium > 0) return 'SHIP WITH CARE';
  return 'SHIP';
}
