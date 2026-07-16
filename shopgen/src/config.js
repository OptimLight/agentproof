import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadDotEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

export function getConfig({ requireShopify = true } = {}) {
  loadDotEnv();
  const missing = [];
  const cfg = {
    // Tolère "https://boutique.myshopify.com/" collé depuis le navigateur.
    storeDomain: process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .trim(),
    adminToken: process.env.SHOPIFY_ADMIN_TOKEN,
    // Auth Claude, au choix (même mécanisme que n'importe quel agent existant) :
    // - ANTHROPIC_API_KEY : clé API classique
    // - ANTHROPIC_AUTH_TOKEN : token OAuth/bearer (ex: sk-ant-oat...)
    // - ANTHROPIC_BASE_URL : endpoint alternatif (proxy/passerelle locale)
    anthropicKey: process.env.ANTHROPIC_API_KEY,
    anthropicAuthToken: process.env.ANTHROPIC_AUTH_TOKEN,
    anthropicBaseUrl: process.env.ANTHROPIC_BASE_URL,
    language: process.env.SHOP_LANGUAGE || "fr",
    currency: process.env.SHOP_CURRENCY || "EUR",
    root: ROOT,
  };
  // Une passerelle locale (ANTHROPIC_BASE_URL) peut injecter l'auth elle-même :
  // dans ce cas aucune clé n'est requise ici.
  if (!cfg.anthropicKey && !cfg.anthropicAuthToken && !cfg.anthropicBaseUrl)
    missing.push("ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN ou ANTHROPIC_BASE_URL");
  if (requireShopify) {
    if (!cfg.storeDomain) missing.push("SHOPIFY_STORE_DOMAIN");
    if (!cfg.adminToken) missing.push("SHOPIFY_ADMIN_TOKEN");
  }
  if (missing.length) {
    console.error(
      `Configuration manquante : ${missing.join(", ")}\n` +
        `Copie .env.example vers .env dans ${ROOT} et remplis les valeurs (voir README.md).`,
    );
    process.exit(1);
  }
  return cfg;
}
