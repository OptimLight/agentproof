import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DEFAULT_CODEX_BASE_URL = 'https://chatgpt.com/backend-api/codex';
const CODEX_OAUTH_CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann';
const CODEX_OAUTH_TOKEN_URL = 'https://auth.openai.com/oauth/token';
const CODEX_REFRESH_SKEW_SECONDS = 120;

const DEFAULT_CODEX_MODELS = [
  'gpt-5.5',
  'gpt-5.4-mini',
  'gpt-5.4',
  'gpt-5.3-codex',
  'gpt-5.3-codex-spark'
];

const FORWARD_COMPAT_MODELS = [
  ['gpt-5.5', ['gpt-5.4', 'gpt-5.4-mini', 'gpt-5.3-codex']],
  ['gpt-5.4-mini', ['gpt-5.3-codex']],
  ['gpt-5.4', ['gpt-5.3-codex']],
  ['gpt-5.3-codex-spark', ['gpt-5.3-codex']]
];

export function codexAuthPath(env = process.env) {
  const home = String(env.CODEX_HOME || '').trim() || path.join(os.homedir(), '.codex');
  return path.join(home, 'auth.json');
}

export function codexBaseUrl(env = process.env) {
  return String(env.AGENTPROOF_CODEX_BASE_URL || env.CODEX_BASE_URL || DEFAULT_CODEX_BASE_URL).trim().replace(/\/+$/, '');
}

export async function resolveCodexAuth(env = process.env) {
  const authPath = codexAuthPath(env);
  const payload = readCodexAuthPayload(authPath);
  if (!payload.ok) return payload;

  const tokens = payload.auth.tokens;
  const accessToken = String(tokens.access_token || '').trim();
  const refreshToken = String(tokens.refresh_token || '').trim();
  if (!accessToken) {
    return {
      ok: false,
      code: 'codex_auth_missing_access_token',
      message: 'Codex auth exists, but it has no access token. Run `codex login` or open Codex once, then rerun AgentProof.',
      authPath
    };
  }

  if (!isAccessTokenExpiring(accessToken, CODEX_REFRESH_SKEW_SECONDS)) {
    return { ok: true, accessToken, refreshToken, authPath, baseUrl: codexBaseUrl(env), refreshed: false };
  }

  if (!refreshToken) {
    return {
      ok: false,
      code: 'codex_auth_missing_refresh_token',
      message: 'Codex access token is expired and the local auth file has no refresh token. Run `codex login`, then rerun AgentProof.',
      authPath
    };
  }

  const refreshed = await refreshCodexTokens(refreshToken);
  if (!refreshed.ok) {
    return {
      ok: false,
      code: refreshed.code,
      message: `${refreshed.message} Run \`codex login\`, then rerun AgentProof.`,
      authPath
    };
  }

  const nextAuth = {
    ...payload.auth,
    tokens: {
      ...tokens,
      access_token: refreshed.accessToken,
      refresh_token: refreshed.refreshToken || refreshToken
    },
    last_refresh: new Date().toISOString()
  };
  writeCodexAuthPayload(authPath, nextAuth, payload.mode);

  return {
    ok: true,
    accessToken: nextAuth.tokens.access_token,
    refreshToken: nextAuth.tokens.refresh_token,
    authPath,
    baseUrl: codexBaseUrl(env),
    refreshed: true
  };
}

export async function getCodexModelIds(accessToken = '', env = process.env) {
  const apiModels = accessToken ? await fetchCodexModels(accessToken, env) : [];
  if (apiModels.length) return addForwardCompatModels(apiModels);

  const localModels = readLocalCodexModels(env);
  if (localModels.length) return addForwardCompatModels(localModels);

  return [...DEFAULT_CODEX_MODELS];
}

export function pickCodexModel(models = [], requestedModel = '') {
  const requested = String(requestedModel || '').trim();
  if (requested) return requested;
  if (models.includes('gpt-5.3-codex-spark')) return 'gpt-5.3-codex-spark';
  return models[0] || 'gpt-5.3-codex';
}

export function codexRequestHeaders(accessToken) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'User-Agent': 'codex_cli_rs/0.0.0 (AgentProof)',
    originator: 'codex_cli_rs'
  };
  const accountId = extractChatGptAccountId(accessToken);
  if (accountId) headers['ChatGPT-Account-ID'] = accountId;
  return headers;
}

async function fetchCodexModels(accessToken, env) {
  try {
    const response = await fetch(`${codexBaseUrl(env)}/models?client_version=1.0.0`, {
      headers: codexRequestHeaders(accessToken)
    });
    if (!response.ok) return [];
    const payload = await response.json();
    const entries = Array.isArray(payload.models) ? payload.models : [];
    const sortable = entries
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        slug: String(item.slug || '').trim(),
        visibility: String(item.visibility || '').trim().toLowerCase(),
        priority: Number.isFinite(item.priority) ? item.priority : 10000
      }))
      .filter((item) => item.slug && item.visibility !== 'hide' && item.visibility !== 'hidden')
      .sort((a, b) => a.priority - b.priority || a.slug.localeCompare(b.slug));
    return unique(sortable.map((item) => item.slug));
  } catch {
    return [];
  }
}

