import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { StatusActions } from "@/components/status-actions";

export default async function Laporan() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  const { data: me } = await sb.from("profiles").select("role").eq("id", user!.id).single();
  const { data: rows, error } = await sb.from("reports").select("*").order("created_at", { ascending: false });
  const canAct = me?.role === "admin" || me?.role === "petugas";
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Laporan sampah</h1>
        {(me?.role === "warga" || me?.role === "admin") && <Link href="/app/laporan/baru" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm text-white">+ Lapor</Link>}
      </div>
      {error && <p className="text-sm text-red-600">Gagal memuat: {error.message}</p>}
      {!rows?.length && !error && <p className="rounded-2xl bg-white p-6 text-center text-gray-500">Belum ada laporan.</p>}
      {rows?.map((r) => (
        <div key={r.id} className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex justify-between gap-2"><b>{r.title}</b><span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">{r.status.replace("_", " ")}</span></div>
          <p className="text-sm text-gray-600">{r.address} · {r.category} · ±{r.estimated_kg} kg {r.is_demo && "· demo"}</p>
          {canAct && <StatusActions id={r.id} status={r.status} />}
        </div>
      ))}
    </div>
  );
}
