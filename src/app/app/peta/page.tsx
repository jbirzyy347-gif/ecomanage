import { supabaseServer } from "@/lib/supabase/server";
import MapView from "@/components/map-loader";
const STATUS_COLOR: Record<string, string> = { menunggu: "#f59e0b", diverifikasi: "#3b82f6", dalam_penanganan: "#8b5cf6", selesai: "#10b981", ditolak: "#9ca3af" };
const LEVEL_COLOR: Record<string, string> = { rendah: "#84cc16", sedang: "#f97316", tinggi: "#dc2626" };
export default async function Peta() {
  const sb = await supabaseServer();
  const [{ data: reports }, { data: places }, { data: hot }] = await Promise.all([
    sb.from("reports").select("lat,lng,title,status"), sb.from("places").select("*"), sb.from("hotspots").select("*"),
  ]);
  const points = [
    ...(reports ?? []).map((r) => ({ lat: r.lat, lng: r.lng, label: `Laporan: ${r.title} (${r.status})`, color: STATUS_COLOR[r.status] })),
    ...(places ?? []).map((p) => ({ lat: p.lat, lng: p.lng, label: `${p.name} — ${p.kind}`, color: "#0ea5e9" })),
    ...(hot ?? []).map((h) => ({ lat: h.lat, lng: h.lng, label: `Rawan: ${h.name} (${h.level})`, color: LEVEL_COLOR[h.level] })),
  ];
  return (<div className="space-y-3"><h1 className="text-xl font-semibold">Peta digital</h1>
    <p className="text-xs text-gray-500">Warna laporan = status · biru = bank sampah/TPS/kantor · merah-oranye-hijau = area rawan</p>
    <MapView points={points} /></div>);
}
