# shopgen — générateur privé de boutiques Shopify par IA

Outil interne. Prend **un produit** en entrée, produit **une boutique complète** : brand kit (persona, positionnement, palette, typo), copy CRO (fiche produit, pages, FAQ), collections et menus — poussés automatiquement dans ta boutique Shopify via l'API Admin.

L'expertise (CRO, copywriting, personas, structure, design) vit dans `knowledge/*.md` : modifie ces playbooks pour affiner les résultats sans toucher au code.

## Installation

```bash
cd shopgen
npm install
cp .env.example .env   # puis remplis les valeurs (voir ci-dessous)
```

## Configuration Shopify (une fois, ~5 minutes)

1. **Boutique de test gratuite** : crée un compte [Shopify Partners](https://partners.shopify.com) → « Stores » → « Add store » → « Development store ». Gratuit et illimité.
2. **Custom app** : dans l'admin de la boutique → **Settings → Apps and sales channels → Develop apps → Create an app** (active d'abord le développement d'apps si demandé).
3. **Scopes** : dans l'app → **Configuration → Admin API integration**, coche :
   - `write_products`, `read_products`
   - `write_content`, `read_content` (pages)
   - `write_online_store_navigation` (menus)
4. **Token** : onglet **API credentials → Install app** → révèle le **Admin API access token** (`shpat_…`). Il n'est montré qu'une fois — copie-le dans `.env` (`SHOPIFY_ADMIN_TOKEN`).
5. `SHOPIFY_STORE_DOMAIN` = le domaine `*.myshopify.com` de la boutique.

## Utilisation

### Interface web (recommandé)

```bash
npm run ui   # puis ouvre http://127.0.0.1:3333
```

Workflow en 4 étapes dans le navigateur : produit → brand kit → contenu → push.
**Tout est modifiable en direct** (textes, palette au color-picker, typos, HTML
des pages) et l'aperçu boutique à droite se met à jour à chaque frappe. Les
champs « commentaire de régénération » permettent de relancer l'IA avec une
consigne (« plus haut de gamme », « FAQ plus rassurante »…). Sans configuration
Shopify, l'interface fonctionne en mode génération seule.

### Ligne de commande

```bash
# Depuis un produit Shopify public (n'importe quelle boutique)
node src/index.js https://une-boutique.com/products/mon-produit

# Depuis une fiche produit locale (AliExpress/Amazon : copie les infos à la main)
node src/index.js --file exemples/produit.json

# Générer sans rien pousser (test des prompts)
node src/index.js --dry-run --file exemples/produit.json
```

Déroulé : ingestion → **brand kit** (tu valides ou `regen <commentaire>`) → **contenu complet** (tu valides) → push Shopify → rapport avec les 4 finitions manuelles (activer le produit, assigner les menus, appliquer couleurs/typos au thème, relire les textes entre `[crochets]`).

Chaque génération est sauvegardée dans `shopgen-output/` (audit + réutilisation).

## Format de fiche produit manuelle

```json
{
  "title": "Coussin cervical ergonomique",
  "description": "Mousse à mémoire de forme, housse lavable, 40x30cm…",
  "price": "34.90",
  "compareAtPrice": "49.90",
  "images": ["https://exemple.com/image1.jpg"],
  "tags": ["confort", "sommeil"]
}
```

## Coûts et garde-fous

- ~1-3 € d'API Anthropic par boutique générée.
- Le produit est créé en **brouillon** : rien n'est publié sans toi.
- Aucun faux avis, faux compteur ni fausse rareté n'est généré (voir `knowledge/cro.md`) — c'est volontaire et non négociable légalement.
- `.env` est ignoré par git ; ne le commite jamais.

## Limites connues (V1)

- Les images poussées sont celles du produit source ; la génération d'images IA cohérentes au brand kit est prévue en phase 2.
- Les couleurs/typos du thème s'appliquent à la main (l'API Shopify restreint l'écriture des réglages de thème) — le rapport final te donne les valeurs exactes.
- L'import AliExpress/Amazon direct n'est pas implémenté (anti-bots) : utilise `--file`.
