import { designIssue } from './static.js';
import {
  codexRequestHeaders,
  getCodexModelIds,
  pickCodexModel,
  resolveCodexAuth
} from './codex-auth.js';

const REVIEW_LENSES = [
  'brand fit',
  'originality',
  'product flow',
  'visual hierarchy',
  'typography',
  'color system',
  'spacing/layout',
  'component quality',
  'mobile realism',
  'accessibility',
  'content/microcopy',
  'delivery polish'
];

export async function runAiDesignReview(designConfig, browserAudit, staticIssues, env = process.env) {
  if (!designConfig.ai.enabled) return [];
  const severity = designConfig.ai.blocking ? 'medium' : 'info';
  const provider = await resolveAiProvider(designConfig.ai.provider, env);

  try {
    if (provider === 'codex-auth') {
      return await runCodexAuthDesignReview(designConfig, browserAudit, staticIssues, severity, env);
    }
    return await runOpenAiApiDesignReview(designConfig, browserAudit, staticIssues, severity, env);
  } catch (error) {
    return [designIssue({
      id: 'design.ai.request-failed',
      severity: 'info',
      title: 'AI design review could not run',
      detail: error.message,
      suggestion: 'Keep the local DesignGuard findings as the source of truth, then rerun --design-ai when the provider is reachable.',
      why: 'The AI layer is optional and must not block local CI by accident.'
    })];
  }
}

export async function renderDesignAiModelList(options = {}, env = process.env) {
  const provider = normalizeAiProvider(options.designAiProvider || env.AGENTPROOF_DESIGN_AI_PROVIDER || 'codex-auth');
  if (provider !== 'codex-auth' && provider !== 'auto') {
    return [
      'Design AI provider: openai-api',
      'AgentProof does not fetch the public OpenAI API model catalog here.',
      'Use --design-ai-model gpt-5-mini or set AGENTPROOF_DESIGN_AI_MODEL.'
    ].join('\n');
  }

  const auth = await resolveCodexAuth(env);
  if (!auth.ok) {
    return [
      'Design AI provider: codex-auth',
      `Status: not available (${auth.code})`,
      auth.message
    ].join('\n');
  }

  const models = await getCodexModelIds(auth.accessToken, env);
  const preferred = pickCodexModel(models, options.designAiModel || env.AGENTPROOF_DESIGN_AI_MODEL || '');
  return [
    'Design AI provider: codex-auth',
    `Auth: ${auth.authPath}`,
    `Preferred model: ${preferred}`,
    'Models:',
    ...models.map((model) => `- ${model}`)
  ].join('\n');
}

async function runOpenAiApiDesignReview(designConfig, browserAudit, staticIssues, severity, env) {
  if (!env.OPENAI_API_KEY) {
    return [designIssue({
      id: 'design.ai.not-configured',
      severity: 'info',
      title: 'OpenAI API design review requested but no API key is configured',
      detail: 'DesignGuard local rules still ran. The optional OpenAI API reviewer was skipped because OPENAI_API_KEY is missing.',
      suggestion: 'Set OPENAI_API_KEY and rerun with --design-ai --design-ai-provider openai-api, or use --design-ai-provider codex-auth after `codex login`.',
      why: 'AI review is intentionally optional so AgentProof remains local-first and open-source friendly.'
    })];
  }

  try {
    const prompt = buildPrompt(designConfig, browserAudit, staticIssues);
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(withReasoningEffort({
        model: designConfig.ai.model,
        store: false,
        instructions: 'You are a severe senior product design reviewer. Return concise, actionable critique only. Do not praise generic work.',
        input: prompt
      }, designConfig.ai.reasoning))
    });

    if (!response.ok) {
      return [designIssue({
        id: 'design.ai.request-failed',
        severity: 'info',
        title: 'AI design review request failed',
        detail: `OpenAI Responses API returned HTTP ${response.status}.`,
        suggestion: 'Check OPENAI_API_KEY, AGENTPROOF_DESIGN_AI_MODEL, rate limits, and network access. Deterministic DesignGuard findings are still authoritative.',
        why: 'Optional AI review should never make the local gate unusable.'
      })];
    }

    const payload = await response.json();
    const output = extractOutputText(payload);
    if (!output) return [];

    return [aiReviewIssue(output, severity, 'openai-api', designConfig.ai.model)];
  } catch (error) {
    return [designIssue({
      id: 'design.ai.request-failed',
      severity: 'info',
      title: 'AI design review could not run',
      detail: error.message,
      suggestion: 'Keep the local DesignGuard findings as the source of truth, then rerun --design-ai when the provider is reachable.',
      why: 'The AI layer is optional and must not block local CI by accident.'
    })];
  }
}