async function refreshCodexTokens(refreshToken) {
  try {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: CODEX_OAUTH_CLIENT_ID
    });
    const response = await fetch(CODEX_OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    });
    if (!response.ok) {
      return {
        ok: false,
        code: `codex_refresh_http_${response.status}`,
        message: `Codex token refresh failed with HTTP ${response.status}.`
      };
    }
    const payload = await response.json();
    const accessToken = String(payload.access_token || '').trim();
    if (!accessToken) {
      return {
        ok: false,
        code: 'codex_refresh_missing_access_token',
        message: 'Codex token refresh response did not include an access token.'
      };
    }
    return {
      ok: true,
      accessToken,
      refreshToken: String(payload.refresh_token || '').trim()
    };
  } catch (error) {
    return {
      ok: false,
      code: 'codex_refresh_failed',
      message: `Codex token refresh failed: ${error.message}`
    };
  }
}

function readCodexAuthPayload(authPath) {
  if (!fs.existsSync(authPath)) {
    return {
      ok: false,
      code: 'codex_auth_missing',
      message: 'No Codex auth file was found. Run `codex login` or open Codex once, then rerun AgentProof.',
      authPath
    };
  }
  try {
    const raw = fs.readFileSync(authPath, 'utf8');
    const auth = JSON.parse(raw);
    if (!auth || typeof auth !== 'object' || !auth.tokens || typeof auth.tokens !== 'object') {
      return {
        ok: false,
        code: 'codex_auth_invalid_shape',
        message: 'Codex auth file does not contain a tokens object. Run `codex login`, then rerun AgentProof.',
        authPath
      };
    }
    const stat = fs.statSync(authPath);
    return { ok: true, auth, mode: stat.mode & 0o777, authPath };
  } catch (error) {
    return {
      ok: false,
      code: 'codex_auth_unreadable',
      message: `Could not read Codex auth: ${error.message}`,
      authPath
    };
  }
}

function writeCodexAuthPayload(authPath, auth, mode) {
  fs.writeFileSync(authPath, `${JSON.stringify(auth, null, 2)}\n`);
  if (Number.isFinite(mode)) {
    try {
      fs.chmodSync(authPath, mode);
    } catch {
      // Keep going: the token was already updated and chmod is best-effort.
    }
  }
}

function readLocalCodexModels(env) {
  const codexHome = String(env.CODEX_HOME || '').trim() || path.join(os.homedir(), '.codex');
  const models = [];
  const configModel = readCodexConfigModel(path.join(codexHome, 'config.toml'));
  if (configModel) models.push(configModel);
  for (const model of readCodexModelCache(path.join(codexHome, 'models_cache.json'))) {
    models.push(model);
  }
  for (const model of DEFAULT_CODEX_MODELS) {
    models.push(model);
  }
  return unique(models);
}

function readCodexConfigModel(configPath) {
  if (!fs.existsSync(configPath)) return '';
  try {
    const source = fs.readFileSync(configPath, 'utf8');
    const match = source.match(/^\s*model\s*=\s*["']([^"']+)["']\s*$/m);
    return match ? match[1].trim() : '';
  } catch {
    return '';
  }
}

function readCodexModelCache(cachePath) {
  if (!fs.existsSync(cachePath)) return [];
  try {
    const payload = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    const entries = Array.isArray(payload.models) ? payload.models : [];
    return unique(entries
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        slug: String(item.slug || '').trim(),
        visibility: String(item.visibility || '').trim().toLowerCase(),
        priority: Number.isFinite(item.priority) ? item.priority : 10000
      }))
      .filter((item) => item.slug && item.visibility !== 'hide' && item.visibility !== 'hidden')
      .sort((a, b) => a.priority - b.priority || a.slug.localeCompare(b.slug))
      .map((item) => item.slug));
  } catch {
    return [];
  }
}

function addForwardCompatModels(modelIds) {
  const output = unique(modelIds);
  for (const [synthetic, templates] of FORWARD_COMPAT_MODELS) {
    if (!output.includes(synthetic) && templates.some((template) => output.includes(template))) {
      output.push(synthetic);
    }
  }
  return output;
}

function unique(values) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];
}

function isAccessTokenExpiring(token, skewSeconds) {
  const claims = decodeJwtPayload(token);
  if (!claims || !Number.isFinite(claims.exp)) return false;
  return claims.exp <= Math.floor(Date.now() / 1000) + skewSeconds;
}

function extractChatGptAccountId(token) {
  const claims = decodeJwtPayload(token);
  const auth = claims?.['https://api.openai.com/auth'];
  const accountId = auth && typeof auth === 'object' ? auth.chatgpt_account_id : '';
  return typeof accountId === 'string' ? accountId.trim() : '';
}

function decodeJwtPayload(token) {
  try {
    const parts = String(token || '').split('.');
    if (parts.length < 2) return null;
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}
