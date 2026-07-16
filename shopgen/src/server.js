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
import { generateTheme } from "./liquid.js";
import { zipTheme } from "./theme-zip.js";

const cfg = getConfig({ requireShopify: false });
const PORT = Number(process.env.PORT || 3333);
const UI_PATH = path.join(cfg.root, "ui", "index.html");
const OUT_DIR = path.join(cfg.root, "shopgen-output");
const MAX_BODY_BYTES = 5_000_000;
let lastThemeZip = null; // dernier zip généré, servi par /api/theme/download

function shopifyReady() {
  return Boolean(cfg.storeDomain && cfg.adminToken);
}

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

// Le serveur porte tes tokens : on n'accepte que le trafic réellement local.
// Sans ces contrôles, n'importe quelle page web ouverte dans ton navigateur
// pourrait appeler http://127.0.0.1:3333 (requêtes cross-origin "simples").
function isLocalRequest(req) {
  const host = req.headers.host || "";
  if (!/^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(host)) return false;
  const origin = req.headers.origin;
  if (origin && !/^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(origin))
    return false;
  return true;
}

async function readJsonBody(req) {
  const type = req.headers["content-type"] || "";
  if (!type.includes("application/json")) {
    throw badRequest("Content-Type application/json requis");
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      req.destroy();
      throw badRequest("Corps de requête trop grand");
    }
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function send(res, status, body, type = "application/json") {
  const payload = type === "application/json" ? JSON.stringify(body) : body;
  res.writeHead(status, { "Content-Type": `${type}; charset=utf-8` });
  res.end(payload);
}

const routes = {
  "POST /api/ingest": async (body) => {
    if (!body.url) throw badRequest("URL manquante");
    return ingestFromShopifyUrl(body.url);
  },
  "POST /api/brand": async (body) => {
    if (!body.product) throw badRequest("Produit manquant");
    return generateBrandKit(cfg, body.product, body.feedback || null);
  },
  "POST /api/content": async (body) => {
    if (!body.product || !body.brandKit)
      throw badRequest("Produit ou brand kit manquant");
    return generateContent(
      cfg,
      body.product,
      body.brandKit,
      body.feedback || null,
    );
  },
  "POST /api/push": async (body) => {
    if (!shopifyReady()) {
      throw badRequest(
        "Shopify non configuré : renseigne SHOPIFY_STORE_DOMAIN et SHOPIFY_ADMIN_TOKEN dans .env puis relance le serveur.",
      );
    }
    const { product, brandKit, content } = body;
    if (!product?.price || !brandKit?.brand_name || !content?.product)
      throw badRequest("Données incomplètes pour le push");

    saveRun(brandKit, { product, brandKit, content });

    // En cas d'échec à mi-parcours, on renvoie la liste de ce qui a déjà été
    // créé : l'état de la boutique reste visible, rien n'est silencieux.
    const created = { pages: {}, collections: {} };
    const log = [];
    try {
      created.product = await createProduct(cfg, { content, product, brandKit });
      log.push(`Produit créé (brouillon) : ${created.product.title}`);
      for (const page of content.pages || []) {
        const p = await createPage(cfg, page);
        created.pages[page.handle] = p.id;
        log.push(`Page : ${p.title}`);
      }
      for (const collection of content.collections || []) {
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
          items: content.menu?.main || [],
        },
        created,
      );
      await createMenu(
        cfg,
        {
          title: `${brandKit.brand_name} — footer`,
          handle: `shopgen-footer-${stamp}`,
          items: content.menu?.footer || [],
        },
        created,
      );
      log.push("Menus créés");
    } catch (err) {
      throw new Error(
        `Push interrompu : ${err.message}\nDéjà créé avant l'erreur : ${
          log.length ? log.join(" · ") : "rien"
        }.\nSupprime ces éléments dans l'admin avant de relancer, ou termine à la main.`,
      );
    }
    return { log, admin: `https://${cfg.storeDomain}/admin` };
  },
  "POST /api/theme": async (body) => {
    const { brandKit, content } = body;
    if (!brandKit?.brand_name || !content?.product)
      throw badRequest("Brand kit ou contenu manquant pour générer le thème");
    const slug =
      brandKit.brand_name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "shop";
    const themeDir = path.join(OUT_DIR, `${slug}-theme`);
    fs.rmSync(themeDir, { recursive: true, force: true });
    const { files } = generateTheme(brandKit, content, themeDir);
    lastThemeZip = zipTheme(themeDir);
    return {
      fileCount: files.length,
      dir: themeDir,
      downloadable: Boolean(lastThemeZip),
    };
  },
  "POST /api/save": async (body) => {
    if (!body.brandKit) throw badRequest("Rien à sauvegarder");
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
  const slug =
    (brandKit.brand_name || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "shop";
  const file = path.join(outDir, `${slug}-${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return file;
}

const server = http.createServer(async (req, res) => {
  try {
    if (!isLocalRequest(req)) {
      return send(res, 403, { error: "Requête non locale refusée" });
    }
    const url = new URL(req.url, `http://${req.headers.host}`);
    const key = `${req.method} ${url.pathname}`;

    if (key === "GET /" || key === "GET /index.html") {
      return send(res, 200, fs.readFileSync(UI_PATH, "utf8"), "text/html");
    }

    if (key === "GET /api/theme/download") {
      if (!lastThemeZip || !fs.existsSync(lastThemeZip)) {
        return send(res, 404, { error: "Aucun thème généré à télécharger" });
      }
      res.writeHead(200, {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${path.basename(lastThemeZip)}"`,
      });
      return fs.createReadStream(lastThemeZip).pipe(res);
    }

    const handler = routes[key];
    if (!handler)
      return send(res, 404, { error: `Route inconnue : ${key}` });

    const body = req.method === "POST" ? await readJsonBody(req) : {};
    const result = await handler(body);
    return send(res, 200, result);
  } catch (err) {
    return send(res, err.status || 500, { error: err.message });
  }
});

// 127.0.0.1 uniquement : jamais exposé au réseau.
server.listen(PORT, "127.0.0.1", () => {
  console.log(`shopgen UI : http://127.0.0.1:${PORT}`);
  if (!shopifyReady()) {
    console.log(
      "(mode génération seule — configure Shopify dans .env pour activer le push)",
    );
  }
});
