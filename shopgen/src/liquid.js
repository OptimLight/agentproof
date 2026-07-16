import fs from "node:fs";
import path from "node:path";

// Génère un vrai thème Shopify (fichiers .liquid + templates JSON + settings +
// CSS) piloté par le brand kit. Le contenu (fiche produit, pages) reste
// dynamique côté Shopify : le thème le met en forme via product.description,
// pages, etc. — c'est la séparation propre thème / contenu.
//
// Résultat : un dossier uploadable dans Shopify (Boutique en ligne → Thèmes →
// Ajouter → Importer), ou zippé pour distribution.

export function generateTheme(brandKit, content, outDir) {
  const files = buildFiles(brandKit, content);
  for (const [rel, body] of Object.entries(files)) {
    const full = path.join(outDir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, body);
  }
  return { dir: outDir, files: Object.keys(files) };
}

function buildFiles(brandKit, content) {
  const b = brandKit;
  const themeName = b.brand_name || "shopgen";
  return {
    "layout/theme.liquid": LAYOUT,
    "sections/header.liquid": HEADER,
    "sections/footer.liquid": FOOTER,
    "sections/hero.liquid": hero(b),
    "sections/main-product.liquid": MAIN_PRODUCT,
    "sections/reassurance.liquid": REASSURANCE,
    "sections/main-page.liquid": MAIN_PAGE,
    "sections/main-collection.liquid": MAIN_COLLECTION,
    "sections/main-list-collections.liquid": MAIN_LIST_COLLECTIONS,
    "templates/index.json": INDEX_TEMPLATE,
    "templates/product.json": PRODUCT_TEMPLATE,
    "templates/page.json": PAGE_TEMPLATE,
    "templates/collection.json": COLLECTION_TEMPLATE,
    "templates/list-collections.json": LIST_COLLECTIONS_TEMPLATE,
    "templates/cart.liquid": CART_TEMPLATE,
    "templates/404.liquid": NOT_FOUND_TEMPLATE,
    "assets/theme.css": themeCss(),
    "config/settings_schema.json": settingsSchema(themeName),
    "config/settings_data.json": settingsData(b),
    "locales/en.default.json": LOCALE,
    "locales/fr.json": LOCALE,
  };
}

// ---- layout ----
const LAYOUT = `<!doctype html>
<html lang="{{ request.locale.iso_code }}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="{{ settings.color_bg }}">
  <link rel="canonical" href="{{ canonical_url }}">
  <title>{{ page_title }}{% unless page_title contains shop.name %} · {{ shop.name }}{% endunless %}</title>
  {% if page_description %}<meta name="description" content="{{ page_description | escape }}">{% endif %}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family={{ settings.font_heading | strip | replace: ' ', '+' }}:wght@400;600;700&family={{ settings.font_body | strip | replace: ' ', '+' }}:wght@400;600;700&display=swap">
  <style>
    :root {
      --bg: {{ settings.color_bg }};
      --secondary: {{ settings.color_secondary }};
      --accent: {{ settings.color_accent }};
      --text: {{ settings.color_text }};
      --font-heading: "{{ settings.font_heading }}", Georgia, serif;
      --font-body: "{{ settings.font_body }}", system-ui, -apple-system, sans-serif;
    }
  </style>
  {{ 'theme.css' | asset_url | stylesheet_tag }}
  {{ content_for_header }}
</head>
<body class="template-{{ template.name }}">
  {% section 'header' %}
  <main id="main" role="main">{{ content_for_layout }}</main>
  {% section 'footer' %}
</body>
</html>
`;

// ---- header ----
const HEADER = `<header class="site-header">
  <div class="wrap header-inner">
    <a href="{{ routes.root_url }}" class="brand">{{ settings.brand_name | default: shop.name }}</a>
    <nav class="site-nav">
      {%- for link in section.settings.menu.links -%}
        <a href="{{ link.url }}"{% if link.active %} aria-current="page"{% endif %}>{{ link.title }}</a>
      {%- endfor -%}
    </nav>
    <a href="{{ routes.cart_url }}" class="cart-link">Panier ({{ cart.item_count }})</a>
  </div>
</header>
{% schema %}
{
  "name": "En-tête",
  "settings": [
    { "type": "link_list", "id": "menu", "label": "Menu principal", "default": "main-menu" }
  ]
}
{% endschema %}
`;

