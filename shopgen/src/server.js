#!/usr/bin/env node
// Interface web locale de shopgen : édition en live du brand kit et du contenu
// avant push. Zéro dépendance serveur (node:http), une seule page (ui/index.html).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { getConfig } from "./config.js";
import { ingestFromShopifyUrl } from "./ingest.js";
import { generateBrandKit, generateContent } from "./generate.js";
import {
  createProduct,
  createPage,
  createCollection,
  createMenu,
} from "./shopify.js";

const cfg = getConfig({ requireShopify: false });
const PORT = Number(process.env.PORT || 3333);
const UI_PATH = path.join(cfg.root, "ui", "index.html");

function shopifyReady() {
  return Boolean(cfg.storeDomain && cfg.adminToken);
}

async function readJsonBody(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 5_000_000) throw new Error("Corps de requête trop grand");
  }
  return raw ? JSON.parse(raw) : {};
}

function send(res, status, body, type = "application/json") {
  const payload = type === "application/json" ? JSON.stringify(body) : body;
  res.writeHead(status, { "Content-Type": `${type}; charset=utf-8` });
  res.end(payload);
}

const routes = {
  "POST /api/ingest": async (body) => {
    if (!body.url) throw new Error("URL manquante");
    return ingestFromShopifyUrl(body.url);
  },
  "POST /api/brand": async (body) => {
    if (!body.product) throw new Error("Produit manquant");
    return generateBrandKit(cfg, body.product, body.feedback || null);
  },
  "POST /api/content": async (body) => {
    if (!body.product || !body.brandKit)
      throw new Error("Produit ou brand kit manquant");
    return generateContent(
      cfg,
      body.product,
      body.brandKit,
      body.feedback || null,
    );
  },
  "POST /api/push": async (body) => {
    if (!shopifyReady()) {
      throw new Error(
        "Shopify non configuré : renseigne SHOPIFY_STORE_DOMAIN et SHOPIFY_ADMIN_TOKEN dans .env puis relance le serveur.",
      );
    }
    const { product, brandKit, content } = body;
    if (!product || !brandKit || !content)
      throw new Error("Données incomplètes pour le push");

    saveRun(brandKit, { product, brandKit, content });

    const created = { pages: {}, collections: {} };
    const log = [];
    created.product = await createProduct(cfg, { content, product, brandKit });
    log.push(`Produit créé (brouillon) : ${created.product.title}`);
    for (const page of content.pages) {
      const p = await createPage(cfg, page);
      created.pages[page.handle] = p.id;
      log.push(`Page : ${p.title}`);
    }
    for (const collection of content.collections) {
      const c = await createCollection(cfg, collection);
      created.collections[collection.handle] = c.id;
      log.push(`Collection : ${c.title}`);
    }
    const stamp = Date.now().toString(36);
    await createMenu(
      cfg,
      {
        title: `${brandKit.brand_name} — principal`,
        handle: `shopgen-main-${stamp}`,
        items: content.menu.main,
      },
      created,
    );
    await createMenu(
      cfg,
      {
        title: `${brandKit.brand_name} — footer`,
        handle: `shopgen-footer-${stamp}`,
        items: content.menu.footer,
      },
      created,
    );
    log.push("Menus créés");
    return { log, admin: `https://${cfg.storeDomain}/admin` };
  },
  "POST /api/save": async (body) => {
    if (!body.brandKit) throw new Error("Rien à sauvegarder");
    const file = saveRun(body.brandKit, body);
    return { saved: file };
  },
  "GET /api/config": async () => ({
    shopifyConfigured: shopifyReady(),
    storeDomain: cfg.storeDomain || null,
    language: cfg.language,
    currency: cfg.currency,
  }),
};

function saveRun(brandKit, data) {
  const outDir = path.join(cfg.root, "shopgen-output");
  fs.mkdirSync(outDir, { recursive: true });
  const slug = (brandKit.brand_name || "shop")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const file = path.join(outDir, `${slug}-${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return file;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const key = `${req.method} ${url.pathname}`;

  if (key === "GET /" || key === "GET /index.html") {
    return send(res, 200, fs.readFileSync(UI_PATH, "utf8"), "text/html");
  }

  const handler = routes[key];
  if (!handler) return send(res, 404, { error: `Route inconnue : ${key}` });

  try {
    const body = req.method === "POST" ? await readJsonBody(req) : {};
    const result = await handler(body);
    return send(res, 200, result);
  } catch (err) {
    return send(res, 500, { error: err.message });
  }
});

// 127.0.0.1 uniquement : le serveur porte tes tokens, il ne doit jamais être
// exposé au réseau.
server.listen(PORT, "127.0.0.1", () => {
  console.log(`shopgen UI : http://127.0.0.1:${PORT}`);
  if (!shopifyReady()) {
    console.log(
      "(mode génération seule — configure Shopify dans .env pour activer le push)",
    );
  }
});