async function runCodexAuthDesignReview(designConfig, browserAudit, staticIssues, severity, env) {
  const auth = await resolveCodexAuth(env);
  if (!auth.ok) {
    return [designIssue({
      id: 'design.ai.codex-auth-not-configured',
      severity: 'info',
      title: 'Codex auth design review requested but Codex is not logged in',
      detail: auth.message,
      suggestion: 'Run `codex login`, then rerun with --design-ai --design-ai-provider codex-auth --design-ai-model gpt-5.3-codex-spark.',
      why: 'Codex auth lets AgentProof use your local Codex session without requiring OPENAI_API_KEY.'
    })];
  }

  const models = await getCodexModelIds(auth.accessToken, env);
  const model = pickCodexModel(models, designConfig.ai.model);
  const prompt = buildPrompt(designConfig, browserAudit, staticIssues);
  const response = await fetch(`${auth.baseUrl}/responses`, {
    method: 'POST',
    headers: {
      ...codexRequestHeaders(auth.accessToken),
      Accept: 'text/event-stream'
    },
    body: JSON.stringify(withReasoningEffort({
      model,
      store: false,
      stream: true,
      instructions: 'You are a severe senior product design reviewer. Return concise, actionable critique only. Do not praise generic work.',
      input: [{ role: 'user', content: prompt }]
    }, designConfig.ai.reasoning))
  });

  if (!response.ok) {
    const errorText = await safeResponseText(response);
    return [designIssue({
      id: 'design.ai.codex-request-failed',
      severity: 'info',
      title: 'Codex auth design review request failed',
      detail: `Codex backend returned HTTP ${response.status} for model ${model}.${errorText ? ` ${errorText}` : ''}`,
      suggestion: 'Run `agentproof --design-ai-provider codex-auth --design-ai-list-models`, choose an available model, then rerun. If the session expired, run `codex login`.',
      why: 'Codex auth uses the ChatGPT Codex backend, whose available model list depends on the logged-in account.',
      evidence: { provider: 'codex-auth', model, reasoning: designConfig.ai.reasoning || undefined, auth: auth.authPath, models: models.slice(0, 12) }
    })];
  }

  const output = extractOutputTextFromSse(await response.text());
  if (!output) return [];

  return [aiReviewIssue(output, severity, 'codex-auth', model, {
    reasoning: designConfig.ai.reasoning || undefined,
    auth: auth.authPath,
    refreshed: auth.refreshed,
    availableModels: models.slice(0, 12)
  })];
}

function withReasoningEffort(payload, effort) {
  if (!effort) return payload;
  return {
    ...payload,
    reasoning: { effort }
  };
}

async function safeResponseText(response) {
  try {
    const text = await response.text();
    return text.replace(/\s+/g, ' ').trim().slice(0, 220);
  } catch {
    return '';
  }
}

function buildPrompt(designConfig, browserAudit, staticIssues) {
  const measurements = (browserAudit.measurements || []).slice(0, 4).map((item) => ({
    route: item.route,
    viewport: item.viewport,
    title: item.title,
    h1: item.h1s?.[0]?.text || '',
    heroHeight: item.hero?.rect?.height || null,
    viewportHeight: item.viewport?.height || null,
    ctas: (item.ctas || []).slice(0, 6).map((cta) => cta.text),
    footerPresent: item.footerPresent,
    screenshot: item.screenshot
  }));

  return JSON.stringify({
    task: 'Review whether this UI is client-ready for an MVP delivery. Be strict.',
    productType: designConfig.type,
    strictness: designConfig.strictness,
    localFindings: staticIssues.slice(0, 20).map((issue) => ({
      id: issue.id,
      severity: issue.severity,
      title: issue.title,
      detail: issue.detail,
      suggestion: issue.suggestion
    })),
    browserMeasurements: measurements,
    reviewLenses: REVIEW_LENSES,
    expectedOutput: 'Return 3-6 concise blockers with exact fixes. If the UI is not client-ready, say why.'
  }, null, 2);
}

function aiReviewIssue(output, severity, provider, model, extraEvidence = {}) {
  return designIssue({
    id: 'design.ai.review',
    severity,
    title: 'Senior AI design reviewer feedback',
    detail: output.slice(0, 1200),
    suggestion: 'Use this qualitative review after fixing deterministic DesignGuard blockers. Treat blocking status as controlled by design.ai.blocking.',
    why: 'Some design failures are qualitative: generic positioning, weak hierarchy, unclear flow, or visual identity mismatch.',
    evidence: { source: 'optional AI review', provider, model, lenses: REVIEW_LENSES, ...extraEvidence }
  });
}

async function resolveAiProvider(provider, env) {
  const normalized = normalizeAiProvider(provider);
  if (normalized !== 'auto') return normalized;
  if (env.OPENAI_API_KEY) return 'openai-api';
  const codex = await resolveCodexAuth(env);
  return codex.ok ? 'codex-auth' : 'openai-api';
}

function normalizeAiProvider(value) {
  const input = String(value || '').trim().toLowerCase();
  if (['codex', 'codex-auth', 'openai-codex', 'chatgpt'].includes(input)) return 'codex-auth';
  if (['openai', 'openai-api', 'api'].includes(input)) return 'openai-api';
  if (input === 'auto') return 'auto';
  return 'openai-api';
}

function extractOutputText(payload) {
  if (typeof payload.output_text === 'string') return payload.output_text;
  if (!Array.isArray(payload.output)) return '';
  return payload.output
    .flatMap((item) => Array.isArray(item.content) ? item.content : [])
    .map((content) => content.text || content.output_text || '')
    .filter(Boolean)
    .join('\n')
    .trim();
}

function extractOutputTextFromSse(sseText) {
  const textParts = [];
  let completedText = '';
  for (const block of String(sseText || '').split(/\n\n+/)) {
    const data = block
      .split(/\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim())
      .join('\n');
    if (!data || data === '[DONE]') continue;
    let payload;
    try {
      payload = JSON.parse(data);
    } catch {
      continue;
    }
    const type = payload.type || payload.event || '';
    if (typeof payload.delta === 'string' && type.includes('output_text')) {
      textParts.push(payload.delta);
      continue;
    }
    const item = payload.item;
    if (item?.type === 'message') {
      const itemText = extractOutputText({ output: [item] });
      if (itemText) completedText = itemText;
    }
    if (payload.response) {
      const responseText = extractOutputText(payload.response);
      if (responseText) completedText = responseText;
    }
  }
  return (textParts.join('') || completedText).trim();
}