// ---- footer ----
const FOOTER = `<footer class="site-footer">
  <div class="wrap footer-inner">
    <div class="footer-brand">
      <span class="brand">{{ settings.brand_name | default: shop.name }}</span>
      <p class="tagline">{{ settings.tagline }}</p>
    </div>
    <nav class="footer-nav">
      {%- for link in section.settings.menu.links -%}
        <a href="{{ link.url }}">{{ link.title }}</a>
      {%- endfor -%}
    </nav>
  </div>
  <div class="wrap footer-legal">© {{ 'now' | date: '%Y' }} {{ settings.brand_name | default: shop.name }}</div>
{% schema %}
{
  "name": "Pied de page",
  "settings": [
    { "type": "link_list", "id": "menu", "label": "Menu du pied de page", "default": "footer" }
  ]
}
{% endschema %}
</footer>
`;

// ---- hero (accueil) ----
function hero(b) {
  const headline = jsonStr(b.tagline || "");
  const sub = jsonStr(b.positioning || "");
  return `<section class="hero" style="background: var(--secondary);">
  <div class="wrap hero-inner">
    <h1 class="hero-title">{{ section.settings.headline }}</h1>
    <p class="hero-sub">{{ section.settings.subtext }}</p>
    {% if section.settings.button_url != blank %}
      <a href="{{ section.settings.button_url }}" class="cta">{{ section.settings.button_label }}</a>
    {% endif %}
  </div>
{% schema %}
{
  "name": "Bannière d'accueil",
  "settings": [
    { "type": "text", "id": "headline", "label": "Titre", "default": ${headline} },
    { "type": "textarea", "id": "subtext", "label": "Sous-titre", "default": ${sub} },
    { "type": "url", "id": "button_url", "label": "Lien du bouton" },
    { "type": "text", "id": "button_label", "label": "Texte du bouton", "default": "Découvrir" }
  ],
  "presets": [{ "name": "Bannière d'accueil" }]
}
{% endschema %}
</section>
`;
}

// ---- fiche produit ----
const MAIN_PRODUCT = `<section class="product-page">
  <div class="wrap product-grid">
    <div class="product-media">
      {%- if product.featured_image -%}
        <img class="product-image" src="{{ product.featured_image | image_url: width: 1000 }}" alt="{{ product.featured_image.alt | escape | default: product.title }}" width="1000" loading="eager">
        {%- if product.images.size > 1 -%}
          <div class="thumbs">
            {%- for image in product.images limit: 4 -%}
              <img src="{{ image | image_url: width: 200 }}" alt="" width="200" loading="lazy">
            {%- endfor -%}
          </div>
        {%- endif -%}
      {%- else -%}
        <div class="image-slot">Ajoute tes photos produit ici</div>
      {%- endif -%}
    </div>

    <div class="product-info">
      <h1 class="product-title">{{ product.title }}</h1>
      <p class="product-price">
        {%- if product.compare_at_price > product.price -%}
          <s>{{ product.compare_at_price | money }}</s>
        {%- endif -%}
        <strong>{{ product.price | money }}</strong>
      </p>

      {%- form 'product', product, class: 'product-form' -%}
        {%- unless product.has_only_default_variant -%}
          {%- for option in product.options_with_values -%}
            <label class="opt-label">{{ option.name }}</label>
            <select name="options[{{ option.name | escape }}]" class="opt-select">
              {%- for value in option.values -%}
                <option value="{{ value | escape }}">{{ value }}</option>
              {%- endfor -%}
            </select>
          {%- endfor -%}
        {%- endunless -%}
        <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}">
        <button type="submit" class="cta" {% unless product.available %}disabled{% endunless %}>
          {%- if product.available -%}Ajouter au panier{%- else -%}Épuisé{%- endif -%}
        </button>
      {%- endform -%}

      <div class="reassure-inline">
        <span>Essai satisfait ou remboursé</span>
        <span>Paiement sécurisé</span>
        <span>Retour simple</span>
      </div>

      <div class="rte product-description">{{ product.description }}</div>
    </div>
  </div>
{% schema %}
{ "name": "Fiche produit", "settings": [] }
{% endschema %}
</section>
`;

