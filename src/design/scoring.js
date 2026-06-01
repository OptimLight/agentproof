import { SEVERITY_WEIGHT } from '../constants.js';

const EMPTY_COUNTS = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };

export function scoreDesignIssues(issues, designConfig) {
  if (!designConfig?.enabled) {
    return {
      enabled: false,
      score: null,
      penalty: 0,
      counts: { ...EMPTY_COUNTS },
      verdict: 'NOT RUN',
      exitCode: 0,
      failUnder: null
    };
  }

  const penalty = issues.reduce((sum, issue) => sum + (SEVERITY_WEIGHT[issue.severity] || 0), 0);
  const score = Math.max(0, 100 - penalty);
  const counts = countBySeverity(issues);
  const failUnder = designConfig.failUnder;
  const verdict = designVerdict(score, counts, failUnder);
  const exitCode = counts.critical > 0 || counts.high > 0 || score < failUnder ? 1 : 0;

  return { enabled: true, score, penalty, counts, verdict, exitCode, failUnder };
}

export function finalizeDesignResult(designAudit, activeIssues) {
  const designIssues = activeIssues.filter((issue) => issue.category === 'design');
  return {
    ...designAudit,
    issues: designIssues,
    scoring: scoreDesignIssues(designIssues, designAudit?.config)
  };
}

export function composeFinalScoring(allScoring, technicalScoring, designScoring) {
  if (!designScoring?.enabled) return allScoring;
  const exitCode = technicalScoring.exitCode || designScoring.exitCode || allScoring.exitCode ? 1 : 0;
  let verdict = allScoring.verdict;

  if (technicalScoring.exitCode !== 0) {
    verdict = technicalScoring.verdict;
  } else if (designScoring.exitCode !== 0) {
    verdict = designScoring.verdict === 'DO NOT SHIP' ? 'DO NOT SHIP' : 'DESIGN REVIEW REQUIRED';
  } else if (allScoring.score < 90 || allScoring.counts.medium > 0) {
    verdict = allScoring.verdict;
  } else {
    verdict = 'SHIP';
  }

  return {
    ...allScoring,
    verdict,
    exitCode,
    technical: technicalScoring,
    design: designScoring
  };
}

export function skippedTechnicalScoring() {
  return {
    score: null,
    penalty: 0,
    counts: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
    verdict: 'NOT RUN',
    exitCode: 0
  };
}

function designVerdict(score, counts, failUnder) {
  if (counts.critical > 0 || score < 50) return 'DO NOT SHIP';
  if (counts.high > 0 || score < failUnder) return 'DESIGN REVIEW REQUIRED';
  if (counts.medium > 0 || score < 90) return 'SHIP WITH CARE';
  return 'SHIP';
}

function countBySeverity(issues) {
  return issues.reduce((counts, issue) => {
    counts[issue.severity] = (counts[issue.severity] || 0) + 1;
    return counts;
  }, { ...EMPTY_COUNTS });
}
