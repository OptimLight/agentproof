const API_VERSION = "2025-07";

async function graphql(cfg, query, variables) {
  const res = await fetch(
    `https://${cfg.storeDomain}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": cfg.adminToken,
      },
      body: JSON.stringify({ query, variables }),
    },
  );
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(`Erreur API Shopify : ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

function assertNoUserErrors(payload, label) {
  const errors = payload?.userErrors;
  if (errors?.length) {
    throw new Error(
      `${label} — Shopify a refusé : ${errors
        .map((e) => `${(e.field || []).join(".")}: ${e.message}`)
        .join(" | ")}`,
    );
  }
}

export async function createProduct(cfg, { content, product, brandKit }) {
  const input = {
    title: content.product.title,
    descriptionHtml: content.product.description_html,
    vendor: brandKit.brand_name,
    tags: content.product.tags,
    status: "DRAFT",
    seo: {
      title: content.product.seo_title,
      description: content.product.seo_description,
    },
    productOptions: [
      { name: "Title", values: [{ name: "Default Title" }] },
    ],
    variants: [
      {
        optionValues: [{ optionName: "Title", name: "Default Title" }],
        price: product.price,
        ...(product.compareAtPrice
          ? { compareAtPrice: product.compareAtPrice }
          : {}),
      },
    ],
    ...(product.images.length
      ? {
          files: product.images.map((src) => ({
            originalSource: src,
            contentType: "IMAGE",
          })),
        }
      : {}),
  };

  const data = await graphql(
    cfg,
    `mutation productSet($input: ProductSetInput!, $synchronous: Boolean!) {
      productSet(input: $input, synchronous: $synchronous) {
        product { id handle title }
        userErrors { field message }
      }
    }`,
    { input, synchronous: true },
  );
  assertNoUserErrors(data.productSet, "Création du produit");
  return data.productSet.product;
}

export async function createPage(cfg, page) {
  const data = await graphql(
    cfg,
    `mutation pageCreate($page: PageCreateInput!) {
      pageCreate(page: $page) {
        page { id handle title }
        userErrors { code field message }
      }
    }`,
    {
      page: {
        title: page.title,
        handle: page.handle,
        body: page.body_html,
        isPublished: true,
      },
    },
  );
  assertNoUserErrors(data.pageCreate, `Page « ${page.title} »`);
  return data.pageCreate.page;
}

// Collections "intelligentes" par tag : le produit est rattaché automatiquement
// via ses tags, aucune mutation d'assignation nécessaire.
export async function createCollection(cfg, collection) {
  const data = await graphql(
    cfg,
    `mutation collectionCreate($input: CollectionInput!) {
      collectionCreate(input: $input) {
        collection { id handle title }
        userErrors { field message }
      }
    }`,
    {
      input: {
        title: collection.title,
        handle: collection.handle,
        descriptionHtml: collection.description_html,
        ruleSet: {
          appliedDisjunctively: false,
          rules: [
            { column: "TAG", relation: "EQUALS", condition: collection.tag },
          ],
        },
      },
    },
  );
  assertNoUserErrors(data.collectionCreate, `Collection « ${collection.title} »`);
  return data.collectionCreate.collection;
}

// Les menus par défaut (main-menu, footer) ne sont pas remplacés : on crée des
// menus dédiés que tu assignes ensuite dans les réglages du thème (2 clics).
export async function createMenu(cfg, { title, handle, items }, created) {
  const menuItems = items
    .map((item) => toMenuItem(cfg, item, created))
    .filter(Boolean);
  if (!menuItems.length) return null;

  const data = await graphql(
    cfg,
    `mutation menuCreate($title: String!, $handle: String!, $items: [MenuItemCreateInput!]!) {
      menuCreate(title: $title, handle: $handle, items: $items) {
        menu { id handle title }
        userErrors { code field message }
      }
    }`,
    { title, handle, items: menuItems },
  );
  assertNoUserErrors(data.menuCreate, `Menu « ${title} »`);
  return data.menuCreate.menu;
}

function toMenuItem(cfg, item, created) {
  switch (item.type) {
    case "home":
      return { title: item.title, type: "FRONTPAGE" };
    case "product": {
      const id = created.product?.id;
      return id ? { title: item.title, type: "PRODUCT", resourceId: id } : null;
    }
    case "collection": {
      const id = created.collections?.[item.handle];
      return id
        ? { title: item.title, type: "COLLECTION", resourceId: id }
        : null;
    }
    case "page": {
      const id = created.pages?.[item.handle];
      return id ? { title: item.title, type: "PAGE", resourceId: id } : null;
    }
    default:
      return null;
  }
}
