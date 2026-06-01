import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, helpText } from './cli.js';
import { VERSION } from './constants.js';
import { collectFiles, createAgentContract, createAgentIntegrations, createDefaultConfig, createGithubWorkflow, loadConfig, readTextFiles, resolveTargetPath } from './files.js';
import { runStaticChecks } from './checks.js';
import { commandResultsToIssues, runProjectCommands } from './verification.js';
import { scoreIssues } from './scoring.js';
import { runDesignGuard } from './design/index.js';
import { renderDesignAiModelList } from './design/ai-review.js';
import { renderDesignFixConsole, runDesignFix } from './design/fix.js';
import { renderDesignImproveConsole, runDesignImprove } from './design/improve.js';
import { composeFinalScoring, finalizeDesignResult, skippedTechnicalScoring } from './design/scoring.js';
import { renderConsoleSummary, renderMarkdownReport } from './report.js';
import { getChangedTextFiles } from './git.js';
import { renderSarif } from './sarif.js';
import { renderBadge } from './badge.js';
import { loadClaim, auditClaims } from './claims.js';
import { renderHtmlReport } from './html.js';
import { renderPrComment } from './pr-comment.js';
import { buildPolicy, applyPolicy } from './policy.js';
import { RULES, renderRuleExplanation, renderRulesMarkdown } from './rules.js';
import { applyBaseline, loadBaseline, writeBaseline } from './baseline.js';
import { appendHistory, renderTrend } from './history.js';
import { renderDoctor } from './doctor.js';
import { renderReceipt } from './receipt.js';
import { verifyReceipt } from './receipt-verify.js';
import { getPolicyPack, renderPolicyPacksMarkdown } from './policy-packs.js';
import { renderSummary } from './summary.js';
import { renderRecipes } from './recipes.js';
import { renderTroubleshooting } from './troubleshooting.js';
import { renderGithubAnnotations } from './github-annotations.js';
import { renderFaq } from './faq.js';
import { renderClaimTemplate } from './claim-template.js';

