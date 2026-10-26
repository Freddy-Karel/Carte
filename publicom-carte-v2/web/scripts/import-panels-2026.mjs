import { cp, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = process.env.PANELS_SOURCE_DIR ?? path.resolve(projectRoot, "..", "PANNEAUX  PUBLICOM", "PANNEAUX 2026");
const mediaRoot = path.join(projectRoot, "public", "media", "panels-2026");
const reportPath = path.join(projectRoot, "data", "panels-2026-import-report.json");
const imageExtensions = new Set([".jpg", ".jpeg", ".png"]);
const { Pool } = pg;

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function loadLocalDatabaseUrl() {
  if (process.env.DATABASE_URL) return;
  const environment = await readFile(path.join(projectRoot, ".env.local"), "utf8");
  const match = environment.match(/^DATABASE_URL=(.+)$/m);
  if (match) process.env.DATABASE_URL = match[1].trim();
}

function slugify(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 160);
}

function cleanLabel(value) {
  return value.replace(/^n[°ºo]?\s*\d+\s*/iu, "").replace(/[._]/g, " ").replace(/\s+/g, " ").trim();
}

function inferZone(label) {
  const normalized = label.toLowerCase();
  if (/(aeroport|akanda|pk7|pk10|lac bleu|ballon d'or)/u.test(normalized)) return "ZA1";
  if (/(contournement|nzeng ayong)/u.test(normalized)) return "ZA3";
  if (/(oloumi|sogatol|sogi|foberd|camp aissa|glass|boul(ingui|engui)|petit dubai)/u.test(normalized)) return "ZU4";
  if (/(petit paris|cosmoparc|gros bouquet|guegue|charbonnage|democratie|residence jade)/u.test(normalized)) return "ZU3";
  return "ZU2";
}

async function directImages(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const images = await Promise.all(entries.filter((entry) => entry.isFile() && !entry.name.startsWith("._") && imageExtensions.has(path.extname(entry.name).toLowerCase())).map(async (entry) => {
    const filePath = path.join(directory, entry.name);
    return { filePath, name: entry.name, size: (await stat(filePath)).size };
  }));
  return images.sort((left, right) => right.size - left.size);
}

async function collectLocations(directory, parentLabel = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const images = await directImages(directory);
  const locations = images.length ? [{ directory, label: parentLabel || path.basename(directory), image: images[0] }] : [];
  const nested = await Promise.all(entries.filter((entry) => entry.isDirectory()).map((entry) => {
    const label = parentLabel ? `${parentLabel} — ${entry.name}` : entry.name;
    return collectLocations(path.join(directory, entry.name), label);
  }));
  return [...locations, ...nested.flat()];
}

function geocodeQuery(label) {
  const normalized = cleanLabel(label).toLowerCase();
  const aliases = [
    [/democratie/u, "Rond-Point de la Démocratie"],
    [/gros bouquet/u, "Gros Bouquet"],
    [/voie de contournement/u, "Voie de contournement"],
    [/pk7/u, "PK7 Libreville"],
    [/iai/u, "Institut Africain d'Informatique Libreville"],
    [/lalala/u, "Échangeur de Lalala"],
    [/boulingui/u, "Carrefour Boulingui"],
    [/residence jade/u, "Résidence Jade Libreville"],
    [/jean paul|bessieux|martine oulabou/u, "Avenue Jean Paul II Libreville"],
    [/ballon d'or/u, "Ballon d'Or Akanda"],
    [/commissariat central/u, "Commissariat central Libreville"],
    [/cosmoparc/u, "Cosmoparc Libreville"],
    [/charbonnages/u, "Charbonnages Libreville"],
    [/camp aissa/u, "Camp Aïssa Libreville"],
    [/oloumi|foberd/u, "Oloumi Libreville"],
    [/plaine niger/u, "Plaine Niger Libreville"],
    [/petit dubai/u, "Petit Dubai Libreville"],
  ];
  const alias = aliases.find(([pattern]) => pattern.test(normalized))?.[1];
  return `${alias ?? cleanLabel(label.replace(/\s*—\s*sens\b.*$/iu, "")).replace(/\(.*?\)/g, "")}, Libreville, Gabon`;
}

async function geocode(label) {
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&q=${encodeURIComponent(geocodeQuery(label))}`, {
    headers: { "User-Agent": "PublicomCarte/1.0 (catalogue local, contact@publicom.ga)", Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Géocodage indisponible (${response.status})`);
  const results = await response.json();
  const result = results.find((item) => Number(item.lat) > 0.2 && Number(item.lat) < 0.7 && Number(item.lon) > 9.2 && Number(item.lon) < 9.8);
  return result ? { latitude: Number(result.lat), longitude: Number(result.lon), displayName: result.display_name } : null;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const rootEntries = await readdir(sourceRoot, { withFileTypes: true });
  const nested = await Promise.all(rootEntries.filter((entry) => entry.isDirectory()).map((entry) => collectLocations(path.join(sourceRoot, entry.name), entry.name)));
  const locations = nested.flat().sort((left, right) => left.label.localeCompare(right.label, "fr"));
  const report = { generatedAt: new Date().toISOString(), sourceRoot, panels: [], unresolved: [] };

  for (const [index, location] of locations.entries()) {
    const reference = `PUB-2026-${String(index + 1).padStart(3, "0")}`;
    let point = null;
    try { point = await geocode(location.label); } catch (error) { report.unresolved.push({ reference, label: location.label, reason: error.message }); }
    if (!point && !report.unresolved.some((item) => item.reference === reference)) report.unresolved.push({ reference, label: location.label, reason: "Repère introuvable dans OpenStreetMap" });
    report.panels.push({ reference, label: location.label, sourceImage: location.image.filePath, coverImage: `panel-2026-${String(index + 1).padStart(3, "0")}${path.extname(location.image.name).toLowerCase()}`, point });
    await sleep(1100);
  }

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`${report.panels.length} panneau(x) recensé(s), ${report.unresolved.length} position(s) à confirmer.`);
  if (!apply) return;

  await loadLocalDatabaseUrl();
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL est requis pour l'importation.");
  const resolved = report.panels.filter((panel) => panel.point);
  if (!resolved.length) throw new Error("Aucune position résolue : importation annulée.");

  await mkdir(mediaRoot, { recursive: true });
  const database = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await database.query(`ALTER TABLE supports ADD COLUMN IF NOT EXISTS source_label TEXT; ALTER TABLE supports ADD COLUMN IF NOT EXISTS location_precision SMALLINT NOT NULL DEFAULT 0;`);
    await database.query("UPDATE supports SET is_published = FALSE WHERE reference LIKE 'PU-%'");
    await database.query("UPDATE supports SET is_published = FALSE WHERE reference LIKE 'PUB-2026-%'");

    for (const panel of resolved) {
      const extension = path.extname(panel.coverImage);
      const mediaName = `${path.basename(panel.coverImage, extension)}${extension === ".jpeg" ? ".jpg" : extension}`;
      const destination = path.join(mediaRoot, mediaName);
      await cp(panel.sourceImage, destination);
      const slug = `${slugify(panel.label)}-${panel.reference.toLowerCase()}`;
      const zone = inferZone(panel.label);
      const support = await database.query(`
        INSERT INTO supports (reference, name, slug, zone_id, address, latitude, longitude, support_type, dimensions, status, description, is_published, source_label, location_precision)
        VALUES ($1, $2, $3, (SELECT id FROM zones WHERE code = $4), $5, $6, $7, 'Panneau d''affichage', NULL, 'AVAILABLE', $8, TRUE, $9, 2)
        ON CONFLICT (reference) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, zone_id = EXCLUDED.zone_id, address = EXCLUDED.address,
          latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, support_type = EXCLUDED.support_type, description = EXCLUDED.description,
          is_published = TRUE, source_label = EXCLUDED.source_label, location_precision = EXCLUDED.location_precision, updated_at = NOW()
        RETURNING id
      `, [panel.reference, cleanLabel(panel.label), slug, zone, panel.label, panel.point.latitude, panel.point.longitude, `Emplacement ${cleanLabel(panel.label)} à Libreville.`, panel.label]);
      const supportId = support.rows[0].id;
      await database.query("DELETE FROM support_media WHERE support_id = $1", [supportId]);
      await database.query("INSERT INTO support_media (support_id, url, alt_text, display_order, is_cover) VALUES ($1, $2, $3, 1, TRUE)", [supportId, `/media/panels-2026/${mediaName}`, `Panneau Publicom — ${cleanLabel(panel.label)} à Libreville`]);
    }
  } finally { await database.end(); }
  console.log(`${resolved.length} panneau(x) importé(s) dans PostgreSQL et dans public/media/panels-2026.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
