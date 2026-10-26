"use client";

import { Map as MapLibreMap, NavigationControl, setWorkerUrl, type GeoJSONSource, type StyleSpecification } from "maplibre-gl";
import { useEffect, useRef } from "react";

type MapSupport = {
  id: string;
  name: string;
  status: "Disponible" | "Optionné" | "Indisponible";
  coordinates: [number, number];
};

type NetworkMapProps = {
  supports: MapSupport[];
  selectedId: string;
  satellite: boolean;
  onSelect: (id: string) => void;
};

const sourceId = "publicom-supports";
const clusterLayerId = "publicom-clusters";
const clusterCountLayerId = "publicom-cluster-count";
const supportLayerId = "publicom-support-points";
const librevilleBounds: [[number, number], [number, number]] = [[9.24, 0.21], [9.68, 0.66]];

setWorkerUrl("https://unpkg.com/maplibre-gl@6.15.0/dist/maplibre-gl-worker.mjs");

function createStyle(satellite: boolean): StyleSpecification {
  return {
    version: 8,
    sources: { base: { type: "raster", tiles: [satellite ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" : "https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: satellite ? "Tiles © Esri" : "© OpenStreetMap contributors" } },
    layers: [{ id: "base", type: "raster", source: "base", paint: satellite ? { "raster-saturation": -0.35, "raster-contrast": 0.12, "raster-brightness-max": 0.82 } : { "raster-saturation": -0.75, "raster-contrast": 0.1, "raster-brightness-min": 0.32, "raster-brightness-max": 0.94 } }],
  };
}

function toFeatureCollection(supports: MapSupport[], selectedId: string) {
  return {
    type: "FeatureCollection" as const,
    features: supports.map((support) => ({ type: "Feature" as const, properties: { id: support.id, status: support.status, name: support.name, selected: support.id === selectedId }, geometry: { type: "Point" as const, coordinates: [support.coordinates[1], support.coordinates[0]] } })),
  };
}

function billboardIcon(color: string) {
  const size = 72;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas indisponible pour le pictogramme de panneau.");
  context.clearRect(0, 0, size, size);
  context.fillStyle = "rgba(0, 0, 0, 0.16)";
  context.beginPath(); context.ellipse(36, 64, 19, 4, 0, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#171717";
  context.fillRect(33, 42, 6, 19); context.fillRect(26, 60, 20, 4);
  context.fillStyle = "#ffffff";
  context.strokeStyle = "#171717";
  context.lineWidth = 3;
  context.beginPath(); context.roundRect(10, 9, 52, 35, 5); context.fill(); context.stroke();
  context.fillStyle = color;
  context.beginPath(); context.roundRect(14, 13, 44, 27, 3); context.fill();
  context.fillStyle = "rgba(255,255,255,0.76)";
  context.fillRect(18, 17, 15, 3); context.fillRect(18, 24, 26, 3);
  return { width: size, height: size, data: new Uint8Array(context.getImageData(0, 0, size, size).data.buffer) };
}

function ensureBillboardIcons(map: MapLibreMap) {
  const icons = { "publicom-billboard-available": "#e30613", "publicom-billboard-optioned": "#c59b25", "publicom-billboard-unavailable": "#757575" };
  Object.entries(icons).forEach(([name, color]) => { if (!map.hasImage(name)) map.addImage(name, billboardIcon(color)); });
}

function addSupportLayers(map: MapLibreMap, supports: MapSupport[], selectedId: string) {
  const data = toFeatureCollection(supports, selectedId);
  const existing = map.getSource(sourceId) as GeoJSONSource | undefined;
  if (existing) { existing.setData(data); return; }

  ensureBillboardIcons(map);
  map.addSource(sourceId, { type: "geojson", data, cluster: true, clusterRadius: 54, clusterMaxZoom: 14 });
  map.addLayer({ id: clusterLayerId, type: "circle", source: sourceId, filter: ["has", "point_count"], paint: { "circle-color": "#161616", "circle-radius": ["step", ["get", "point_count"], 17, 10, 21, 25, 25], "circle-stroke-width": 3, "circle-stroke-color": "#ffffff", "circle-opacity": 0.94 } });
  map.addLayer({ id: clusterCountLayerId, type: "symbol", source: sourceId, filter: ["has", "point_count"], layout: { "text-field": ["get", "point_count_abbreviated"], "text-font": ["Open Sans Bold"], "text-size": 11 }, paint: { "text-color": "#ffffff" } });
  map.addLayer({ id: "publicom-selected-halo", type: "circle", source: sourceId, filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "selected"], true]], paint: { "circle-radius": 30, "circle-color": "#e30613", "circle-opacity": 0.18 } });
  map.addLayer({ id: supportLayerId, type: "symbol", source: sourceId, filter: ["!", ["has", "point_count"]], layout: { "icon-image": ["match", ["get", "status"], "Optionné", "publicom-billboard-optioned", "Indisponible", "publicom-billboard-unavailable", "publicom-billboard-available"], "icon-size": ["interpolate", ["linear"], ["zoom"], 11, 0.62, 15, 0.8], "icon-allow-overlap": true, "icon-anchor": "bottom" } });
}

export default function NetworkMap({ supports, selectedId, satellite, onSelect }: NetworkMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const onSelectRef = useRef(onSelect);
  const supportsRef = useRef(supports);
  const selectedIdRef = useRef(selectedId);
  const satelliteRef = useRef(false);

  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);
  useEffect(() => { supportsRef.current = supports; const map = mapRef.current; if (map?.isStyleLoaded()) addSupportLayers(map, supports, selectedId); }, [supports, selectedId]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new MapLibreMap({ container: containerRef.current, style: createStyle(false), center: [9.46, 0.42], zoom: 12.7, minZoom: 11.2, maxZoom: 17.5, maxBounds: librevilleBounds, attributionControl: false });
    map.addControl(new NavigationControl({ showCompass: false }), "bottom-right");
    map.on("load", () => addSupportLayers(map, supportsRef.current, selectedIdRef.current));
    map.on("click", clusterLayerId, (event) => {
      const feature = map.queryRenderedFeatures(event.point, { layers: [clusterLayerId] })[0];
      const clusterId = feature?.properties?.cluster_id;
      const source = map.getSource(sourceId) as GeoJSONSource | undefined;
      if (clusterId === undefined || !source) return;
      source.getClusterExpansionZoom(clusterId).then((zoom) => map.easeTo({ center: (feature.geometry as GeoJSON.Point).coordinates as [number, number], zoom, duration: 650 }));
    });
    map.on("click", supportLayerId, (event) => { const feature = event.features?.[0]; const id = feature?.properties?.id; if (id) onSelectRef.current(id); });
    for (const layer of [clusterLayerId, supportLayerId]) { map.on("mouseenter", layer, () => { map.getCanvas().style.cursor = "pointer"; }); map.on("mouseleave", layer, () => { map.getCanvas().style.cursor = ""; }); }
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || satellite === satelliteRef.current) return;
    satelliteRef.current = satellite;
    map.once("style.load", () => {
      ensureBillboardIcons(map);
      addSupportLayers(map, supportsRef.current, selectedIdRef.current);
    });
    map.setStyle(createStyle(satellite));
  }, [satellite]);

  return <div className="network-map-canvas" ref={containerRef} aria-label="Carte interactive détaillée de Libreville" />;
}
