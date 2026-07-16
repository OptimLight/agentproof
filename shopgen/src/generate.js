import Anthropic from "@anthropic-ai/sdk";
import {
  brandSystemPrompt,
  contentSystemPrompt,
  BRAND_SCHEMA,
  CONTENT_SCHEMA,
} from "./prompts.js";

const MODEL = "claude-opus-4-8";

let client;
function getClient(cfg) {
  if (!client) client = new Anthropic({ apiKey: cfg.anthropicKey });
  return client;
}

async function structuredCall(cfg, { system, user, schema, maxTokens }) {
  const stream = getClient(cfg).messages.stream({
    model: MODEL,
    max_tokens: maxTokens,
    thinking: { type: "adaptive" },
    system,
    output_config: { format: { type: "json_schema", schema } },
    messages: [{ role: "user", content: user }],
  });
  const message = await stream.finalMessage();
  if (message.stop_reason === "refusal") {
    throw new Error("La génération a été refusée par le modèle.");
  }
  if (message.stop_reason === "max_tokens") {
    throw new Error(
      "Sortie tronquée (max_tokens atteint) — réessaie, ou réduis la taille du produit source.",
    );
  }
  const text = message.content.find((b) => b.type === "text")?.text;
  if (!text) throw new Error("Réponse vide du modèle.");
  return JSON.parse(text);
}

export async function generateBrandKit(cfg, product, feedback = null) {
  const user = [
    `Voici le produit source :\n${JSON.stringify(product, null, 2)}`,
    feedback
      ? `\nRetour de l'utilisateur sur la proposition précédente — corrige en conséquence :\n${feedback}`
      : "",
    `\nConstruis le brand kit complet (persona d'abord, puis identité).`,
  ].join("\n");

  return structuredCall(cfg, {
    system: brandSystemPrompt(cfg),
    user,
    schema: BRAND_SCHEMA,
    maxTokens: 16000,
  });
}

export async function generateContent(cfg, product, brandKit, feedback = null) {
  const user = [
    `Produit source :\n${JSON.stringify(product, null, 2)}`,
    `\nBrand kit validé :\n${JSON.stringify(brandKit, null, 2)}`,
    feedback
      ? `\nRetour de l'utilisateur sur la proposition précédente — corrige en conséquence :\n${feedback}`
      : "",
    `\nRédige l'intégralité du contenu de la boutique : fiche produit complète, toutes les pages (à propos, contact, livraison-retours, FAQ générale, CGV, politique de confidentialité, mentions légales, politique de remboursement), 1 à 3 collections pertinentes, et les menus principal et footer.`,
  ].join("\n");

  return structuredCall(cfg, {
    system: contentSystemPrompt(cfg),
    user,
    schema: CONTENT_SCHEMA,
    maxTokens: 64000,
  });
}
