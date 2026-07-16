import readline from "node:readline/promises";

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

export function printBrandKit(kit) {
  console.log(`\n${BOLD}━━━ BRAND KIT ━━━${RESET}`);
  console.log(`${BOLD}Marque :${RESET} ${kit.brand_name} — « ${kit.tagline} »`);
  console.log(`${BOLD}Positionnement :${RESET} ${kit.positioning}`);
  console.log(`\n${BOLD}Persona :${RESET} ${kit.persona.summary}`);
  console.log(`${DIM}Job-to-be-done :${RESET} ${kit.persona.job_to_be_done}`);
  list("Douleurs", kit.persona.pains);
  list("Objections", kit.persona.objections);
  console.log(
    `\n${BOLD}Ton :${RESET} ${kit.tone_of_voice.description} (${kit.tone_of_voice.address})`,
  );
  console.log(
    `${BOLD}Palette :${RESET} fond ${kit.palette.background} · secondaire ${kit.palette.secondary} · accent ${kit.palette.accent} · texte ${kit.palette.text}`,
  );
  console.log(
    `${BOLD}Typo :${RESET} titres ${kit.typography.heading} / corps ${kit.typography.body}`,
  );
  console.log(`${BOLD}Style photo :${RESET} ${kit.photo_style}`);
}

export function printContentSummary(content) {
  console.log(`\n${BOLD}━━━ CONTENU GÉNÉRÉ ━━━${RESET}`);
  console.log(`${BOLD}Produit :${RESET} ${content.product.title}`);
  console.log(`${DIM}SEO :${RESET} ${content.product.seo_title}`);
  console.log(`${DIM}Tags :${RESET} ${content.product.tags.join(", ")}`);
  console.log(`\n${DIM}── Extrait de la fiche produit ──${RESET}`);
  console.log(truncate(stripHtml(content.product.description_html), 900));
  console.log(`\n${BOLD}Pages (${content.pages.length}) :${RESET}`);
  for (const p of content.pages) console.log(`  • ${p.title} (/pages/${p.handle})`);
  console.log(`${BOLD}Collections :${RESET}`);
  for (const c of content.collections)
    console.log(`  • ${c.title} (tag: ${c.tag})`);
  console.log(
    `${BOLD}Menu principal :${RESET} ${content.menu.main.map((i) => i.title).join(" · ")}`,
  );
}

// Retourne { action: "ok" | "regen" | "quit", feedback }
export async function checkpoint(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    while (true) {
      const answer = (
        await rl.question(
          `\n${question}\n  ${BOLD}ok${RESET} = valider · ${BOLD}regen <commentaire>${RESET} = régénérer · ${BOLD}quit${RESET} = abandonner\n> `,
        )
      ).trim();
      if (answer.toLowerCase() === "ok") return { action: "ok" };
      if (answer.toLowerCase() === "quit") return { action: "quit" };
      if (answer.toLowerCase().startsWith("regen")) {
        return {
          action: "regen",
          feedback: answer.slice(5).trim() || "Propose une direction différente.",
        };
      }
      console.log(`Réponse non reconnue : « ${answer} »`);
    }
  } finally {
    rl.close();
  }
}

function list(label, items) {
  console.log(`${DIM}${label} :${RESET}`);
  for (const item of items) console.log(`  • ${item}`);
}

function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