// ---- bande de réassurance ----
const REASSURANCE = `<section class="reassurance">
  <div class="wrap reassurance-inner">
    {%- for block in section.blocks -%}
      <div class="reassure-item" {{ block.shopify_attributes }}>
        <strong>{{ block.settings.title }}</strong>
        <span>{{ block.settings.text }}</span>
      </div>
    {%- endfor -%}
  </div>
{% schema %}
{
  "name": "Réassurance",
  "blocks": [
    { "type": "item", "name": "Argument", "settings": [
      { "type": "text", "id": "title", "label": "Titre", "default": "Livraison rapide" },
      { "type": "text", "id": "text", "label": "Texte", "default": "Expédié sous 24-48h" }
    ]}
  ],
  "presets": [{ "name": "Réassurance", "blocks": [{"type":"item"},{"type":"item"},{"type":"item"}] }]
}
{% endschema %}
</section>
`;

// ---- page générique ----
const MAIN_PAGE = `<section class="page">
  <div class="wrap page-narrow">
    <h1 class="page-title">{{ page.title }}</h1>
    <div class="rte">{{ page.content }}</div>
  </div>
{% schema %}
{ "name": "Page", "settings": [] }
{% endschema %}
</section>
`;

// ---- collection ----
const MAIN_COLLECTION = `<section class="collection">
  <div class="wrap">
    <h1 class="page-title">{{ collection.title }}</h1>
    {%- if collection.description != blank -%}<div class="rte collection-desc">{{ collection.description }}</div>{%- endif -%}
    <div class="product-list">
      {%- for product in collection.products -%}
        <a class="card" href="{{ product.url }}">
          {%- if product.featured_image -%}
            <img src="{{ product.featured_image | image_url: width: 500 }}" alt="{{ product.title | escape }}" width="500" loading="lazy">
          {%- else -%}
            <div class="image-slot card-ph"></div>
          {%- endif -%}
          <span class="card-title">{{ product.title }}</span>
          <span class="card-price">{{ product.price | money }}</span>
        </a>
      {%- else -%}
        <p>Aucun produit dans cette collection pour le moment.</p>
      {%- endfor -%}
    </div>
  </div>
{% schema %}
{ "name": "Collection", "settings": [] }
{% endschema %}
</section>
`;

// ---- liste des collections ----
const MAIN_LIST_COLLECTIONS = `<section class="collection">
  <div class="wrap">
    <h1 class="page-title">Nos collections</h1>
    <div class="product-list">
      {%- for collection in collections -%}
        <a class="card" href="{{ collection.url }}">
          {%- if collection.featured_image -%}
            <img src="{{ collection.featured_image | image_url: width: 500 }}" alt="{{ collection.title | escape }}" width="500" loading="lazy">
          {%- else -%}
            <div class="image-slot card-ph"></div>
          {%- endif -%}
          <span class="card-title">{{ collection.title }}</span>
        </a>
      {%- endfor -%}
    </div>
  </div>
{% schema %}
{ "name": "Liste des collections", "settings": [] }
{% endschema %}
</section>
`;

// ---- templates JSON ----
const INDEX_TEMPLATE = `{
  "sections": {
    "hero": { "type": "hero" },
    "reassurance": {
      "type": "reassurance",
      "blocks": {
        "b1": { "type": "item", "settings": { "title": "Essai satisfait ou remboursé", "text": "30 jours pour changer d'avis" } },
        "b2": { "type": "item", "settings": { "title": "Livraison suivie", "text": "Expédié sous 24-48h" } },
        "b3": { "type": "item", "settings": { "title": "Paiement sécurisé", "text": "CB, Apple Pay, Google Pay" } }
      },
      "block_order": ["b1", "b2", "b3"]
    }
  },
  "order": ["hero", "reassurance"]
}
`;
const PRODUCT_TEMPLATE = `{
  "sections": { "main": { "type": "main-product" } },
  "order": ["main"]
}
`;
const PAGE_TEMPLATE = `{
  "sections": { "main": { "type": "main-page" } },
  "order": ["main"]
}
`;
const COLLECTION_TEMPLATE = `{
  "sections": { "main": { "type": "main-collection" } },
  "order": ["main"]
}
`;
const LIST_COLLECTIONS_TEMPLATE = `{
  "sections": { "main": { "type": "main-list-collections" } },
  "order": ["main"]
}
`;

