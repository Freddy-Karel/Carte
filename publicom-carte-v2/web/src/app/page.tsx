"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const NetworkMap = dynamic(() => import("./components/NetworkMap"), { ssr: false, loading: () => <div className="network-map-loading">Chargement de la carte de Libreville…</div> });

type Status = "Disponible" | "Optionné" | "Indisponible";
type Support = {
  id: string; slug?: string; name: string; zone: string; district: string; format: string; dimensions: string;
  status: Status; price: string; pricingNote?: string; faceCount?: number; directions?: string[]; locationNote?: string;
  description: string; image?: string; coordinates: [number, number]; accent: string;
};

const initialSupports: Support[] = [{
  id: "PU-001", name: "Ancienne Sobraga", zone: "ZU2", district: "Zone Urbaine 2 — Libreville", format: "Panneau 4 × 3 m", dimensions: "12 m²",
  status: "Disponible", price: "Tarif à confirmer", faceCount: 2, description: "Chargement du réseau Publicom.", coordinates: [0.4096, 9.4518], accent: "coral", image: "/media/ancienne-sobraga.jpg",
}];

export default function Home() {
  const [supports, setSupports] = useState(initialSupports);
  const [selected, setSelected] = useState(initialSupports[0]);
  const [zone, setZone] = useState("Toutes les zones");
  const [format, setFormat] = useState("Tous les formats");
  const [faces, setFaces] = useState("Toutes les faces");
  const [satellite, setSatellite] = useState(false);
  const [selection, setSelection] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(window.sessionStorage.getItem("publicom-selection") ?? "[]") as string[]; } catch { return []; }
  });

  useEffect(() => {
    fetch("/api/supports").then((response) => response.ok ? response.json() : null).then((data: Support[] | null) => {
      if (!data?.length) return;
      setSupports(data); setSelected(data[0]);
    }).catch(() => undefined);
  }, []);
  useEffect(() => { window.sessionStorage.setItem("publicom-selection", JSON.stringify(selection)); }, [selection]);

  const availableZones = useMemo(() => [...new Map(supports.map((support) => [support.zone, support.district])).entries()], [supports]);
  const availableFormats = useMemo(() => [...new Set(supports.map((support) => support.format))], [supports]);
  const faceOptions = useMemo(() => [...new Set(supports.map((support) => support.faceCount).filter((count): count is number => Boolean(count)))].sort((left, right) => left - right), [supports]);
  const filteredSupports = useMemo(() => supports.filter((support) =>
    (zone === "Toutes les zones" || support.zone === zone)
    && (format === "Tous les formats" || support.format === format)
    && (faces === "Toutes les faces" || String(support.faceCount ?? 0) === faces),
  ), [supports, zone, format, faces]);

  const activeSelected = filteredSupports.find((support) => support.id === selected.id) ?? filteredSupports[0] ?? selected;

  function chooseSupport(support: Support) { setSelected(support); }
  function toggleSelection(id: string) { setSelection((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]); }

  return <main className="publicom-experience">
    <header className="site-navbar">
      <Link href="#top" className="site-brand" aria-label="Publicom, accueil"><Image src="/logo-publicom.png" alt="Publicom" width={480} height={115} priority style={{ width: "142px", height: "auto" }} /></Link>
      <nav aria-label="Navigation principale"><a href="#explorer">Le réseau</a><a href="#supports">Les supports</a><a href="#about">Publicom</a></nav>
      <button className="selection-trigger" onClick={() => document.getElementById("supports")?.scrollIntoView({ behavior: "smooth" })}><span>Ma sélection</span><b>{selection.length.toString().padStart(2, "0")}</b></button>
    </header>

    <section className="showcase-hero" id="top">
      <div className="hero-aura hero-aura--one" /><div className="hero-aura hero-aura--two" />
      <div className="hero-copy-wrap"><p className="showcase-eyebrow">Régie publicitaire · Gabon</p><h1>Placez votre marque <em>au bon endroit.</em></h1><p>Un réseau d’affichage premium, pensé pour créer des rencontres fortes entre vos campagnes et les publics de Libreville.</p><a className="hero-action" href="#explorer">Explorer le réseau <span>↓</span></a></div>
      <div className="hero-media"><Image src="/media/panels-2026/panel-2026-009.jpg" alt="Panneau Publicom sur un axe urbain de Libreville" fill priority sizes="(max-width: 800px) 100vw, 48vw" /><div className="hero-media-shade" /><div className="hero-media-caption"><span>PUBLICOM / 01</span><strong>La visibilité en mouvement</strong></div></div>
      <div className="hero-metrics"><div><b>{supports.length.toString().padStart(2, "0")}</b><span>supports référencés</span></div><div><b>{supports.filter((support) => support.status === "Disponible").length.toString().padStart(2, "0")}</b><span>opportunités actives</span></div></div>
    </section>

    <section className="network-section" id="explorer">
      <div className="section-intro"><p className="showcase-eyebrow">01 / Explorer</p><h2>Le réseau, <em>en un regard.</em></h2><p>Filtrez les emplacements puis interagissez directement avec la carte pour comparer les opportunités.</p></div>
      <div className="network-shell">
        <NetworkMap supports={filteredSupports} selectedId={activeSelected.id} satellite={satellite} onSelect={(id) => { const support = supports.find((item) => item.id === id); if (support) chooseSupport(support); }} />
        <div className="map-gradient" />
        <aside className="map-filter glass-surface"><span className="glass-label">Filtres réseau</span><label htmlFor="zone">Zone</label><select id="zone" value={zone} onChange={(event) => setZone(event.target.value)}><option>Toutes les zones</option>{availableZones.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select><label htmlFor="format">Format</label><select id="format" value={format} onChange={(event) => setFormat(event.target.value)}><option>Tous les formats</option>{availableFormats.map((item) => <option key={item}>{item}</option>)}</select><label htmlFor="faces">Nombre de faces</label><select id="faces" value={faces} onChange={(event) => setFaces(event.target.value)}><option>Toutes les faces</option>{faceOptions.map((count) => <option key={count} value={count}>{count} face{count > 1 ? "s" : ""}</option>)}</select><div className="filter-result"><b>{filteredSupports.length.toString().padStart(2, "0")}</b><span>supports visibles</span></div><div className="map-legend-new"><span><i /> Disponible</span><span><i /> Optionné</span></div></aside>
        <div className="map-actions"><button onClick={() => setSatellite((value) => !value)}>{satellite ? "Plan" : "Satellite"}</button><span>Libreville / Gabon</span></div>
        <aside className="location-card glass-surface"><div className="location-image"><Image src={activeSelected.image ?? "/media/ancienne-sobraga.jpg"} alt={activeSelected.name} fill sizes="(max-width: 850px) 86vw, 310px" /><span>{activeSelected.district}</span></div><div className="location-content"><div><StatusBadge status={activeSelected.status} /><small>{activeSelected.id}</small></div><h3>{activeSelected.name}</h3><p>{activeSelected.district}</p><dl><div><dt>Format</dt><dd>{activeSelected.format}</dd></div><div><dt>Faces</dt><dd>{activeSelected.faceCount ? `${activeSelected.faceCount} face${activeSelected.faceCount > 1 ? "s" : ""}` : "À confirmer"}</dd></div><div><dt>Dimensions</dt><dd>{activeSelected.dimensions}</dd></div><div><dt>Repérage</dt><dd>{activeSelected.locationNote ? "À confirmer" : "Validé"}</dd></div></dl><p className="location-pricing">{activeSelected.price}</p><div className="location-bottom"><button onClick={() => toggleSelection(activeSelected.id)} className={selection.includes(activeSelected.id) ? "selected-support" : "select-support"}>{selection.includes(activeSelected.id) ? "Ajouté" : "Ajouter"}<span>+</span></button></div></div></aside>
      </div>
    </section>

    <section className="support-showcase" id="supports"><div className="support-showcase-head"><p className="showcase-eyebrow">02 / Collection</p><h2>Des emplacements qui <em>restent en tête.</em></h2><p>Une sélection précise, photographiée pour vous permettre de projeter votre campagne dans la ville.</p></div><div className="support-rail">{filteredSupports.map((support, index) => <article className="premium-support-card" key={support.id}><button className="support-image" onClick={() => chooseSupport(support)} aria-label={`Sélectionner ${support.name}`}><Image src={support.image ?? "/media/ancienne-sobraga.jpg"} alt={`Support ${support.name}`} fill sizes="(max-width: 700px) 88vw, (max-width: 1100px) 45vw, 31vw" /><span className="support-index">{String(index + 1).padStart(2, "0")}</span><span className="image-arrow">↗</span></button><div className="support-card-copy"><div><StatusBadge status={support.status} /><span>{support.district}</span></div><h3>{support.name}</h3><p>{support.format} · {support.faceCount ?? "?"} face{support.faceCount === 1 ? "" : "s"}</p>{support.slug ? <Link href={`/supports/${support.slug}`}>Découvrir l’emplacement <span>→</span></Link> : <button onClick={() => chooseSupport(support)}>Voir sur la carte <span>→</span></button>}</div></article>)}</div></section>
    <section className="brand-statement" id="about"><p className="showcase-eyebrow">Publicom / Depuis Libreville</p><h2>Faire de chaque trajet une <em>occasion de vous voir.</em></h2><p>Publicom met la ville au service de vos marques à travers un réseau d’affichage lisible, ambitieux et connecté aux habitudes de ses publics.</p><a href="#explorer">Découvrir le réseau <span>↗</span></a></section>
    <footer className="site-footer"><Link href="#top"><Image src="/logo-publicom.png" alt="Publicom" width={480} height={115} style={{ width: "126px", height: "auto" }} /></Link><p>Sodipresse · Libreville, Gabon</p><div><a href="#explorer">Le réseau</a><a href="#supports">Les supports</a><span>© Publicom</span></div></footer>
  </main>;
}

function StatusBadge({ status }: { status: Status }) { return <span className={`showcase-status showcase-status--${status.toLowerCase().replace("é", "e")} `}><i />{status}</span>; }
