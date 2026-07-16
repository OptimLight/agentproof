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
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

export function getConfig({ requireShopify = true } = {}) {
  loadDotEnv();
  const missing = [];
  const cfg = {
    storeDomain: process.env.SHOPIFY_STORE_DOMAIN,
    adminToken: process.env.SHOPIFY_ADMIN_TOKEN,
    anthropicKey: process.env.ANTHROPIC_API_KEY,
    language: process.env.SHOP_LANGUAGE || "fr",
    currency: process.env.SHOP_CURRENCY || "EUR",
    root: ROOT,
  };
  if (!cfg.anthropicKey) missing.push("ANTHROPIC_API_KEY");
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
