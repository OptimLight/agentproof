import fs from "node:fs";

// Normalise n'importe quelle source produit vers ce format interne :
// { title, description, price, currency, vendor, tags[], images[], sourceUrl }

const FETCH_TIMEOUT_MS = 20_000;

export async function ingestFromShopifyUrl(url) {
  const parsed = new URL(url);
  const match = parsed.pathname.match(/\/products\/([^/?#]+?)(?:\.json)?\/?$/);
  if (!match) {
    throw new Error(
      `URL produit Shopify invalide : ${url}\nAttendu : https://boutique.com/products/<handle>`,
    );
  }
  const jsonUrl = `${parsed.origin}/products/${match[1]}.json`;
  const res = await fetch(jsonUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (shopgen; usage interne)" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(
      `Impossible de lire ${jsonUrl} (HTTP ${res.status}). ` +
        `La boutique bloque peut-être l'accès JSON public — utilise --file avec une fiche manuelle.`,
    );
  }
  if (!(res.headers.get("content-type") || "").includes("json")) {
    throw new Error(
      `${jsonUrl} ne renvoie pas du JSON (boutique protégée par mot de passe ?). ` +
        `Utilise --file avec une fiche manuelle.`,
    );
  }
  const { product } = await res.json();
  if (!product) throw new Error(`Réponse inattendue de ${jsonUrl}`);

  const firstVariant = product.variants?.[0] ?? {};
  if (firstVariant.price == null) {
    throw new Error(
      `Prix introuvable sur ${jsonUrl} — renseigne la fiche à la main avec --file.`,
    );
  }
  return {
    title: product.title,
    description: stripHtml(product.body_html || ""),
    price: normalizePrice(firstVariant.price),
    compareAtPrice: firstVariant.compare_at_price
      ? normalizePrice(firstVariant.compare_at_price)
      : null,
    vendor: product.vendor || "",
    tags: splitTags(product.tags),
    images: normalizeImages(product.images?.map((i) => i.src)),
    sourceUrl: url,
  };
}

export function ingestFromFile(filePath) {
  if (!filePath || filePath.startsWith("--")) {
    throw new Error(
      "Option --file : chemin du fichier produit manquant (ex: --file exemples/produit.json)",
    );
  }
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  for (const field of ["title", "price"]) {
    if (raw[field] == null || raw[field] === "") {
      throw new Error(
        `Champ obligatoire manquant dans ${filePath} : "${field}". ` +
          `Format attendu : { "title", "description", "price", "images": [urls], "vendor"?, "tags"? }`,
      );
    }
  }
  return {
    title: raw.title,
    description: raw.description || "",
    price: normalizePrice(raw.price),
    compareAtPrice:
      raw.compareAtPrice != null && raw.compareAtPrice !== ""
        ? normalizePrice(raw.compareAtPrice)
        : null,
    vendor: raw.vendor || "",
    tags: Array.isArray(raw.tags) ? raw.tags : splitTags(raw.tags),
    images: normalizeImages(raw.images),
    sourceUrl: raw.sourceUrl || null,
  };
}

// Accepte "34,90", "34.90 €", " 1 249,00 " → "1249.00" ; refuse le reste
// (mieux vaut échouer ici qu'envoyer un prix faux à Shopify).
export function normalizePrice(value) {
  const cleaned = String(value)
    .replace(/[^\d.,-]/g, "")
    .replace(/\s/g, "")
    .replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) {
    throw new Error(
      `Prix invalide : « ${value} » — attendu un nombre (ex: 34.90 ou 34,90).`,
    );
  }
  return cleaned;
}

function normalizeImages(images) {
  if (!images) return [];
  if (typeof images === "string") return images.trim() ? [images.trim()] : [];
  if (!Array.isArray(images)) {
    throw new Error(`Champ "images" invalide : attendu un tableau d'URLs.`);
  }
  return images.filter((i) => typeof i === "string" && i.trim());
}

function splitTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  return String(tags)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
