import { supabaseServer } from "@/lib/supabase/server";
import { CategoryChart, StatusChart } from "@/components/charts";

export default async function Dashboard() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  const { data: me } = await sb.from("profiles").select("full_name, role").eq("id", user!.id).single();
  const { data: reports } = await sb.from("reports").select("status, category, estimated_kg, volume_kg");
  const rows = reports ?? [];
  const byCat: Record<string, number> = {}, byStatus: Record<string, number> = {};
  let total = 0;
  for (const r of rows) {
    const kg = Number(r.volume_kg ?? r.estimated_kg);
    total += kg; byCat[r.category] = (byCat[r.category] ?? 0) + kg; byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
  }
  const done = byStatus["selesai"] ?? 0;
  const card = "rounded-2xl bg-white p-5 shadow-sm";
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Halo, {me?.full_name} <span className="text-sm font-normal text-gray-500">({me?.role})</span></h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className={card}><p className="text-xs text-gray-500">Total laporan</p><p className="text-2xl font-bold">{rows.length}</p></div>
        <div className={card}><p className="text-xs text-gray-500">Perkiraan sampah (kg)</p><p className="text-2xl font-bold">{total.toFixed(0)}</p></div>
        <div className={card}><p className="text-xs text-gray-500">Selesai</p><p className="text-2xl font-bold">{done}</p></div>
        <div className={card}><p className="text-xs text-gray-500">Belum diproses</p><p className="text-2xl font-bold">{byStatus["menunggu"] ?? 0}</p></div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className={card}><h2 className="mb-2 font-medium">Sampah per kategori (kg)</h2><CategoryChart data={Object.entries(byCat).map(([name, kg]) => ({ name, kg }))} /></div>
        <div className={card}><h2 className="mb-2 font-medium">Status laporan</h2><StatusChart data={Object.entries(byStatus).map(([name, value]) => ({ name, value }))} /></div>
      </div>
    </div>
  );
}
