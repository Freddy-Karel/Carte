import { access, readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const executeFile = promisify(execFile);
const { Pool } = pg;
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportPath = path.join(projectRoot, "data", "panels-2026-import-report.json");
const mediaRoot = path.join(projectRoot, "public", "media", "panels-2026");
const legacyRoot = process.env.LEGACY_PUBLICOM_ROOT ?? "C:/wamp64/www/Publicom";
const phpBinary = process.env.PHP_BINARY ?? "C:/wamp64/bin/php/php8.4.15/php.exe";

const sourceStatement = `
require '${legacyRoot.replaceAll("\\", "/")}/database.php';
$panels = $pdo->query("SELECT p.id, p.identifiant AS reference, p.emplacement, p.nombre_faces, tp.libelle AS type, z.nom AS zone_name, sz.nom AS subzone_name FROM panneaux p JOIN sous_zones sz ON sz.id = p.sous_zone_id JOIN zones z ON z.id = sz.zone_id LEFT JOIN types_panneaux tp ON tp.id = p.type_panneau_id ORDER BY p.identifiant")->fetchAll(PDO::FETCH_ASSOC);
$faces = $pdo->query("SELECT p.identifiant AS reference, s.code, s.orientation, s.direction, s.statut FROM sens s JOIN panneaux p ON p.id = s.panneau_id ORDER BY p.identifiant, s.orientation")->fetchAll(PDO::FETCH_ASSOC);
echo json_encode(['panels' => $panels, 'faces' => $faces], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
`;

const canonicalImages = [
  [/democra/i, "ZU014"], [/kalikak/i, "ZU021"], [/(g\s*telecom|ancienne\s*rtg)/i, "ZU013"],
  [/gros bouquet/i, "ZU019"], [/contournement/i, "ZA321"], [/pk7/i, "ZU031"],
  [/(iai|mur du golf)/i, "ZU033"], [/lalala.*avant/i, "ZU034"], [/lalala.*apres/i, "ZU035"],
  [/glass/i, "ZU008"], [/residence jade/i, "ZA209"], [/sogatol/i, "ZU001"],
  [/jean paul.*beac/i, "ZU010"], [/ballon d.or/i, "ZA214"], [/lac bleu/i, "ZU015"],
  [/bas de gue/i, "ZU016"], [/poste d.ak/i, "ZU023"], [/commissariat/i, "ZU022"],
  [/petit paris/i, "ZU026"], [/cosmoparc/i, "ZU027"], [/charbonnages/i, "ZU028"],
  [/nzeng/i, "ZU029"], [/pk10/i, "ZU032"], [/2.*camp aissa|camp aissa.*2/i, "ZA104"],
  [/1.*camp aissa|camp aissa.*1/i, "ZA103"], [/oloumi.*bati/i, "ZU004"], [/petit dubai/i, "ZU005"],
  [/plaine niger/i, "ZU007"], [/boulingui/i, "ZU006"], [/martine oulabou/i, "ZU009"],
];

const zoneMetadata = {
  "Zone Urbaine 1": ["ZU1", "Zone Urbaine 1 — Libreville"],
  "Zone Urbaine 2": ["ZU2", "Zone Urbaine 2 — Libreville"],
  "Zone Urbaine 3": ["ZU3", "Zone Urbaine 3 — Libreville"],
  "Zone Urbaine 4": ["ZU4", "Zone Urbaine 4 — Libreville"],
  "Zone Urbaine 5": ["ZU5", "Zone Urbaine 5 — Libreville"],
  "Zone Aéroportuaire 1": ["ZA1", "Zone Aéroportuaire 1 — Voie principale aéroportuaire de Libreville"],
  "Zone Aéroportuaire 2": ["ZA2", "Zone Aéroportuaire 2 — Voie principale aéroportuaire de Libreville"],
  "Zone Aéroportuaire 3": ["ZA3", "Zone Aéroportuaire 3 — Voie de contournement Libreville–Alibandeng–Okala"],
};

function cleanText(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[ÂÃ€]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function canonicalReference(label) {
  if (/contournement/i.test(label)) return "ZA321";
  const normalized = cleanText(label);
  return canonicalImages.find(([pattern]) => pattern.test(normalized))?.[1] ?? null;
}

function formatDetails(type) {
  if (cleanText(type).includes("4x3")) return { format: "Panneau 4 × 3 m", dimensions: "12 m²", historicalPrice: 380000 };
  if (cleanText(type).includes("3 13") || cleanText(type).includes("2 3")) return { format: "Panneau 3,13 × 2,30 m", dimensions: "7,20 m²", historicalPrice: 300000 };
  return { format: type || "Panneau d'affichage", dimensions: null, historicalPrice: null };
}

function statusForFaces(faces) {
  const available = faces.filter((face) => cleanText(face.statut) === "libre").length;
  if (!faces.length || available === faces.length) return "AVAILABLE";
  return available === 0 ? "UNAVAILABLE" : "OPTIONED";
}

function descriptionFor(panel, faces) {
  const count = panel.nombre_faces;
  const directions = faces.map((face) => face.direction).filter(Boolean);
  const directionSummary = directions.length ? ` Sens de circulation : ${directions.join(" ; ")}.` : "";
  return `${panel.emplacement}, ${panel.subzone_name}, Libreville. Support ${count === 1 ? "simple face" : `double face (${count} faces)`}.${directionSummary}`;
}

async function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const environment = await readFile(path.join(projectRoot, ".env.local"), "utf8");
  return environment.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim();
}

async function loadLegacyData() {
  const { stdout } = await executeFile(phpBinary, ["-r", sourceStatement], { windowsHide: true, maxBuffer: 4 * 1024 * 1024 });
  return JSON.parse(stdout);
}

async function availableMedia(url) {
  try { await access(path.join(projectRoot, "public", url)); return true; } catch { return false; }
}

async function main() {
  const apply = process.argv.includes("--apply");
  const [databaseUrl, legacy, report] = await Promise.all([loadDatabaseUrl(), loadLegacyData(), readFile(reportPath, "utf8").then(JSON.parse)]);
  if (!databaseUrl) throw new Error("DATABASE_URL est requis.");

  const facesByReference = new Map();
  for (const face of legacy.faces) facesByReference.set(face.reference, [...(facesByReference.get(face.reference) ?? []), face]);
  const evidenceByReference = new Map();
  for (const panel of report.panels) {
    const reference = canonicalReference(panel.label);
    if (!reference) continue;
    const evidence = { ...panel, mediaUrl: `/media/panels-2026/${panel.coverImage}` };
    evidenceByReference.set(reference, [...(evidenceByReference.get(reference) ?? []), evidence]);
  }

  const summary = {
    historicalPanels: legacy.panels.length,
    historicalFaces: legacy.faces.length,
    panelsWithPhotoEvidence: evidenceByReference.size,
    photoFoldersUnmatched: report.panels.filter((panel) => !canonicalReference(panel.label)).map((panel) => panel.label),
    panelsWithoutPreciseMapPoint: [...evidenceByReference.values()].filter((items) => !items.some((item) => item.point)).length,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (!apply) return;

  const database = new Pool({ connectionString: databaseUrl });
  try {
    await database.query(`
      ALTER TABLE supports ADD COLUMN IF NOT EXISTS source_label TEXT;
      ALTER TABLE supports ADD COLUMN IF NOT EXISTS location_precision SMALLINT NOT NULL DEFAULT 0;
      ALTER TABLE supports ADD COLUMN IF NOT EXISTS location_note TEXT;
      ALTER TABLE supports ADD COLUMN IF NOT EXISTS data_confidence SMALLINT NOT NULL DEFAULT 0;
      ALTER TABLE supports ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;
      CREATE TABLE IF NOT EXISTS support_faces (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), support_id UUID NOT NULL REFERENCES supports(id) ON DELETE CASCADE,
        code VARCHAR(80) NOT NULL UNIQUE, orientation VARCHAR(12) NOT NULL, direction TEXT,
        status support_status NOT NULL DEFAULT 'AVAILABLE', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (support_id, orientation)
      );
      CREATE TABLE IF NOT EXISTS pricing_tiers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), code VARCHAR(40) NOT NULL UNIQUE, label VARCHAR(120) NOT NULL,
        minimum_faces SMALLINT NOT NULL, maximum_faces SMALLINT, price_per_face_ht INTEGER NOT NULL,
        price_per_face_ttc INTEGER NOT NULL, currency CHAR(3) NOT NULL DEFAULT 'XAF', includes_printing BOOLEAN NOT NULL DEFAULT TRUE,
        effective_from DATE, source_note TEXT NOT NULL, is_published BOOLEAN NOT NULL DEFAULT TRUE
      );
    `);
    await database.query("UPDATE supports SET is_published = FALSE WHERE reference LIKE 'PUB-2026-%'");

    for (const [index, [subzone, [code, name]]] of Object.entries(zoneMetadata).entries()) {
      await database.query(`INSERT INTO zones (code, name, city, description, display_order, is_published)
        VALUES ($1, $2, 'Libreville', $3, $4, TRUE)
        ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, display_order = EXCLUDED.display_order, is_published = TRUE, updated_at = NOW()`,
      [code, name, subzone, index + 1]);
    }

    for (const panel of legacy.panels) {
      const metadata = zoneMetadata[panel.subzone_name];
      if (!metadata) throw new Error(`Sous-zone historique non reconnue : ${panel.subzone_name}`);
      const [zoneCode] = metadata;
      const faces = facesByReference.get(panel.reference) ?? [];
      const evidence = evidenceByReference.get(panel.reference) ?? [];
      const locatedEvidence = evidence.find((item) => item.point);
      const details = formatDetails(panel.type);
      const published = Boolean(locatedEvidence);
      const support = await database.query(`
        INSERT INTO supports (reference, name, slug, zone_id, address, latitude, longitude, support_type, dimensions, status,
          indicative_price, description, is_published, source_label, location_precision, location_note, data_confidence, is_verified)
        VALUES ($1, $2, $3, (SELECT id FROM zones WHERE code = $4), $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 2, FALSE)
        ON CONFLICT (reference) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, zone_id = EXCLUDED.zone_id,
          address = EXCLUDED.address, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, support_type = EXCLUDED.support_type,
          dimensions = EXCLUDED.dimensions, status = EXCLUDED.status, indicative_price = EXCLUDED.indicative_price,
          description = EXCLUDED.description, is_published = EXCLUDED.is_published, source_label = EXCLUDED.source_label,
          location_precision = EXCLUDED.location_precision, location_note = EXCLUDED.location_note, data_confidence = EXCLUDED.data_confidence,
          is_verified = EXCLUDED.is_verified, updated_at = NOW() RETURNING id`,
        [panel.reference, panel.emplacement, panel.reference.toLowerCase(), zoneCode, panel.emplacement,
          locatedEvidence?.point?.latitude ?? 0, locatedEvidence?.point?.longitude ?? 0, details.format, details.dimensions,
          statusForFaces(faces), details.historicalPrice, descriptionFor(panel, faces), published,
          `Base historique Publicom + photos panneaux 2026`, locatedEvidence ? 2 : 0,
          locatedEvidence ? "Repère géocodé à confirmer sur site." : "Position exacte à confirmer avant publication."]);
      const supportId = support.rows[0].id;
      await database.query("DELETE FROM support_faces WHERE support_id = $1", [supportId]);
      for (const [index, face] of faces.entries()) {
        await database.query(`INSERT INTO support_faces (support_id, code, orientation, direction, status)
          VALUES ($1, $2, $3, $4, $5)`, [supportId, face.code || `${panel.reference}-${index + 1}`, face.orientation || String(index + 1), face.direction || null, statusForFaces([face])]);
      }
      await database.query("DELETE FROM support_media WHERE support_id = $1", [supportId]);
      const importedMedia = new Set();
      let mediaOrder = 0;
      for (const item of evidence) {
        if (!await availableMedia(item.mediaUrl)) continue;
        const fingerprint = createHash("sha1").update(await readFile(path.join(projectRoot, "public", item.mediaUrl))).digest("hex");
        if (importedMedia.has(fingerprint) || mediaOrder === 4) continue;
        importedMedia.add(fingerprint);
        mediaOrder += 1;
        await database.query(`INSERT INTO support_media (support_id, url, alt_text, display_order, is_cover)
          VALUES ($1, $2, $3, $4, $5)`, [supportId, item.mediaUrl, `Panneau Publicom ${panel.reference} — ${panel.emplacement}`, mediaOrder, mediaOrder === 1]);
      }
    }

    const tiers = [
      ["DISPLAY-1", "1 face", 1, 1, 380000, 452000], ["DISPLAY-2-4", "2 à 4 faces", 2, 4, 350000, 416500],
      ["DISPLAY-5-9", "5 à 9 faces", 5, 9, 320000, 380800], ["DISPLAY-10-PLUS", "10 faces et plus", 10, null, 290000, 345100],
    ];
    for (const tier of tiers) await database.query(`INSERT INTO pricing_tiers (code, label, minimum_faces, maximum_faces, price_per_face_ht, price_per_face_ttc, effective_from, source_note)
      VALUES ($1, $2, $3, $4, $5, $6, '2027-01-01', 'Grille tarifaire fournie par Publicom — impression incluse.')
      ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, minimum_faces = EXCLUDED.minimum_faces, maximum_faces = EXCLUDED.maximum_faces,
      price_per_face_ht = EXCLUDED.price_per_face_ht, price_per_face_ttc = EXCLUDED.price_per_face_ttc, effective_from = EXCLUDED.effective_from,
      source_note = EXCLUDED.source_note, is_published = TRUE`, tier);
  } finally { await database.end(); }
  console.log("Référentiel Publicom synchronisé.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
