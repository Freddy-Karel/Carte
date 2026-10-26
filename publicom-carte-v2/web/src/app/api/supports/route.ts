import { NextResponse } from "next/server";
import { database } from "@/lib/database";

type SupportRow = {
  reference: string;
  slug: string;
  name: string;
  zone: string;
  district: string;
  format: string;
  dimensions: string | null;
  status: "AVAILABLE" | "OPTIONED" | "UNAVAILABLE";
  description: string | null;
  location_note: string | null;
  location_precision: number;
  image: string | null;
  latitude: number;
  longitude: number;
  face_count: number;
  directions: string[];
};

const statusLabels = { AVAILABLE: "Disponible", OPTIONED: "Optionné", UNAVAILABLE: "Indisponible" } as const;

export async function GET() {
  const result = await database.query<SupportRow>(`
    SELECT s.reference, s.slug, s.name, z.code AS zone, z.name AS district, s.support_type AS format,
      s.dimensions, s.status, s.description, s.location_note, s.location_precision, s.latitude, s.longitude,
      cover.url AS image, COUNT(face.id)::int AS face_count,
      COALESCE(array_agg(face.direction ORDER BY face.orientation) FILTER (WHERE face.direction IS NOT NULL), '{}') AS directions
    FROM supports s
    INNER JOIN zones z ON z.id = s.zone_id
    LEFT JOIN support_faces face ON face.support_id = s.id
    LEFT JOIN LATERAL (
      SELECT url FROM support_media WHERE support_id = s.id ORDER BY is_cover DESC, display_order ASC LIMIT 1
    ) AS cover ON TRUE
    WHERE s.is_published = TRUE AND z.is_published = TRUE
    GROUP BY s.id, z.code, z.name, z.display_order, cover.url
    ORDER BY z.display_order, s.reference
  `);
  const pricing = await database.query<{ price: number }>(`
    SELECT MIN(price_per_face_ht)::int AS price FROM pricing_tiers WHERE is_published = TRUE
  `);
  const minimumPrice = pricing.rows[0]?.price ?? null;

  return NextResponse.json(result.rows.map((support, index) => ({
    id: support.reference,
    slug: support.slug,
    name: support.name,
    zone: support.zone,
    district: support.district,
    format: support.format,
    dimensions: support.dimensions ?? "À préciser",
    status: statusLabels[support.status],
    price: minimumPrice ? `À partir de ${new Intl.NumberFormat("fr-FR").format(minimumPrice)} FCFA HT / face` : "Tarif sur devis",
    pricingNote: "Tarif dégressif selon le nombre de faces — impression incluse.",
    faceCount: support.face_count,
    directions: support.directions,
    locationNote: support.location_note,
    description: support.description ?? "Informations à venir.",
    image: support.image ?? undefined,
    coordinates: [support.latitude, support.longitude] as [number, number],
    accent: ["coral", "gold", "blue"][index % 3],
  })));
}
