"use client";

import { divIcon } from "leaflet";
import { useState } from "react";
import { CircleMarker, MapContainer, Marker, TileLayer, Tooltip } from "react-leaflet";

type MapSupport = {
  id: string;
  name: string;
  zone: string;
  status: "Disponible" | "Optionné" | "Indisponible";
  coordinates: [number, number];
};

type PublicomMapProps = { supports: MapSupport[]; selectedId: string; onSelect: (id: string) => void };

function markerIcon(status: MapSupport["status"], isSelected: boolean) {
  const state = status === "Disponible" ? "available" : status === "Optionné" ? "reserved" : "unavailable";
  return divIcon({ className: "publicom-map-icon", html: `<span class="map-marker ${state} ${isSelected ? "selected" : ""}"><i></i></span>`, iconSize: [34, 34], iconAnchor: [17, 17] });
}

export default function PublicomMap({ supports, selectedId, onSelect }: PublicomMapProps) {
  const [isSatellite, setIsSatellite] = useState(false);
  const gabonBounds: [[number, number], [number, number]] = [[-3.98, 8.5], [2.35, 14.6]];

  return <div className="map-stage" role="region" aria-label="Carte interactive des emplacements Publicom">
    <MapContainer center={[0.05, 11.45]} zoom={7} minZoom={7} maxZoom={17} maxBounds={gabonBounds} maxBoundsViscosity={1} scrollWheelZoom className="leaflet-map" aria-label="Carte du Gabon">
      {isSatellite ? <TileLayer attribution="Tiles © Esri" url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" /> : <TileLayer attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />}
      <CircleMarker center={[0.4162, 9.4673]} radius={6} pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#e30613", fillOpacity: 1 }} interactive={false}><Tooltip permanent direction="right" className="city-label">LIBREVILLE</Tooltip></CircleMarker>
      {supports.map((support) => <Marker key={support.id} position={support.coordinates} icon={markerIcon(support.status, selectedId === support.id)} eventHandlers={{ click: () => onSelect(support.id) }}><Tooltip direction="top" offset={[0, -17]} opacity={1}>{support.name} · {support.zone}</Tooltip></Marker>)}
    </MapContainer>
    <button className="map-mode-toggle" onClick={() => setIsSatellite((value) => !value)}>{isSatellite ? "Plan" : "Satellite"}</button>
    <p className="map-credit">Données d’emplacements de démonstration · Fond de carte OpenStreetMap</p>
  </div>;
}