const CART_TEMPLATE = `<section class="page"><div class="wrap page-narrow">
  <h1 class="page-title">Panier</h1>
  {%- if cart.item_count > 0 -%}
    {%- form 'cart', cart -%}
      {%- for item in cart.items -%}
        <div class="cart-line">
          <span>{{ item.product.title }} × {{ item.quantity }}</span>
          <span>{{ item.final_line_price | money }}</span>
        </div>
      {%- endfor -%}
      <p class="cart-total">Total : {{ cart.total_price | money }}</p>
      <button type="submit" name="checkout" class="cta">Passer la commande</button>
    {%- endform -%}
  {%- else -%}
    <p>Ton panier est vide.</p>
    <a href="{{ routes.all_products_collection_url }}" class="cta">Voir les produits</a>
  {%- endif -%}
</div></section>
`;

const NOT_FOUND_TEMPLATE = `<section class="page"><div class="wrap page-narrow" style="text-align:center">
  <h1 class="page-title">Page introuvable</h1>
  <p>La page que tu cherches n'existe pas ou a été déplacée.</p>
  <a href="{{ routes.root_url }}" class="cta">Retour à l'accueil</a>
</div></section>
`;

// ---- CSS ----
function themeCss() {
  return `/* Thème généré par shopgen — couleurs et polices pilotées par les réglages */
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text); font-family: var(--font-body); line-height: 1.6; font-size: 16px; }
.wrap { max-width: 1100px; margin: 0 auto; padding: 0 22px; }
a { color: inherit; text-decoration: none; }
h1, h2, h3, h4 { font-family: var(--font-heading); line-height: 1.2; }

/* header / footer */
.site-header { border-bottom: 1px solid color-mix(in srgb, var(--text) 12%, transparent); }
.header-inner { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 16px 22px; flex-wrap: wrap; }
.brand { font-family: var(--font-heading); font-weight: 700; font-size: 20px; }
.site-nav { display: flex; gap: 20px; flex-wrap: wrap; font-size: 15px; }
.site-nav a:hover { color: var(--accent); }
.cart-link { font-size: 14px; }
.site-footer { background: var(--secondary); margin-top: 60px; padding: 40px 0 24px; }
.footer-inner { display: flex; justify-content: space-between; gap: 30px; flex-wrap: wrap; }
.footer-nav { display: flex; flex-direction: column; gap: 8px; font-size: 14px; }
.tagline { opacity: .75; font-size: 14px; margin: 6px 0 0; }
.footer-legal { margin-top: 24px; font-size: 12px; opacity: .6; }

/* hero */
.hero { padding: 70px 0; }
.hero-title { font-size: clamp(28px, 5vw, 46px); margin: 0 0 14px; max-width: 16ch; }
.hero-sub { font-size: 18px; max-width: 52ch; opacity: .85; margin: 0 0 26px; }

/* boutons */
.cta { display: inline-block; background: var(--accent); color: var(--bg); font-weight: 700; border: 0; border-radius: 10px; padding: 14px 28px; font-size: 16px; font-family: inherit; cursor: pointer; }
.cta:hover { filter: brightness(1.08); }
.cta[disabled] { opacity: .5; cursor: not-allowed; }

/* réassurance */
.reassurance { background: var(--secondary); }
.reassurance-inner { display: flex; justify-content: space-around; gap: 20px; padding: 22px 0; flex-wrap: wrap; text-align: center; }
.reassure-item { display: flex; flex-direction: column; gap: 2px; font-size: 14px; }
.reassure-item strong { font-size: 15px; }

/* produit */
.product-page { padding: 40px 0; }
.product-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 44px; align-items: start; }
.product-image { width: 100%; border-radius: 14px; }
.thumbs { display: flex; gap: 8px; margin-top: 10px; }
.thumbs img { width: 72px; height: 72px; object-fit: cover; border-radius: 8px; }
.image-slot { width: 100%; aspect-ratio: 4/3; border-radius: 14px; background: color-mix(in srgb, var(--accent) 12%, var(--secondary)); display: flex; align-items: center; justify-content: center; color: color-mix(in srgb, var(--text) 55%, transparent); font-size: 14px; text-align: center; padding: 20px; }
.product-title { font-size: clamp(24px, 4vw, 34px); margin: 0 0 10px; }
.product-price { font-size: 24px; margin: 0 0 20px; }
.product-price s { opacity: .45; font-size: 18px; margin-right: 10px; }
.opt-label { display: block; font-size: 13px; margin: 12px 0 4px; opacity: .7; }
.opt-select { padding: 8px 10px; border-radius: 8px; border: 1px solid color-mix(in srgb, var(--text) 20%, transparent); font: inherit; }
.product-form .cta { width: 100%; margin-top: 16px; }
.reassure-inline { display: flex; gap: 16px; flex-wrap: wrap; font-size: 12.5px; opacity: .75; margin: 16px 0 30px; }

/* contenu riche (product.description, pages) */
.rte h2 { font-size: 22px; margin: 34px 0 8px; }
.rte h3 { font-size: 18px; margin: 26px 0 6px; }
.rte h4 { font-size: 15.5px; margin: 18px 0 4px; }
.rte p, .rte li { font-size: 15.5px; }
.rte ul, .rte ol { padding-left: 20px; }
.rte li { margin-bottom: 8px; }

/* pages & collections */
.page { padding: 46px 0; }
.page-narrow { max-width: 680px; }
.page-title { font-size: clamp(26px, 4vw, 36px); margin: 0 0 18px; }
.collection { padding: 40px 0; }
.product-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 22px; margin-top: 22px; }
.card { display: flex; flex-direction: column; gap: 6px; }
.card img, .card-ph { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 12px; }
.card-title { font-weight: 600; }
.card-price { opacity: .7; font-size: 14px; }
.cart-line { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid color-mix(in srgb, var(--text) 12%, transparent); }
.cart-total { font-weight: 700; margin: 18px 0; }

@media (max-width: 760px) {
  .product-grid { grid-template-columns: 1fr; gap: 24px; }
}
`;
}

