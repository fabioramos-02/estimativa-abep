import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Estimativa IOSPD 2026 · MS", description: "Relatório estratégico interno de estimativa do IOSPD" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
