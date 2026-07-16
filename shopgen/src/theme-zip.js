import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Zippe un dossier de thème pour l'importer dans Shopify (Thèmes → Ajouter →
// Importer). Utilise la commande `zip` (présente sur macOS/Linux) ; si elle est
// absente, renvoie null et l'utilisateur importe le dossier tel quel.
export function zipTheme(themeDir) {
  const zipPath = `${themeDir}.zip`;
  try {
    fs.rmSync(zipPath, { force: true });
  } catch {
    // pas de zip précédent : rien à faire
  }
  const res = spawnSync("zip", ["-r", "-q", path.basename(zipPath), "."], {
    cwd: themeDir,
    stdio: "ignore",
  });
  if (res.status !== 0) return null;
  // zip a écrit dans themeDir/<name>.zip ; on le remonte à côté du dossier.
  const inside = path.join(themeDir, path.basename(zipPath));
  if (fs.existsSync(inside)) {
    fs.renameSync(inside, zipPath);
  }
  return fs.existsSync(zipPath) ? zipPath : null;
}
