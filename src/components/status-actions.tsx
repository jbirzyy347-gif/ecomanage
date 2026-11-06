"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
const NEXT: Record<string, [string, string][]> = {
  menunggu: [["diverifikasi", "Verifikasi"], ["ditolak", "Tolak"]],
  diverifikasi: [["dalam_penanganan", "Mulai tangani"]],
  dalam_penanganan: [["selesai", "Tandai selesai"]],
};
export function StatusActions({ id, status }: { id: number; status: string }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  async function set(s: string) {
    setBusy(true); setErr("");
    const { error } = await supabaseBrowser().from("reports").update({ status: s }).eq("id", id);
    setBusy(false); if (error) return setErr(error.message); router.refresh();
  }
  return (<div className="mt-2 flex flex-wrap gap-2">
    {(NEXT[status] ?? []).map(([s, l]) => (<button key={s} disabled={busy} onClick={() => set(s)} className="rounded-lg border px-3 py-1 text-xs hover:bg-emerald-50 disabled:opacity-50">{l}</button>))}
    {err && <span className="text-xs text-red-600">{err}</span>}
  </div>);
}
