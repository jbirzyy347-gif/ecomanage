"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { supabaseBrowser } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
  name: z.string().min(3, "Nama minimal 3 karakter").optional(),
});

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"masuk" | "daftar">("masuk");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      email: f.get("email"), password: f.get("password"),
      name: mode === "daftar" ? f.get("name") : undefined,
    });
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setLoading(true); setError("");
    const sb = supabaseBrowser();
    const { email, password, name } = parsed.data;
    const { error: err } = mode === "masuk"
      ? await sb.auth.signInWithPassword({ email, password })
      : await sb.auth.signUp({ email, password, options: { data: { full_name: name } } });
    setLoading(false);
    if (err) return setError(err.message);
    router.push("/app"); router.refresh();
  }

  return (
    <main className="min-h-screen grid place-items-center bg-gray-50 p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-emerald-700">EcoManage</h1>
        {mode === "daftar" && <input name="name" placeholder="Nama lengkap" className="w-full rounded-xl border p-3" />}
        <input name="email" type="email" placeholder="Email" className="w-full rounded-xl border p-3" />
        <input name="password" type="password" placeholder="Kata sandi" className="w-full rounded-xl border p-3" />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="w-full rounded-xl bg-emerald-600 p-3 font-medium text-white disabled:opacity-60">
          {loading ? "Memproses…" : mode === "masuk" ? "Masuk" : "Buat akun"}
        </button>
        <button type="button" onClick={() => setMode(mode === "masuk" ? "daftar" : "masuk")} className="w-full text-sm text-gray-500">
          {mode === "masuk" ? "Belum punya akun? Daftar sebagai masyarakat" : "Sudah punya akun? Masuk"}
        </button>
      </form>
    </main>
  );
}
