"use client";
import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
type Pt = { lat: number; lng: number; label: string; color: string };
export default function Map({ points }: { points: Pt[] }) {
  return (
    <MapContainer center={[-7.8016, 110.4136]} zoom={15} className="h-[70vh] w-full rounded-2xl">
      <TileLayer attribution="&copy; OpenStreetMap" url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {points.map((p, i) => (<CircleMarker key={i} center={[p.lat, p.lng]} radius={10} pathOptions={{ color: p.color, fillColor: p.color, fillOpacity: 0.7 }}><Popup>{p.label}</Popup></CircleMarker>))}
    </MapContainer>
  );
}
