"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import LibrevilleMap from "./LibrevilleMap";
import styles from "./atlas.module.css";

type Status = "Disponible" | "Optionné";

export type Support = {
  id: string;
  name: string;
  zone: string;
  category: string;
  status: Status;
  image: string;
  coordinates: [number, number];
  description: string;
};

const supports: Support[] = [
  { id: "PU-001", name: "Ancienne Sobraga", zone: "Centre-ville", category: "4x3", status: "Disponible", image: "/media/ancienne-sobraga.jpg", coordinates: [9.457, 0.411], description: "Axe urbain à fort passage, au contact des flux quotidiens." },
  { id: "PU-002", name: "Avenue Jean-Paul II", zone: "Centre-ville", category: "4x3", status: "Optionné", image: "/media/ancienne-sobraga.jpg", coordinates: [9.443, 0.42], description: "Point de visibilité premium sur un parcours structurant." },
  { id: "PU-003", name: "Bas de Gué-Gué", zone: "Gros-Bouquet", category: "LED", status: "Disponible", image: "/media/bas-gue-gue.jpg", coordinates: [9.472, 0.404], description: "Support digital au cœur des mobilités urbaines." },
  { id: "PU-004", name: "Petit Paris", zone: "Owendo", category: "8x3", status: "Disponible", image: "/media/petit-paris.jpg", coordinates: [9.49, 0.347], description: "Grand format à l’approche des principaux axes d’Owendo." },
  { id: "PU-005", name: "Aéroport — arrivée", zone: "Aéroport", category: "4x3", status: "Disponible", image: "/media/aeroport-arrivee.jpg", coordinates: [9.422, 0.462], description: "Prise de parole stratégique auprès des voyageurs et accompagnants." },
];

const filters = ["Tous", "Disponible", "4x3", "LED", "Aéroport"];

export default function AtlasPrototype() {
  const [selected, setSelected] = useState<Support>(supports[0]);
  const [filter, setFilter] = useState("Tous");
  const [satellite, setSatellite] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const visibleSupports = useMemo(
    () => supports.filter((support) => filter === "Tous" || support.status === filter || support.category === filter || support.zone === filter),
    [filter],
  );

  function selectSupport(support: Support) {
    setSelected(support);
    setExpanded(true);
  }

  return <main className={styles.page}>
    <header className={styles.header}>
      <Link href="/" className={styles.brand}><Image src="/logo-publicom.png" alt="Publicom" width={480} height={115} priority style={{ width: "142px", height: "auto" }} /></Link>
      <div className={styles.headerCenter}><span>ATLAS</span><i /> <strong>LIBREVILLE</strong></div>
      <div className={styles.headerActions}><button onClick={() => setSatellite((value) => !value)}>{satellite ? "Plan" : "Satellite"}</button><button className={styles.selection}>Sélection <b>02</b></button></div>
    </header>

    <section className={styles.atlas}>
      <aside className={styles.explorer}>
        <p className={styles.kicker}>Réseau d’affichage</p><h1>Choisir le <em>bon impact.</em></h1>
        <p className={styles.intro}>Une lecture claire du réseau Publicom, centrée sur les mouvements réels de Libreville.</p>
        <div className={styles.filterLabel}>Explorer par</div>
        <div className={styles.filters}>{filters.map((item) => <button key={item} className={filter === item ? styles.selectedFilter : ""} onClick={() => setFilter(item)}>{item}</button>)}</div>
        <div className={styles.resultCount}><strong>{visibleSupports.length.toString().padStart(2, "0")}</strong><span>supports visibles</span></div>
        <div className={styles.legend}><span><i className={styles.available} />Disponible</span><span><i className={styles.optioned} />Optionné</span></div>
      </aside>

      <div className={styles.mapViewport}>
        <LibrevilleMap supports={visibleSupports} selectedId={selected.id} satellite={satellite} onSelect={selectSupport} />
        <div className={styles.mapCaption}><i /> RÉSEAU PUBLICOM · LIBREVILLE</div>
        <div className={styles.mapAttribution}>© OpenStreetMap · Données cartographiques détaillées</div>
      </div>

      <aside className={`${styles.detail} ${expanded ? styles.detailOpen : ""}`}>
        <button className={styles.close} onClick={() => setExpanded(false)} aria-label="Fermer la fiche">×</button>
        <div className={styles.photo}><Image src={selected.image} alt={`Emplacement ${selected.name}`} fill sizes="(max-width: 950px) 92vw, 330px" priority /><span>{selected.zone}</span></div>
        <div className={styles.detailContent}><div className={styles.statusLine}><small>{selected.id}</small><Status status={selected.status} /></div><h2>{selected.name}</h2><p>{selected.description}</p><div className={styles.detailMeta}><div><span>Format</span><strong>{selected.category}</strong></div><div><span>Zone</span><strong>{selected.zone}</strong></div></div><button className={styles.cta}>Ajouter à ma sélection <span>+</span></button><Link href="/supports/ancienne-sobraga">Voir la fiche complète <span>↗</span></Link></div>
      </aside>
    </section>
    <footer className={styles.footer}><span>PROTOTYPE DE DIRECTION ARTISTIQUE · ATLAS LIBREVILLE</span><span>Carte détaillée · données des emplacements à consolider</span></footer>
  </main>;
}

function Status({ status }: { status: Status }) { return <span className={status === "Disponible" ? styles.statusAvailable : styles.statusOptioned}><i />{status}</span>; }
