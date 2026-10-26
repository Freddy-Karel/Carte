"use client";

import Image from "next/image";
import { useState } from "react";

type SupportGalleryProps = { images: string[]; name: string; reference: string };

export default function SupportGallery({ images, name, reference }: SupportGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const gallery = images.slice(0, 4);
  const activeImage = gallery[activeIndex] ?? null;

  return <div className="support-photo-stage support-gallery">
    {activeImage ? <Image key={activeImage} src={activeImage} alt={`Panneau ${name} — vue ${activeIndex + 1}`} fill priority sizes="(max-width: 900px) 100vw, 56vw" /> : <div className="support-photo-fallback" />}
    <div className="support-photo-overlay" />
    <div className="support-photo-reference">PUBLICOM / {reference}</div>
    {gallery.length > 1 && <div className="gallery-thumbnails" aria-label="Autres vues du panneau">{gallery.map((image, index) => <button key={image} type="button" onClick={() => setActiveIndex(index)} aria-label={`Afficher la vue ${index + 1}`} aria-pressed={index === activeIndex} className={index === activeIndex ? "is-active" : ""}><Image src={image} alt="" fill sizes="64px" /></button>)}</div>}
  </div>;
}
