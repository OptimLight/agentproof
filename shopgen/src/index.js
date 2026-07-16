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
import { generateTheme } from "./liquid.js";
import { zipTheme } from "./theme-zip.js";

const USAGE = `shopgen — génère une boutique Shopify complète à partir d'un produit.

Usage :
  node src/index.js <url-produit-shopify>     Depuis un produit Shopify public
  node src/index.js --file <produit.json>     Depuis une fiche produit locale
Options :
  --dry-run    Génère tout (contenu + thème Liquid) mais ne pousse rien vers Shopify
  --yes        Saute les points de validation (utilise la première proposition)
  --no-theme   Ne génère pas le thème Liquid (contenu seulement)
`;

async function main() {
  const args = process.argv.slice(2);
  if (!args.length || args.includes("--help")) {
    console.log(USAGE);
    process.exit(args.length ? 0 : 1);
  }
  const dryRun = args.includes("--dry-run");
  const autoYes = args.includes("--yes");
  const withTheme = !args.includes("--no-theme");
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

  // Audit : chaque étape payée est sauvegardée immédiatement — un quit en
  // cours de route ne perd jamais le brand kit déjà généré.
  const outDir = path.join(cfg.root, "shopgen-output");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(
    outDir,
    `${slugify(brandKit.brand_name)}-${Date.now()}.json`,
  );
  const saveRun = (content) =>
    fs.writeFileSync(
      outFile,
      JSON.stringify({ product, brandKit, content }, null, 2),
    );
  saveRun(null);

  // 3. Contenu (avec boucle de validation)
  let content = null;
  feedback = null;
  while (true) {
    console.log(`\nRédaction du contenu de la boutique… (1-2 minutes)`);
    content = await generateContent(cfg, product, brandKit, feedback);
    saveRun(content);
    printContentSummary(content);
    if (autoYes) break;
    const res = await checkpoint("Valider ce contenu et pousser vers Shopify ?");
    if (res.action === "ok") break;
    if (res.action === "quit") {
      console.log(`Génération sauvegardée : ${outFile}`);
      process.exit(0);
    }
    feedback = res.feedback;
  }
  console.log(`\nGénération sauvegardée : ${outFile}`);

  // 4. Thème Liquid (dossier importable dans Shopify)
  let themeZip = null;
  if (withTheme) {
    console.log(`\nGénération du thème Shopify Liquid…`);
    const themeDir = path.join(
      outDir,
      `${slugify(brandKit.brand_name)}-theme`,
    );
    fs.rmSync(themeDir, { recursive: true, force: true });
    const { files } = generateTheme(brandKit, content, themeDir);
    themeZip = zipTheme(themeDir);
    console.log(`  ✓ Thème généré : ${files.length} fichiers → ${themeDir}`);
    console.log(
      themeZip
        ? `  ✓ Archive prête : ${themeZip}`
        : `  (commande « zip » absente — importe le dossier tel quel)`,
    );
  }

  if (dryRun) {
    console.log(`--dry-run : rien n'a été poussé vers Shopify.`);
    if (themeZip)
      console.log(
        `Importe le thème : Shopify → Boutique en ligne → Thèmes → Ajouter → Importer → ${path.basename(themeZip)}`,
      );
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
  1. ${admin}/themes — Ajouter → Importer ${themeZip ? path.basename(themeZip) : "le dossier du thème"}, puis Personnaliser → assigner les menus « ${brandKit.brand_name} »
  2. ${admin}/products — vérifier la fiche, passer le produit en « Actif »
  3. Relire les textes entre [crochets] (délais de livraison, coordonnées…)
${themeZip ? `\nLe thème applique déjà ta palette (${brandKit.palette.accent}) et tes polices (${brandKit.typography.heading}/${brandKit.typography.body}).` : ""}
`);
}

function slugify(text) {
  return (
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "shop"
  );
}

main().catch((err) => {
  console.error(`\nErreur : ${err.message}`);
  process.exit(1);
});
