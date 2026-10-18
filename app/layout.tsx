import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FIN-CRAG | Financial Corrective Agentic RAG (KBMI 4 BEI)",
  description: "Sistem Temu Kembali Informasi Laporan Tahunan Perbankan BEI Berbasis Hybrid Retrieval (BM25-LSI), Financial Ratio Reranking, dan Corrective Agentic Verification - Proyek STKI UDINUS 2026",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-300">
        {children}
      </body>
    </html>
  );
}
