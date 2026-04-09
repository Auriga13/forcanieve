import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ForcaNieve — Pirineo Aragonés",
  description:
    "Condiciones meteorológicas, nieve y aludes del Pirineo Aragonés. Datos actualizados cada 6 horas con resúmenes generados por IA.",
  keywords: [
    "pirineo",
    "aragón",
    "nieve",
    "montaña",
    "meteo",
    "aludes",
    "esquí de montaña",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
