#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { getConfig } from "./config.js";
import { ingestFromShopifyUrl, ingestFromFile } from "./ingest.js";
import { generateBrandKit, generateContent } from "./generate.js";
import {
  createProduct,
  createPage,
  createCollection,
  createMenu,
} from "./shopify.js";
import { printBrandKit, printContentSummary, checkpoint } from "./review.js";

const USAGE = `shopgen — génère une boutique Shopify complète à partir d'un produit.

Usage :
  node src/index.js <url-produit-shopify>     Depuis un produit Shopify public
  node src/index.js --file <produit.json>     Depuis une fiche produit locale
Options :
  --dry-run    Génère tout mais ne pousse rien vers Shopify (sortie JSON locale)
  --yes        Saute les points de validation (utilise la première proposition)
`;

async function main() {
  const args = process.argv.slice(2);
  if (!args.length || args.includes("--help")) {
    console.log(USAGE);
    process.exit(args.length ? 0 : 1);
  }
  const dryRun = args.includes("--dry-run");
  const autoYes = args.includes("--yes");
  const cfg = getConfig({ requireShopify: !dryRun });

  // 1. Ingestion
  let product;
  const fileFlag = args.indexOf("--file");
  if (fileFlag !== -1) {
    product = ingestFromFile(args[fileFlag + 1]);
  } else {
    const url = args.find((a) => a.startsWith("http"));
    if (!url) {
      console.log(USAGE);
      process.exit(1);
    }
    console.log(`Lecture du produit source…`);
    product = await ingestFromShopifyUrl(url);
  }
  console.log(
    `Produit : « ${product.title} » — ${product.price} ${cfg.currency}, ${product.images.length} image(s)`,
  );

  // 2. Brand kit (avec boucle de validation)
  let brandKit = null;
  let feedback = null;
  while (true) {
    console.log(`\nGénération du brand kit…`);
    brandKit = await generateBrandKit(cfg, product, feedback);
    printBrandKit(brandKit);
    if (autoYes) break;
    const res = await checkpoint("Valider ce brand kit ?");
    if (res.action === "ok") break;
    if (res.action === "quit") process.exit(0);
    feedback = res.feedback;
  }

  // 3. Contenu (avec boucle de validation)
  let content = null;
  feedback = null;
  while (true) {
    console.log(`\nRédaction du contenu de la boutique… (1-2 minutes)`);
    content = await generateContent(cfg, product, brandKit, feedback);
    printContentSummary(content);
    if (autoYes) break;
    const res = await checkpoint("Valider ce contenu et pousser vers Shopify ?");
    if (res.action === "ok") break;
    if (res.action === "quit") process.exit(0);
    feedback = res.feedback;
  }

  // Audit : tout est sauvegardé localement quoi qu'il arrive
  const outDir = path.join(cfg.root, "shopgen-output");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(
    outDir,
    `${slugify(brandKit.brand_name)}-${Date.now()}.json`,
  );
  fs.writeFileSync(
    outFile,
    JSON.stringify({ product, brandKit, content }, null, 2),
  );
  console.log(`\nGénération sauvegardée : ${outFile}`);

  if (dryRun) {
    console.log(`--dry-run : rien n'a été poussé vers Shopify.`);
    return;
  }

  // 4. Push Shopify
  console.log(`\nPush vers ${cfg.storeDomain}…`);
  const created = { pages: {}, collections: {} };

  created.product = await createProduct(cfg, { content, product, brandKit });
  console.log(`  ✓ Produit créé (brouillon) : ${created.product.title}`);

  for (const page of content.pages) {
    const p = await createPage(cfg, page);
    created.pages[page.handle] = p.id;
    console.log(`  ✓ Page : ${p.title}`);
  }

  for (const collection of content.collections) {
    const c = await createCollection(cfg, collection);
    created.collections[collection.handle] = c.id;
    console.log(`  ✓ Collection : ${c.title}`);
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
  console.log(`  ✓ Menus créés`);

  const admin = `https://${cfg.storeDomain}/admin`;
  console.log(`
━━━ TERMINÉ ━━━
Prochaines étapes manuelles (5 minutes) :
  1. ${admin}/products — vérifier la fiche, passer le produit en « Actif »
  2. ${admin}/menus — assigner les menus « ${brandKit.brand_name} » au thème
  3. Réglages du thème → couleurs/typos du brand kit :
     fond ${brandKit.palette.background} · accent ${brandKit.palette.accent} · titres ${brandKit.typography.heading} · corps ${brandKit.typography.body}
  4. Relire les textes entre [crochets] (délais de livraison, coordonnées…)
`);
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

main().catch((err) => {
  console.error(`\nErreur : ${err.message}`);
  process.exit(1);
});
