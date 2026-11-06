import Link from "next/link";
const fitur = [
  ["Lapor sampah", "Warga melapor lengkap dengan foto dan lokasi, status dipantau real-time."],
  ["Tugas petugas", "Petugas menerima laporan, memperbarui status, dan mencatat volume angkut."],
  ["Bank sampah", "Setoran, klasifikasi, berat, dan nilai ekonomi tercatat rapi."],
  ["Monitoring desa", "Pemerintah desa memantau statistik dan kinerja dalam satu dashboard."],
];
export default function Landing() {
  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center justify-between bg-white/90 px-5 py-3 backdrop-blur">
        <b className="text-emerald-700">EcoManage</b>
        <nav className="hidden gap-5 text-sm md:flex">
          <a href="#beranda">Beranda</a><a href="#tentang">Tentang</a><a href="#fitur">Fitur</a><a href="#statistik">Statistik</a>
        </nav>
        <Link href="/login" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white">Login</Link>
      </header>
      <section id="beranda" className="bg-gradient-to-b from-emerald-50 to-white px-5 py-16 text-center md:py-24">
        <h1 className="mx-auto max-w-2xl text-3xl font-bold md:text-5xl">Kelola Sampah Hari Ini, Selamatkan Lingkungan Esok Hari.</h1>
        <p className="mx-auto mt-4 max-w-xl text-gray-600">Satu sistem digital yang menghubungkan masyarakat, petugas kebersihan, bank sampah, dan pemerintah desa.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/login" className="rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white">Mulai Sekarang</Link>
          <a href="#tentang" className="rounded-xl border px-6 py-3 font-medium">Pelajari Lebih Lanjut</a>
        </div>
      </section>
      <section id="tentang" className="mx-auto max-w-3xl px-5 py-12">
        <h2 className="text-2xl font-semibold">Tentang & SDGs</h2>
        <p className="mt-3 text-gray-600">EcoManage mendukung SDG 11 (Kota dan Permukiman Berkelanjutan), SDG 12 (Konsumsi dan Produksi yang Bertanggung Jawab), dan SDG 13 (Penanganan Perubahan Iklim).</p>
      </section>
      <section id="fitur" className="mx-auto grid max-w-5xl gap-4 px-5 pb-12 sm:grid-cols-2">
        {fitur.map(([t, d]) => (<div key={t} className="rounded-2xl border p-5 shadow-sm"><h3 className="font-semibold text-emerald-700">{t}</h3><p className="mt-1 text-sm text-gray-600">{d}</p></div>))}
      </section>
      <section id="statistik" className="bg-emerald-600 px-5 py-12 text-center text-white">
        <p className="text-sm opacity-80">Angka simulasi — data demonstrasi, bukan data lingkungan sebenarnya</p>
        <div className="mt-4 grid grid-cols-3 gap-4 text-2xl font-bold"><div>12,4 t<small className="block text-xs font-normal">terkumpul</small></div><div>68%<small className="block text-xs font-normal">didaur ulang</small></div><div>94%<small className="block text-xs font-normal">laporan selesai</small></div></div>
      </section>
      <footer className="px-5 py-8 text-center text-sm text-gray-500">© EcoManage · Desa Lembah Hijau (fiktif) · Data demonstrasi</footer>
    </div>
  );
}
