import { VERSION } from './constants.js';

export function parseArgs(args) {
  const options = {
    path: '.',
    output: 'AGENT_PROOF_REPORT.md',
    json: false,
    failUnder: null,
    runScripts: true,
    observeOnly: false,
    maxFiles: 900,
    timeoutMs: 120000,
    githubComment: false,
    githubAnnotations: false,
    changed: false,
    base: 'origin/main',
    profile: 'standard',
    profileProvided: false,
    design: '',
    designUrl: '',
    designRoutes: '',
    designViewports: '',
    designLocale: '',
    designStrictness: '',
    designSource: '',
    designIgnore: '',
    designOnly: false,
    designAi: false,
    designAiProvider: '',
    designAiModel: '',
    designAiReasoning: '',
    designAiListModels: false,
    designFix: false,
    designImprove: false,
    designFixApply: false,
    designFixFromBrowser: false,
    designCloneOutput: '',
    designFixOutput: 'AGENT_PROOF_DESIGN_FIX.md',
    designImproveOutput: 'AGENT_PROOF_DESIGN_IMPROVEMENT.md',
    designTargetScore: null,
    designMaxPasses: 1,
    sarif: '',
    badge: '',
    html: '',
    prComment: '',
    receipt: '',
    summary: '',
    verifyReceipt: '',
    history: '',
    trend: '',
    claim: '',
    baseline: '',
    updateBaseline: '',
    rules: '',
    explain: '',
    recipes: false,
    troubleshoot: false,
    faq: false,
    claimTemplate: false,
    doctor: false,
    policyPacks: false,
    policyPack: '',
    agents: '',
    ci: false,
    agent: false,
    all: false,
    init: false,
    help: false,
    version: false
  };

  const inputArgs = [...args];
  if (inputArgs[0] === 'design-fix') {
    options.designFix = true;
    inputArgs.shift();
  } else if (inputArgs[0] === 'design-improve' || inputArgs[0] === 'improve-design') {
    options.designImprove = true;
    inputArgs.shift();
  }

  for (let index = 0; index < inputArgs.length; index += 1) {
    const arg = inputArgs[index];
    const next = inputArgs[index + 1];

    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--version' || arg === '-v') options.version = true;
    else if (arg === '--init') options.init = true;
    else if (arg === '--all') options.all = true;
    else if (arg === '--ci' || arg === '--init-ci') options.ci = true;
    else if (arg === '--agent' || arg === '--agent-contract') options.agent = true;
    else if (arg === '--doctor') options.doctor = true;
    else if (arg === '--recipes' || arg === '--examples') options.recipes = true;
    else if (arg === '--troubleshoot' || arg === '--troubleshooting') options.troubleshoot = true;
    else if (arg === '--faq') options.faq = true;
    else if (arg === '--claim-template') options.claimTemplate = true;
    else if (arg === '--policy-packs') options.policyPacks = true;
    else if (arg === '--policy-pack' && next && !next.startsWith('-')) {
      options.policyPack = next;
      index += 1;
    } else if (arg === '--agents') {
      options.agents = next && !next.startsWith('-') ? next : 'all';
      if (next && !next.startsWith('-')) index += 1;
    } else if (arg === '--rules') {
      options.rules = next && !next.startsWith('-') ? next : 'markdown';
      if (next && !next.startsWith('-')) index += 1;
    } else if (arg === '--explain' && next) {
      options.explain = next;
      index += 1;
    } else if (arg === '--trend') {
      options.trend = next && !next.startsWith('-') ? next : '.agentproof/history.jsonl';
      if (next && !next.startsWith('-')) index += 1;
    } else if (arg === '--update-baseline') {
      options.updateBaseline = next && !next.startsWith('-') ? next : '.agentproof/baseline.json';
      if (next && !next.startsWith('-')) index += 1;
    } else if ((arg === '--path' || arg === '-p') && next) {
      options.path = next;
      index += 1;
    } else if ((arg === '--output' || arg === '-o') && next) {
      options.output = next;
      index += 1;
    } else if (arg === '--json') options.json = true;
    else if (arg === '--github-comment') options.githubComment = true;
    else if (arg === '--github-annotations') options.githubAnnotations = true;
    else if (arg === '--changed') options.changed = true;
    else if (arg === '--design' && next) {
      options.design = next;
      index += 1;
    } else if (arg === '--design-only') {
      options.designOnly = true;
    } else if (arg === '--design-url' && next) {
      options.designUrl = next;
      index += 1;
    } else if (arg === '--design-routes' && next) {
      options.designRoutes = next;
      index += 1;
    } else if (arg === '--design-viewports' && next) {
      options.designViewports = next;
      index += 1;
    } else if (arg === '--design-locale' && next) {
      options.designLocale = next;
      index += 1;
    } else if (arg === '--design-source' && next) {
      options.designSource = next;
      index += 1;
    } else if (arg === '--design-ignore' && next) {
      options.designIgnore = next;
      index += 1;
    } else if (arg === '--design-strictness' && next) {
      options.designStrictness = next;
      index += 1;
    } else if (arg === '--design-ai') options.designAi = true;
    else if (arg === '--design-ai-provider' && next) {
      options.designAiProvider = next;
      index += 1;
    } else if (arg === '--design-ai-model' && next) {
      options.designAiModel = next;
      index += 1;
    } else if (arg === '--design-ai-reasoning' && next) {
      options.designAiReasoning = next;
      index += 1;
    } else if (arg === '--design-ai-list-models') options.designAiListModels = true;
    else if (arg === '--design-fix') options.designFix = true;
    else if (arg === '--design-improve') options.designImprove = true;
    else if (arg === '--apply') options.designFixApply = true;
    else if (arg === '--from-browser') options.designFixFromBrowser = true;
    else if (arg === '--clone-output' && next) {
      options.designCloneOutput = next;
      index += 1;
    }
    else if (arg === '--fix-output' && next) {
      options.designFixOutput = next;
      index += 1;
    }
    else if (arg === '--improve-output' && next) {
      options.designImproveOutput = next;
      index += 1;
    }
    else if (arg === '--target-score' && next) {
      options.designTargetScore = Number.parseInt(next, 10);
      index += 1;
    }
    else if (arg === '--max-passes' && next) {
      options.designMaxPasses = Number.parseInt(next, 10);
      index += 1;
    }
    else if (arg === '--observe-only' || arg === '--soft-fail') options.observeOnly = true;
    else if (arg === '--no-run-scripts') options.runScripts = false;
    else if (arg === '--base' && next) {
      options.base = next;
      index += 1;
    } else if (arg === '--profile' && next) {
      options.profile = next;
      options.profileProvided = true;
      index += 1;
    } else if (arg === '--sarif' && next) {
      options.sarif = next;
      index += 1;
    } else if (arg === '--badge' && next) {
      options.badge = next;
      index += 1;
    } else if (arg === '--html' && next) {
      options.html = next;
      index += 1;
    } else if (arg === '--pr-comment' && next) {
      options.prComment = next;
      index += 1;
    } else if (arg === '--receipt' && next) {
      options.receipt = next;
      index += 1;
    } else if (arg === '--summary' && next) {
      options.summary = next;
      index += 1;
    } else if (arg === '--verify-receipt' && next) {
      options.verifyReceipt = next;
      index += 1;
    } else if (arg === '--history' && next) {
      options.history = next;
      index += 1;
    } else if (arg === '--claim' && next) {
      options.claim = next;
      index += 1;
    } else if (arg === '--baseline' && next) {
      options.baseline = next;
      index += 1;
    } else if (arg === '--fail-under' && next) {
      options.failUnder = Number.parseInt(next, 10);
      index += 1;
    } else if (arg === '--max-files' && next) {
      options.maxFiles = Number.parseInt(next, 10);
      index += 1;
    } else if (arg === '--timeout' && next) {
      options.timeoutMs = Number.parseInt(next, 10) * 1000;
      index += 1;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (options.failUnder !== null && !Number.isFinite(options.failUnder)) options.failUnder = null;
  if (options.designTargetScore !== null && !Number.isFinite(options.designTargetScore)) options.designTargetScore = null;
  if (!Number.isFinite(options.designMaxPasses) || options.designMaxPasses < 1) options.designMaxPasses = 1;
  if (!Number.isFinite(options.maxFiles)) options.maxFiles = 900;
  if (!Number.isFinite(options.timeoutMs)) options.timeoutMs = 120000;

  return options;
}

export function helpText() {
  return `AgentProof ${VERSION}

Your AI agent says it is done. AgentProof tells you if it is shippable.

Usage:
  agentproof [options]
  agentproof design-fix [options]
  agentproof design-improve [options]

Options:
  -p, --path <dir>        Project directory to audit. Default: .
  -o, --output <file>     Markdown report path. Default: AGENT_PROOF_REPORT.md
      --doctor            Explain detected config and commands without running checks.
      --recipes           Print copy-paste command recipes.
      --examples          Alias for --recipes.
      --troubleshoot      Print first-run troubleshooting guidance.
      --faq               Print frequently asked questions.
      --claim-template    Print an evidence-scoped final claim template.
      --json              Print machine-readable JSON to stdout.
      --rules [format]    Print rule catalog as markdown or json.
      --explain <rule>    Explain one rule id, for example security.secret-pattern.
      --policy-packs      Print available starter policy packs.
      --policy-pack <name> With --init, create config from a starter policy pack.
      --agents [list]     With --init, install agent instruction templates. Default: all.
      --trend [file]      Print trend report from AgentProof history.
      --history <file>    Append this run to a JSONL history file.
      --fail-under <n>    Override the selected profile score threshold.
      --observe-only      Keep reports and verdicts, but always exit 0.
      --soft-fail         Alias for --observe-only.
      --changed           Scan only files changed against --base.
      --base <ref>        Base ref for --changed. Default: origin/main
      --profile <name>    Risk profile: relaxed, standard, strict. Default: standard
      --design <type>     Enable DesignGuard: landing, saas, dashboard, marketplace, ecommerce, webapp, mobile-app.
      --design-only       Run only DesignGuard. Keeps --path for source UI checks but excludes technical/docs/security gates.
      --design-url <url>  URL to render for DOM/CSS/screenshot proof. Falls back to static checks if unavailable.
      --design-routes <r> Comma-separated routes for DesignGuard. Default: /
      --design-viewports <v> Comma-separated viewports: mobile, tablet, desktop. Default: mobile,desktop
      --design-locale <l> Browser locale/Accept-Language for rendered audits, for example fr-FR.
      --design-source <files> Comma-separated source files/globs for static design checks.
      --design-ignore <paths> Comma-separated paths/fragments ignored by static design checks.
      --design-strictness <name> Design strictness: relaxed, standard, strict. Defaults to profile.
      --design-ai         Run optional AI design review.
      --design-ai-provider <p> AI provider: openai-api, codex-auth, or auto.
      --design-ai-model <m> AI model override, for example gpt-5-mini or gpt-5.3-codex-spark.
      --design-ai-reasoning <effort> Reasoning effort for supported models: minimal, low, medium, high, xhigh.
      --design-ai-list-models List available Codex auth models and exit.
      --design-fix       Generate an AI rewrite for selected UI files.
      --design-improve   Audit, generate improvement brief, run DesignFix, then re-audit.
      --apply            With design-fix, rewrite files and create .agentproof/design-fix-backups.
      --from-browser     With design-fix, clone the rendered page from --design-url, then improve it.
      --clone-output <dir> With --from-browser, directory for generated standalone files.
      --fix-output <file> Markdown DesignFix report path. Default: AGENT_PROOF_DESIGN_FIX.md
      --improve-output <file> Markdown DesignImprove report path. Default: AGENT_PROOF_DESIGN_IMPROVEMENT.md
      --target-score <n> Target DesignGate score for design-improve. Default: max(90, fail-under).
      --max-passes <n>   Maximum AI improvement passes. Default: 1.
      --baseline <file>   Exclude known findings from the active score.
      --update-baseline [file] Write current findings as known debt.
      --sarif <file>      Write SARIF output for GitHub Code Scanning.
      --badge <file>      Write an SVG score badge.
      --html <file>       Write a self-contained HTML report.
      --pr-comment <file> Write a compact Markdown PR comment.
      --receipt <file>    Write a portable JSON evidence receipt.
      --summary <file>    Write a compact JSON summary for bots and dashboards.
      --verify-receipt <file> Verify a JSON evidence receipt.
      --claim <text|file> Audit an agent's final claim against local evidence.
      --no-run-scripts    Skip package test/lint/typecheck/build scripts.
      --max-files <n>     Max text files to scan. Default: 900
      --timeout <sec>     Per-command timeout. Default: 120
      --github-comment    Append compact PR summary to GITHUB_STEP_SUMMARY when available.
      --github-annotations Emit GitHub log annotations for active findings.
      --init              Create agentproof.config.json in the target project.
      --all               With --init, create config, CI, agent contract, and agent templates.
      --ci, --init-ci     With --init, also create .github/workflows/agentproof.yml.
      --agent             With --init, also create .agentproof/AGENT_CONTRACT.md.
  -h, --help              Show help.
  -v, --version           Show version.

Examples:
  agentproof --init --all
  agentproof --init --ci --agent
  agentproof --policy-packs
  agentproof --recipes
  agentproof --troubleshoot
  agentproof --faq
  agentproof --claim-template
  agentproof --init --policy-pack strict-client-delivery --ci --agent
  agentproof --init --agents codex,cursor,claude,copilot
  agentproof --doctor
  agentproof --receipt agentproof-receipt.json
  agentproof --summary agentproof-summary.json
  agentproof --verify-receipt agentproof-receipt.json
  agentproof --explain security.secret-pattern
  agentproof --history .agentproof/history.jsonl
  agentproof --trend .agentproof/history.jsonl
  agentproof --path . --baseline .agentproof/baseline.json --profile strict
  agentproof --path . --profile strict --observe-only
  agentproof --path . --design saas --design-url http://localhost:3000 --profile strict --fail-under 90
  agentproof --path . --design-only --design landing --design-url http://localhost:3000 --design-source index.html,styles.css,script.js --profile strict
  agentproof --path . --design marketplace --design-url http://localhost:3000 --design-ai
  agentproof --design-ai-provider codex-auth --design-ai-list-models
  agentproof --path . --design landing --design-url http://localhost:3000 --design-ai --design-ai-provider codex-auth --design-ai-model gpt-5.5 --design-ai-reasoning xhigh
  agentproof design-improve --path ./homepage --design landing --design-url http://localhost:3000 --design-ai-provider codex-auth --design-ai-model gpt-5.5 --design-ai-reasoning xhigh --target-score 90 --apply
  agentproof design-fix --path . --from-browser --design landing --design-url https://example.com --design-locale fr-FR --clone-output ./cloned-landing --design-ai-provider codex-auth --apply
  agentproof design-fix --path ./landing-site --design landing --design-url http://localhost:3000 --design-ai-provider codex-auth --design-ai-model gpt-5.3-codex-spark
  agentproof design-fix --path ./landing-site --design landing --design-url http://localhost:3000 --design-ai-provider codex-auth --apply
  agentproof design-fix --path . --from-browser --design landing --design-url https://example.com --clone-output ./cloned-landing --design-ai-provider codex-auth --apply
  agentproof --path . --github-annotations
`;
}
