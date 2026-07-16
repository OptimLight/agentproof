import fs from "node:fs";

// Normalise n'importe quelle source produit vers ce format interne :
// { title, description, price, currency, vendor, tags[], images[], sourceUrl }

export async function ingestFromShopifyUrl(url) {
  const parsed = new URL(url);
  const match = parsed.pathname.match(/\/products\/([^/]+?)(?:\.json)?$/);
  if (!match) {
    throw new Error(
      `URL produit Shopify invalide : ${url}\nAttendu : https://boutique.com/products/<handle>`,
    );
  }
  const jsonUrl = `${parsed.origin}/products/${match[1]}.json`;
  const res = await fetch(jsonUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (shopgen; usage interne)" },
  });
  if (!res.ok) {
    throw new Error(
      `Impossible de lire ${jsonUrl} (HTTP ${res.status}). ` +
        `La boutique bloque peut-être l'accès JSON public — utilise --file avec une fiche manuelle.`,
    );
  }
  const { product } = await res.json();
  if (!product) throw new Error(`Réponse inattendue de ${jsonUrl}`);

  const firstVariant = product.variants?.[0] ?? {};
  return {
    title: product.title,
    description: stripHtml(product.body_html || ""),
    price: firstVariant.price || "0.00",
    compareAtPrice: firstVariant.compare_at_price || null,
    vendor: product.vendor || "",
    tags: splitTags(product.tags),
    images: (product.images || []).map((i) => i.src).filter(Boolean),
    sourceUrl: url,
  };
}

export function ingestFromFile(filePath) {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  for (const field of ["title", "price"]) {
    if (!raw[field]) {
      throw new Error(
        `Champ obligatoire manquant dans ${filePath} : "${field}". ` +
          `Format attendu : { "title", "description", "price", "images": [urls], "vendor"?, "tags"? }`,
      );
    }
  }
  return {
    title: raw.title,
    description: raw.description || "",
    price: String(raw.price),
    compareAtPrice: raw.compareAtPrice ? String(raw.compareAtPrice) : null,
    vendor: raw.vendor || "",
    tags: Array.isArray(raw.tags) ? raw.tags : splitTags(raw.tags),
    images: raw.images || [],
    sourceUrl: raw.sourceUrl || null,
  };
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
    .replace(/\s+/g, " ")
    .trim();
}
