export type Role = "admin" | "warga" | "petugas" | "pemerintah";

// Prefix rute -> role yang boleh masuk. Dicek di middleware DAN dijaga RLS di database.
export const ROUTE_ACCESS: Record<string, Role[]> = {
  "/app/pengguna": ["admin"],
  "/app/laporan-desa": ["admin", "pemerintah"],
  "/app/analitik": ["admin", "pemerintah", "petugas"],
  "/app/bank": ["admin", "petugas", "pemerintah", "warga"],
  "/app/tugas": ["admin", "petugas"],
  "/app/laporan": ["admin", "warga", "petugas", "pemerintah"],
  "/app/peta": ["admin", "warga", "petugas", "pemerintah"],
  "/app/jadwal": ["admin", "warga", "petugas", "pemerintah"],
  "/app/notifikasi": ["admin", "warga", "petugas", "pemerintah"],
  "/app": ["admin", "warga", "petugas", "pemerintah"],
};

export function canAccess(role: Role, pathname: string): boolean {
  const key = Object.keys(ROUTE_ACCESS).find((p) => pathname === p || pathname.startsWith(p + "/"));
  return key ? ROUTE_ACCESS[key].includes(role) : false;
}

export const NAV: { href: string; label: string }[] = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/laporan", label: "Laporan" },
  { href: "/app/tugas", label: "Tugas" },
  { href: "/app/peta", label: "Peta" },
  { href: "/app/bank", label: "Bank Sampah" },
  { href: "/app/jadwal", label: "Jadwal" },
  { href: "/app/analitik", label: "Analitik" },
  { href: "/app/laporan-desa", label: "Laporan Desa" },
  { href: "/app/notifikasi", label: "Notifikasi" },
  { href: "/app/pengguna", label: "Pengguna" },
];
