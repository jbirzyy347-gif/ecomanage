import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { NAV, canAccess, type Role } from "@/lib/roles";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: p } = await sb.from("profiles").select("full_name, role").eq("id", user.id).single();
  if (!p) redirect("/login");
  const items = NAV.filter((n) => canAccess(p.role as Role, n.href));

  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      <nav className="flex gap-1 overflow-x-auto bg-white p-3 shadow-sm md:w-60 md:flex-col md:p-4">
        <span className="px-3 py-2 font-semibold text-emerald-700">EcoManage</span>
        {items.map((n) => (
          <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-xl px-3 py-2 text-sm hover:bg-emerald-50">{n.label}</Link>
        ))}
        <span className="mt-auto hidden px-3 text-xs text-gray-500 md:block">{p.full_name} · {p.role}</span>
      </nav>
      <main className="flex-1 p-4 md:p-8">
        <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">Data demonstrasi fiktif — bukan data lingkungan sebenarnya.</p>
        {children}
      </main>
    </div>
  );
}
