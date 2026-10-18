import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0e0e10] text-[#f4f1ea] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-[#F8C646] text-black border-3 border-black rounded-3xl p-8 max-w-md shadow-[6px_6px_0px_#000000]">
        <h1 className="font-display text-6xl uppercase leading-none">404</h1>
        <p className="font-mono text-sm font-bold mt-2">HALAMAN TIDAK DITEMUKAN</p>
        <p className="text-xs text-neutral-800 mt-2 font-medium">
          Rute yang Anda cari tidak tersedia di terminal FIN-CRAG.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 bg-black text-white rounded-full font-mono font-bold text-xs border-2 border-black hover:scale-105 transition-transform shadow-[2px_2px_0px_#ffffff]"
        >
          <span>KEMBALI KE BERANDA</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
