import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Publicom — Régie publicitaire du Gabon",
  description: "Explorez le réseau d'affichage Publicom à Libreville.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr" data-scroll-behavior="smooth"><body>{children}</body></html>;
}
