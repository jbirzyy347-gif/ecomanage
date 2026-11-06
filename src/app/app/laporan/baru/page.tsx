"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { supabaseBrowser } from "@/lib/supabase/client";

const schema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter").max(120),
  description: z.string().min(10, "Deskripsi minimal 10 karakter"),
  category: z.enum(["plastik", "kertas", "logam", "kaca", "organik", "residu"]),
  address: z.string().min(3, "Alamat wajib diisi"),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  estimated_kg: z.coerce.number().positive("Perkiraan berat harus > 0"),
});

export default function NewReport() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const parsed = schema.safeParse(Object.fromEntries(f));
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    const file = f.get("photo") as File | null;
    if (file && file.size > 5 * 1024 * 1024) return setError("Foto maksimal 5 MB");

    setBusy(true); setError("");
    const sb = supabaseBrowser();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return router.push("/login");
    const { data: prof } = await sb.from("profiles").select("full_name").eq("id", user.id).single();

    let photo_before: string | null = null;
    if (file && file.size > 0) {
      const path = `${user.id}/${Date.now()}-${file.name.replace(/[^\w.]/g, "_")}`;
      const { error: upErr } = await sb.storage.from("report-photos").upload(path, file);
      if (upErr) { setBusy(false); return setError("Gagal mengunggah foto: " + upErr.message); }
      photo_before = path;
    }
    const { error: insErr } = await sb.from("reports").insert({
      ...parsed.data, reporter_id: user.id, reporter_name: prof?.full_name ?? "Warga", photo_before,
    });
    setBusy(false);
    if (insErr) return setError(insErr.message);
    router.push("/app/laporan"); router.refresh();
  }

  const input = "w-full rounded-xl border p-3";
  return (
    <form onSubmit={submit} className="max-w-lg space-y-3">
      <h1 className="text-xl font-semibold">Laporkan penumpukan sampah</h1>
      <input name="title" placeholder="Judul laporan" className={input} />
      <textarea name="description" placeholder="Kondisi di lokasi" rows={3} className={input} />
      <select name="category" className={input}>
        {["plastik", "kertas", "logam", "kaca", "organik", "residu"].map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <input name="address" placeholder="Alamat / patokan lokasi" className={input} />
      <div className="grid grid-cols-2 gap-3">
        <input name="lat" placeholder="Lintang (-7.80)" defaultValue="-7.8016" className={input} />
        <input name="lng" placeholder="Bujur (110.41)" defaultValue="110.4136" className={input} />
      </div>
      <input name="estimated_kg" placeholder="Perkiraan berat (kg)" className={input} />
      <input name="photo" type="file" accept="image/*" className="w-full text-sm" />
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button disabled={busy} className="rounded-xl bg-emerald-600 px-5 py-3 font-medium text-white disabled:opacity-60">
        {busy ? "Mengirim…" : "Kirim laporan"}
      </button>
    </form>
  );
}