// ---- config ----
function settingsSchema(themeName) {
  const schema = [
    {
      name: "theme_info",
      theme_name: themeName,
      theme_version: "1.0.0",
      theme_author: "shopgen",
      theme_documentation_url: "",
      theme_support_url: "",
    },
    {
      name: "Marque",
      settings: [
        { type: "text", id: "brand_name", label: "Nom de marque", default: themeName },
        { type: "text", id: "tagline", label: "Slogan", default: "" },
        { type: "color", id: "color_bg", label: "Fond", default: "#ffffff" },
        { type: "color", id: "color_secondary", label: "Secondaire", default: "#f2f2f2" },
        { type: "color", id: "color_accent", label: "Accent (boutons, prix)", default: "#111111" },
        { type: "color", id: "color_text", label: "Texte", default: "#1a1a1a" },
        { type: "text", id: "font_heading", label: "Police des titres (Google Font)", default: "Georgia" },
        { type: "text", id: "font_body", label: "Police du corps (Google Font)", default: "system-ui" },
      ],
    },
  ];
  return JSON.stringify(schema, null, 2) + "\n";
}

function settingsData(b) {
  const p = b.palette || {};
  const t = b.typography || {};
  const data = {
    current: {
      brand_name: b.brand_name || "",
      tagline: b.tagline || "",
      color_bg: hexOr(p.background, "#ffffff"),
      color_secondary: hexOr(p.secondary, "#f2f2f2"),
      color_accent: hexOr(p.accent, "#111111"),
      color_text: hexOr(p.text, "#1a1a1a"),
      font_heading: t.heading || "Georgia",
      font_body: t.body || "system-ui",
    },
  };
  return JSON.stringify(data, null, 2) + "\n";
}

const LOCALE = `{
  "general": { "search": "Rechercher" },
  "products": { "product": { "add_to_cart": "Ajouter au panier", "sold_out": "Épuisé" } }
}
`;

// ---- helpers ----
function hexOr(value, fallback) {
  const s = String(value || "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(s))
    return "#" + [...s.slice(1)].map((c) => c + c).join("").toLowerCase();
  return fallback;
}

// Échappe une valeur pour l'insérer dans un bloc JSON de schema Liquid.
function jsonStr(value) {
  return JSON.stringify(String(value ?? ""));
}