export async function runAgentProof(args, cwd, env) {
  let options;
  try {
    options = parseArgs(args);
  } catch (error) {
    console.error(error.message);
    console.error('Run `agentproof --help` for usage.');
    return { exitCode: 2 };
  }

  if (options.help) {
    console.log(helpText());
    return { exitCode: 0 };
  }

  if (options.version) {
    console.log(VERSION);
    return { exitCode: 0 };
  }

  if (options.designAiListModels) {
    console.log(await renderDesignAiModelList(options, env));
    return { exitCode: 0 };
  }

  if (options.policyPacks) {
    console.log(renderPolicyPacksMarkdown());
    return { exitCode: 0 };
  }

  if (options.recipes) {
    console.log(renderRecipes());
    return { exitCode: 0 };
  }

  if (options.troubleshoot) {
    console.log(renderTroubleshooting());
    return { exitCode: 0 };
  }

  if (options.faq) {
    console.log(renderFaq());
    return { exitCode: 0 };
  }

  if (options.claimTemplate) {
    console.log(renderClaimTemplate());
    return { exitCode: 0 };
  }

  if (options.rules) {
    if (options.rules === 'json') console.log(JSON.stringify(RULES, null, 2));
    else console.log(renderRulesMarkdown());
    return { exitCode: 0 };
  }

  if (options.explain) {
    console.log(renderRuleExplanation(options.explain));
    return { exitCode: 0 };
  }

  if (options.verifyReceipt) {
    const verification = verifyReceipt(cwd, options.verifyReceipt);
    console.log(verification.output);
    return { exitCode: verification.exitCode };
  }

  if (options.policyPack && !options.init) {
    console.error('`--policy-pack` must be used with `--init`.');
    console.error('Run `agentproof --policy-packs` to see available starter packs.');
    return { exitCode: 2 };
  }

  if (options.agents && !options.init) {
    console.error('`--agents` must be used with `--init`.');
    console.error('Example: `agentproof --init --agents codex,cursor,claude,copilot`.');
    return { exitCode: 2 };
  }

  if (options.all && !options.init) {
    console.error('`--all` must be used with `--init`.');
    console.error('Example: `agentproof --init --all`.');
    return { exitCode: 2 };
  }

  const target = resolveTargetPath(cwd, options.path);
  if ((options.designFix || options.designImprove) && options.designFixFromBrowser && !fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
    console.error(`Target path is not a directory: ${target}`);
    return { exitCode: 2 };
  }

  if (options.trend) {
    console.log(renderTrend(target, options.trend));
    return { exitCode: 0 };
  }

  if (options.init) {
    let selectedPack = null;
    const effectivePolicyPack = options.policyPack || (options.all ? 'standard-pr-gate' : '');
    if (effectivePolicyPack) {
      selectedPack = getPolicyPack(effectivePolicyPack);
      if (!selectedPack) {
        console.error(`Unknown policy pack: ${effectivePolicyPack}`);
        console.error('Run `agentproof --policy-packs` to see available starter packs.');
        return { exitCode: 2 };
      }
    }

    const init = createDefaultConfig(target, selectedPack?.config);
    const packLabel = selectedPack ? ` from policy pack ${effectivePolicyPack}` : '';
    console.log(init.created ? `Created ${init.path}${packLabel}` : `Already exists: ${init.path}`);
    if (options.ci || options.all) {
      const workflow = createGithubWorkflow(target);
      console.log(workflow.created ? `Created ${workflow.path}` : `Already exists: ${workflow.path}`);
    }
    if (options.agent || options.all) {
      const contract = createAgentContract(target);
      console.log(contract.created ? `Created ${contract.path}` : `Already exists: ${contract.path}`);
    }
    const agentSelection = options.agents || (options.all ? 'all' : '');
    if (agentSelection) {
      const integrations = createAgentIntegrations(target, agentSelection);
      if (integrations.unknown.length > 0) {
        console.error(`Unknown agent template(s): ${integrations.unknown.join(', ')}`);
        console.error(`Available templates: ${integrations.available.join(', ')}`);
        return { exitCode: 2 };
      }
      for (const item of integrations.items) {
        console.log(item.created ? `Created ${item.path}` : `Already exists: ${item.path}`);
      }
    }
    return { exitCode: 0 };
  }

  const configResult = loadConfig(target);
  const config = configResult.config || {};
  const policy = buildPolicy(config, options);
  const maxFiles = Number.isFinite(config.maxFiles) ? config.maxFiles : options.maxFiles;
  const timeoutMs = Number.isFinite(config.commandTimeoutSeconds) ? config.commandTimeoutSeconds * 1000 : options.timeoutMs;
  const failUnder = policy.failUnder;

  if (options.doctor) {
    console.log(renderDoctor(target, config, policy));
    return { exitCode: 0 };
  }

  const changedResult = options.changed ? getChangedTextFiles(target, options.base) : null;
  const files = options.changed ? changedResult.files : collectFiles(target, config, maxFiles);
  const textFiles = readTextFiles(target, files);

  if (options.designImprove) {
    const improveResult = await runDesignImprove(target, textFiles, config, options, env);
    console.log(renderDesignImproveConsole(improveResult));
    return { exitCode: improveResult.ok ? 0 : 1 };
  }

  if (options.designFix) {
    const fixRoot = options.designFixFromBrowser && options.designCloneOutput
      ? path.resolve(target, options.designCloneOutput)
      : target;
    if (options.designFixFromBrowser) fs.mkdirSync(fixRoot, { recursive: true });
    const designAudit = await runDesignGuard(target, textFiles, config, {
      ...options,
      designOnly: true,
      designAi: false
    }, env);
    const fixResult = await runDesignFix(fixRoot, textFiles, config, options, designAudit, env);
    console.log(renderDesignFixConsole(fixResult));
    return { exitCode: fixResult.ok ? 0 : 1 };
  }

  const commandOptions = { ...options, timeoutMs, config };
  const commands = options.designOnly
    ? [{ name: 'TechnicalGate', status: 'skipped', command: 'disabled by --design-only', language: 'all' }]
    : runProjectCommands(target, commandOptions);
  const designAudit = await runDesignGuard(target, textFiles, config, options, env);
  const baseIssues = [
    ...(options.designOnly ? [] : (changedResult?.issue ? [changedResult.issue] : [])),
    ...(options.designOnly ? [] : runStaticChecks(target, textFiles, configResult)),
    ...designAudit.issues,
    ...(options.designOnly ? [] : commandResultsToIssues(commands))
  ];
  const claim = options.designOnly ? null : loadClaim(target, options.claim);
  const rawIssues = options.designOnly ? baseIssues : [...baseIssues, ...auditClaims(claim, commands, baseIssues)];
  const baselinePath = options.baseline || config.baseline || '';
  const baseline = loadBaseline(target, baselinePath);
  const baselineResult = applyBaseline(rawIssues, baseline);
  const policyResult = applyPolicy(baselineResult.issues, policy);
  const issues = policyResult.issues;
  const technicalIssues = issues.filter((issue) => issue.category !== 'design');
  const technicalScoring = options.designOnly ? skippedTechnicalScoring() : scoreIssues(technicalIssues, failUnder);
  const design = finalizeDesignResult(designAudit, issues);
  const scoring = composeFinalScoring(scoreIssues(issues, failUnder), technicalScoring, design.scoring);
  const reportPath = path.resolve(target, options.output);
  const baselineUpdate = options.updateBaseline ? writeBaseline(target, options.updateBaseline, rawIssues) : null;

  const result = {
    target,
    reportPath,
    scanMode: options.changed ? 'changed' : 'full',
    base: options.changed ? options.base : null,
    scannedFiles: files.length,
    commands,
    claim,
    designOnly: options.designOnly,
    policy,
    baseline: baseline ? {
      path: baseline.path,
      exists: baseline.exists,
      entries: baseline.entries.length,
      matched: baselineResult.matched.length,
      updated: baselineUpdate
    } : null,
    baselineIssues: baselineResult.matched,
    suppressedIssues: policyResult.suppressed,
    policyIssues: policyResult.policyIssues,
    issues,
    technicalScoring,
    design,
    scoring,
    observeOnly: options.observeOnly,
    effectiveExitCode: options.observeOnly ? 0 : scoring.exitCode,
    failUnder
  };

  const markdown = renderMarkdownReport(result);
  const prComment = renderPrComment(result);
  fs.writeFileSync(reportPath, markdown);

  if (options.prComment) {
    result.prCommentPath = path.resolve(target, options.prComment);
    fs.writeFileSync(result.prCommentPath, prComment);
  }

  if (options.sarif) {
    result.sarifPath = path.resolve(target, options.sarif);
    fs.writeFileSync(result.sarifPath, renderSarif(result));
  }

  if (options.badge) {
    result.badgePath = path.resolve(target, options.badge);
    fs.writeFileSync(result.badgePath, renderBadge(scoring));
  }

  if (options.html) {
    result.htmlPath = path.resolve(target, options.html);
    fs.writeFileSync(result.htmlPath, renderHtmlReport(result));
  }

  if (options.history) {
    result.history = appendHistory(target, options.history, result);
  }

  if (options.receipt) {
    result.receiptPath = path.resolve(target, options.receipt);
    fs.writeFileSync(result.receiptPath, renderReceipt(result));
  }

  if (options.summary) {
    result.summaryPath = path.resolve(target, options.summary);
    fs.writeFileSync(result.summaryPath, renderSummary(result));
  }

  if (options.githubComment && env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(env.GITHUB_STEP_SUMMARY, `\n${prComment}\n`);
  }

  if (options.githubAnnotations) {
    const annotations = renderGithubAnnotations(result);
    if (annotations) console.error(annotations);
  }

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(renderConsoleSummary(result));
    if (options.observeOnly && scoring.exitCode !== 0) {
      console.log('\nObserve-only mode: verdict preserved, exit code forced to 0.');
    }
  }

  return { exitCode: result.effectiveExitCode };
}
