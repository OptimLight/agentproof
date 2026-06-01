export const DESIGN_TYPES = new Set([
  'landing',
  'saas',
  'dashboard',
  'marketplace',
  'ecommerce',
  'webapp',
  'mobile-app'
]);

export const VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 960 }
};

export const DESIGN_FAIL_UNDER = {
  relaxed: 70,
  standard: 80,
  strict: 85
};

export function resolveDesignConfig(config = {}, options = {}) {
  const source = config.design && typeof config.design === 'object' ? config.design : {};
  const ai = source.ai && typeof source.ai === 'object' ? source.ai : {};
  const enabled = Boolean(options.designOnly || options.design || source.enabled);
  const requestedType = normalizeType(options.design || source.type || 'webapp');
  const type = DESIGN_TYPES.has(requestedType) ? requestedType : 'webapp';
  const strictness = normalizeStrictness(options.designStrictness || source.strictness || config.profile || options.profile || 'standard');
  const routes = parseList(options.designRoutes) || normalizeList(source.routes) || ['/'];
  const sourceFiles = parseList(options.designSource) || normalizeList(source.source) || null;
  const ignore = parseList(options.designIgnore) || normalizeList(source.ignore) || [];
  const viewports = normalizeViewports(parseList(options.designViewports) || normalizeList(source.viewports), type);
  const url = String(options.designUrl || source.url || '').trim();
  const locale = normalizeLocale(options.designLocale || source.locale || process.env.AGENTPROOF_DESIGN_LOCALE || '');
  const aiEnabled = Boolean(options.designAi || ai.enabled);
  const aiBlocking = Boolean(ai.blocking);
  const aiProvider = normalizeAiProvider(options.designAiProvider || ai.provider || process.env.AGENTPROOF_DESIGN_AI_PROVIDER || 'openai-api');
  const aiModel = String(options.designAiModel || ai.model || process.env.AGENTPROOF_DESIGN_AI_MODEL || '').trim();
  const aiReasoning = normalizeAiReasoning(options.designAiReasoning || ai.reasoning || ai.reasoningEffort || process.env.AGENTPROOF_DESIGN_AI_REASONING || '');

  return {
    enabled,
    type,
    invalidType: requestedType !== type ? requestedType : '',
    url,
    locale,
    routes,
    source: sourceFiles,
    ignore,
    viewports,
    strictness,
    failUnder: Number.isFinite(source.failUnder) ? source.failUnder : DESIGN_FAIL_UNDER[strictness],
    ai: {
      enabled: aiEnabled,
      blocking: aiBlocking,
      provider: aiProvider,
      model: aiModel || (aiProvider === 'codex-auth' ? '' : 'gpt-5-mini'),
      reasoning: aiReasoning
    }
  };
}

export function viewportSize(name) {
  return VIEWPORTS[name] || VIEWPORTS.desktop;
}

export function isDesignType(value) {
  return DESIGN_TYPES.has(normalizeType(value));
}

function normalizeType(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeStrictness(value) {
  const input = String(value || '').trim().toLowerCase();
  if (input === 'relaxed' || input === 'standard' || input === 'strict') return input;
  return 'standard';
}

function normalizeAiProvider(value) {
  const input = String(value || '').trim().toLowerCase();
  if (['codex', 'codex-auth', 'openai-codex', 'chatgpt'].includes(input)) return 'codex-auth';
  if (['openai', 'openai-api', 'api'].includes(input)) return 'openai-api';
  if (input === 'auto') return 'auto';
  return 'openai-api';
}

function normalizeAiReasoning(value) {
  const input = String(value || '').trim().toLowerCase();
  if (['minimal', 'low', 'medium', 'high', 'xhigh'].includes(input)) return input;
  return '';
}

function normalizeLocale(value) {
  const input = String(value || '').trim();
  if (!input) return '';
  const aliases = {
    fr: 'fr-FR',
    en: 'en-US',
    ru: 'ru-RU',
    de: 'de-DE',
    es: 'es-ES',
    it: 'it-IT'
  };
  return aliases[input.toLowerCase()] || input;
}

function normalizeViewports(values, type) {
  const defaults = type === 'mobile-app' ? ['mobile'] : ['mobile', 'desktop'];
  const list = values?.length ? values : defaults;
  const normalized = list.map((item) => String(item).trim().toLowerCase()).filter((item) => VIEWPORTS[item]);
  return normalized.length ? [...new Set(normalized)] : defaults;
}

function normalizeList(value) {
  if (!Array.isArray(value)) return null;
  const list = value.map((item) => String(item).trim()).filter(Boolean);
  return list.length ? list : null;
}

function parseList(value) {
  if (!value) return null;
  const list = String(value).split(',').map((item) => item.trim()).filter(Boolean);
  return list.length ? list : null;
}
