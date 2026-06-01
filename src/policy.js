import { RISK_PROFILES } from './constants.js';

export function buildPolicy(config, options) {
  const requestedProfile = options.profileProvided ? options.profile : (config.profile || options.profile || 'standard');
  const profileName = RISK_PROFILES[requestedProfile] ? requestedProfile : 'standard';
  const profile = RISK_PROFILES[profileName];
  const budgets = {
    ...(profile.budgets || {}),
    ...(config.budgets || {})
  };

  return {
    profileName,
    profileDescription: profile.description,
    failUnder: Number.isFinite(options.failUnder) ? options.failUnder : (Number.isFinite(config.failUnder) ? config.failUnder : profile.failUnder),
    budgets,
    suppressions: Array.isArray(config.suppressions) ? config.suppressions : [],
    severityOverrides: config.severityOverrides || {}
  };
}

export function applyPolicy(issues, policy) {
  const active = [];
  const suppressed = [];
  const policyIssues = [];

  for (const item of issues) {
    const override = policy.severityOverrides[item.id] || policy.severityOverrides[`${item.category}.${item.id}`];
    const candidate = override ? { ...item, severity: override, detail: appendDetail(item.detail, `Severity overridden to ${override}.`) } : item;
    const suppression = findSuppression(candidate, policy.suppressions);

    if (suppression) {
      suppressed.push({ ...candidate, suppression });
    } else {
      active.push(candidate);
    }
  }

  const counts = countBySeverity(active);
  for (const severity of ['critical', 'high', 'medium', 'low']) {
    const budget = policy.budgets?.[severity];
    if (Number.isFinite(budget) && counts[severity] > budget) {
      policyIssues.push({
        id: `policy.${severity}-budget-exceeded`,
        category: 'policy',
        severity: severity === 'critical' || severity === 'high' ? 'high' : 'medium',
        title: `${severity} finding budget exceeded`,
        file: null,
        line: null,
        detail: `${counts[severity]} ${severity} finding(s), budget is ${budget}.`,
        suggestion: 'Fix findings, increase the budget intentionally, or add documented suppressions with reasons.'
      });
    }
  }

  return {
    issues: [...active, ...policyIssues],
    suppressed,
    policyIssues,
    countsBeforeBudgets: counts
  };
}

function findSuppression(issue, suppressions) {
  const now = new Date();
  return suppressions.find((suppression) => {
    if (suppression.expires && !Number.isNaN(Date.parse(suppression.expires)) && new Date(suppression.expires) < now) return false;
    if (suppression.id && !matchPattern(suppression.id, issue.id)) return false;
    if (suppression.category && suppression.category !== issue.category) return false;
    if (suppression.file && !matchPattern(suppression.file, issue.file || '')) return false;
    return true;
  });
}

function matchPattern(pattern, value) {
  const source = String(pattern);
  const target = String(value);
  if (source === '*') return true;
  if (!source.includes('*')) return source === target;

  const parts = source.split('*');
  let cursor = 0;

  if (parts[0] && !target.startsWith(parts[0])) return false;
  if (parts.at(-1) && !target.endsWith(parts.at(-1))) return false;

  for (const part of parts) {
    if (!part) continue;
    const found = target.indexOf(part, cursor);
    if (found === -1) return false;
    cursor = found + part.length;
  }

  return true;
}

function countBySeverity(issues) {
  return issues.reduce((counts, issue) => {
    counts[issue.severity] = (counts[issue.severity] || 0) + 1;
    return counts;
  }, { critical: 0, high: 0, medium: 0, low: 0, info: 0 });
}

function appendDetail(detail, extra) {
  return detail ? `${detail} ${extra}` : extra;
}
