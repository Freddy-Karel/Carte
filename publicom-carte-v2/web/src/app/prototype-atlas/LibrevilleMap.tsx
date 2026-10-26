"use client";

import { Map as MapLibreMap, Marker, NavigationControl, setWorkerUrl, type StyleSpecification } from "maplibre-gl";
import { useEffect, useRef } from "react";
import type { Support } from "./page";
import styles from "./atlas.module.css";

type LibrevilleMapProps = {
  supports: Support[];
  selectedId: string;
  satellite: boolean;
  onSelect: (support: Support) => void;
};

const librevilleBounds: [[number, number], [number, number]] = [
  [9.24, 0.21],
  [9.68, 0.66],
];

setWorkerUrl("https://unpkg.com/maplibre-gl@6.15.0/dist/maplibre-gl-worker.mjs");

function mapStyle(satellite: boolean): StyleSpecification {
  return {
    version: 8,
    sources: {
      base: {
        type: "raster",
        tiles: [
          satellite
            ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            : "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        attribution: satellite
          ? "Tiles © Esri"
          : "© OpenStreetMap contributors",
      },
    },
    layers: [
      {
        id: "base",
        type: "raster",
        source: "base",
        paint: satellite
          ? { "raster-saturation": -0.15, "raster-contrast": 0.08 }
          : { "raster-saturation": -0.58, "raster-contrast": 0.05, "raster-brightness-min": 0.38 },
      },
    ],
  };
}

export default function LibrevilleMap({ supports, selectedId, satellite, onSelect }: LibrevilleMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const onSelectRef = useRef(onSelect);
  const satelliteRef = useRef(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: mapStyle(false),
      center: [9.46, 0.42],
      zoom: 12.8,
      minZoom: 11.2,
      maxZoom: 17.5,
      maxBounds: librevilleBounds,
      attributionControl: false,
    });

    map.addControl(new NavigationControl({ showCompass: false }), "top-left");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (satellite === satelliteRef.current) return;

    const updateStyle = () => map.setStyle(mapStyle(satellite));
    satelliteRef.current = satellite;
    if (map.isStyleLoaded()) updateStyle();
    else map.once("load", updateStyle);
  }, [satellite]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const markers = supports.map((support) => {
      const element = document.createElement("button");
      element.type = "button";
      element.className = `${styles.mapMarker} ${support.id === selectedId ? styles.activeMapMarker : ""}`;
      element.setAttribute("aria-label", `Voir ${support.name}`);
      element.innerHTML = "<span></span>";
      element.addEventListener("click", () => {
        map.flyTo({ center: support.coordinates, zoom: Math.max(map.getZoom(), 14), duration: 850, essential: true });
        onSelectRef.current(support);
      });

      return new Marker({ element, anchor: "bottom" }).setLngLat(support.coordinates).addTo(map);
    });

    return () => markers.forEach((marker) => marker.remove());
  }, [selectedId, supports]);

  return <div className={styles.realMap} ref={containerRef} aria-label="Carte interactive du réseau Publicom à Libreville" />;
}
