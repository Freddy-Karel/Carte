import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { database } from "@/lib/database";
import SupportGallery from "./SupportGallery";

export const instant = false;

type SupportDetail = {
  id: string; reference: string; name: string; zone: string; district: string; address: string | null; format: string;
  dimensions: string | null; status: "AVAILABLE" | "OPTIONED" | "UNAVAILABLE"; description: string | null;
  location_note: string | null;
};
type Face = { code: string; orientation: string; direction: string | null; status: "AVAILABLE" | "OPTIONED" | "UNAVAILABLE" };
type PricingTier = { code: string; label: string; price_per_face_ht: number; price_per_face_ttc: number };
type SupportMedia = { url: string };

const labels = { AVAILABLE: "Disponible", OPTIONED: "Optionné", UNAVAILABLE: "Indisponible" } as const;
const money = new Intl.NumberFormat("fr-FR");

export default async function SupportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await database.query<SupportDetail>(`
    SELECT s.id, s.reference, s.name, z.code AS zone, z.name AS district, s.address, s.support_type AS format,
      s.dimensions, s.status, s.description, s.location_note
    FROM supports s INNER JOIN zones z ON z.id = s.zone_id
    WHERE s.slug = $1 AND s.is_published = TRUE
  `, [slug]);
  const support = result.rows[0];
  if (!support) notFound();

  const [faces, pricing, media] = await Promise.all([
    database.query<Face>("SELECT code, orientation, direction, status FROM support_faces WHERE support_id = $1 ORDER BY orientation", [support.id]),
    database.query<PricingTier>("SELECT code, label, price_per_face_ht, price_per_face_ttc FROM pricing_tiers WHERE is_published = TRUE ORDER BY minimum_faces"),
    database.query<SupportMedia>("SELECT url FROM support_media WHERE support_id = $1 ORDER BY is_cover DESC, display_order ASC LIMIT 4", [support.id]),
  ]);
  const statusClass = support.status.toLowerCase();

  return <main className="support-detail-page">
    <header className="site-navbar site-navbar--detail">
      <Link href="/" className="site-brand" aria-label="Publicom, accueil"><Image src="/logo-publicom.png" alt="Publicom" width={480} height={115} priority style={{ width: "142px", height: "auto" }} /></Link>
      <nav aria-label="Navigation principale"><Link href="/#explorer">Le réseau</Link><Link href="/#supports">Les supports</Link><Link href="/#about">Publicom</Link></nav>
      <Link className="detail-back" href="/#supports">← Retour aux supports</Link>
    </header>
    <section className="support-spotlight">
      <SupportGallery images={media.rows.map((item) => item.url)} name={support.name} reference={support.reference} />
      <article className="support-information"><div className="support-information-inner"><div className="detail-kicker"><span className={`showcase-status showcase-status--${statusClass}`}><i />{labels[support.status]}</span><span>{support.district}</span></div><h1>{support.name}</h1><p className="detail-district">{support.format} · {faces.rows.length} face{faces.rows.length > 1 ? "s" : ""}</p><p className="detail-description">{support.description ?? "Les informations détaillées de ce support seront bientôt disponibles."}</p><dl><div><dt>Format</dt><dd>{support.format}</dd></div><div><dt>Dimensions</dt><dd>{support.dimensions ?? "À préciser"}</dd></div><div><dt>Zone</dt><dd>{support.district}</dd></div><div><dt>Repérage</dt><dd>{support.location_note ? "À confirmer sur site" : "Validé"}</dd></div></dl><section className="support-faces"><h2>Faces et sens</h2>{faces.rows.map((face) => <div key={face.code}><b>Face {face.orientation}</b><span>{face.direction ?? "Direction à confirmer"}</span></div>)}</section><section className="support-pricing"><h2>Tarif affichage</h2><p>Prix par face, impression incluse.</p><div>{pricing.rows.map((tier) => <span key={tier.code}><b>{tier.label}</b>{money.format(tier.price_per_face_ht)} FCFA HT</span>)}</div></section><div className="detail-actions"><button>Ajouter à ma sélection <span>+</span></button><Link href="/#explorer">Voir sur la carte <span>↗</span></Link></div></div></article>
    </section>
  </main>;
}
