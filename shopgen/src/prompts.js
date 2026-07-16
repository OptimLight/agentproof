import fs from "node:fs";
import path from "node:path";

// Les modules de connaissance (CRO, copywriting, personas, structure, design)
// sont injectés dans les prompts système. C'est là que vit l'expertise de la
// pipeline — modifie les fichiers knowledge/*.md pour affiner les résultats
// sans toucher au code.

function loadKnowledge(root, files) {
  return files
    .map((name) => {
      const content = fs.readFileSync(
        path.join(root, "knowledge", name),
        "utf8",
      );
      return `<playbook source="${name}">\n${content}\n</playbook>`;
    })
    .join("\n\n");
}

export function brandSystemPrompt(cfg) {
  const knowledge = loadKnowledge(cfg.root, ["personas.md", "design.md"]);
  return `Tu es directeur de marque et stratège e-commerce senior. À partir d'un produit, tu construis une identité de marque complète et un persona marketing exploitable, en suivant rigoureusement les playbooks ci-dessous.

${knowledge}

Règles absolues :
- Langue de sortie : ${cfg.language}.
- Le nom de marque doit être court (1-2 mots), prononçable en ${cfg.language}, disponible de manière plausible (pas de nom de marque déposée connue), et cohérent avec le positionnement.
- Le persona pilote tout : construis-le d'abord mentalement, puis dérive le ton, la palette et la typographie de lui.
- Palette : hex exacts, règle 60-30-10, contraste lisible.
- Typographies : uniquement des Google Fonts disponibles dans Shopify.
- N'invente JAMAIS de faits sur le produit qui ne sont pas dans sa fiche : tu peux reformuler et structurer, pas fabriquer des chiffres ou certifications.`;
}

export function contentSystemPrompt(cfg) {
  const knowledge = loadKnowledge(cfg.root, [
    "cro.md",
    "copywriting.md",
    "structure.md",
  ]);
  return `Tu es copywriter e-commerce senior spécialisé en conversion (CRO). Tu rédiges l'intégralité du contenu d'une boutique Shopify à partir d'un produit et d'un brand kit, en suivant rigoureusement les playbooks ci-dessous.

${knowledge}

Règles absolues :
- Langue de sortie : ${cfg.language}. Devise : ${cfg.currency}.
- Respecte le ton de voix et le tutoiement/vouvoiement définis dans le brand kit, PARTOUT.
- Chaque page produit suit la structure imposée (hook → bénéfices → comment ça marche → preuve → FAQ → garantie), rendue en HTML propre : h2/h3, <p> courts, <ul> pour les listes. Pas de styles inline, pas de <div> décoratifs — le thème s'occupe du style.
- La FAQ produit lève les objections du persona, une par une, avec des faits.
- N'invente JAMAIS : pas de faux avis chiffrés, pas de caractéristiques absentes de la fiche source, pas de délais de livraison précis si inconnus (utilise des formulations prudentes à personnaliser, signalées entre [crochets]).
- handles/slugs : minuscules, tirets, courts.
- Les collections utilisent le champ "tag" pour le rattachement automatique des produits : choisis un tag simple par collection et ajoute ces tags au produit.`;
}

export const BRAND_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "brand_name",
    "tagline",
    "positioning",
    "persona",
    "tone_of_voice",
    "palette",
    "typography",
    "photo_style",
  ],
  properties: {
    brand_name: { type: "string" },
    tagline: { type: "string", description: "Slogan court, bénéfice principal" },
    positioning: {
      type: "string",
      description:
        "Positionnement en 2-3 phrases : pour qui, contre quoi, pourquoi nous",
    },
    persona: {
      type: "object",
      additionalProperties: false,
      required: [
        "summary",
        "job_to_be_done",
        "pains",
        "desires",
        "objections",
        "triggers",
        "awareness_level",
      ],
      properties: {
        summary: { type: "string" },
        job_to_be_done: { type: "string" },
        pains: { type: "array", items: { type: "string" } },
        desires: { type: "array", items: { type: "string" } },
        objections: { type: "array", items: { type: "string" } },
        triggers: { type: "array", items: { type: "string" } },
        awareness_level: {
          type: "string",
          enum: [
            "inconscient_du_probleme",
            "conscient_du_probleme",
            "conscient_de_la_solution",
            "conscient_du_produit",
          ],
        },
      },
    },
    tone_of_voice: {
      type: "object",
      additionalProperties: false,
      required: ["description", "address", "do", "dont"],
      properties: {
        description: { type: "string" },
        address: { type: "string", enum: ["tu", "vous"] },
        do: { type: "array", items: { type: "string" } },
        dont: { type: "array", items: { type: "string" } },
      },
    },
    palette: {
      type: "object",
      additionalProperties: false,
      required: ["background", "secondary", "accent", "text", "rationale"],
      properties: {
        background: { type: "string", description: "hex, couleur 60%" },
        secondary: { type: "string", description: "hex, couleur 30%" },
        accent: { type: "string", description: "hex, couleur 10% — CTA uniquement" },
        text: { type: "string", description: "hex du texte principal" },
        rationale: { type: "string" },
      },
    },
    typography: {
      type: "object",
      additionalProperties: false,
      required: ["heading", "body", "rationale"],
      properties: {
        heading: { type: "string", description: "Google Font pour les titres" },
        body: { type: "string", description: "Google Font pour le corps" },
        rationale: { type: "string" },
      },
    },
    photo_style: {
      type: "string",
      description:
        "Guide de style photo : fond, lumière, ambiance, présence humaine",
    },
  },
};

export const CONTENT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["product", "pages", "collections", "menu"],
  properties: {
    product: {
      type: "object",
      additionalProperties: false,
      required: [
        "title",
        "description_html",
        "seo_title",
        "seo_description",
        "tags",
      ],
      properties: {
        title: { type: "string", description: "Titre bénéfice, ≤ 70 caractères" },
        description_html: {
          type: "string",
          description:
            "Corps complet de la fiche produit en HTML (structure imposée)",
        },
        seo_title: { type: "string", description: "≤ 60 caractères" },
        seo_description: { type: "string", description: "≤ 155 caractères" },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags produit, incluant les tags de collection",
        },
      },
    },
    pages: {
      type: "array",
      description:
        "Pages : à propos, contact, livraison-retours, FAQ générale, CGV, confidentialité, mentions légales, remboursement",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "handle", "body_html"],
        properties: {
          title: { type: "string" },
          handle: { type: "string" },
          body_html: { type: "string" },
        },
      },
    },
    collections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "handle", "description_html", "tag"],
        properties: {
          title: { type: "string" },
          handle: { type: "string" },
          description_html: { type: "string" },
          tag: {
            type: "string",
            description:
              "Tag de rattachement automatique — doit figurer dans product.tags",
          },
        },
      },
    },
    menu: {
      type: "object",
      additionalProperties: false,
      required: ["main", "footer"],
      properties: {
        main: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["title", "type", "handle"],
            properties: {
              title: { type: "string" },
              type: {
                type: "string",
                enum: ["home", "product", "collection", "page"],
              },
              handle: {
                type: "string",
                description: "handle de la cible ('' pour home/product unique)",
              },
            },
          },
        },
        footer: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["title", "type", "handle"],
            properties: {
              title: { type: "string" },
              type: {
                type: "string",
                enum: ["home", "product", "collection", "page"],
              },
              handle: { type: "string" },
            },
          },
        },
      },
    },
  },
};
