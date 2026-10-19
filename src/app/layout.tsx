import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Estudio con PDFs | Chat, Exámenes y Tarjetas con IA",
  description: "Chat con tus documentos, exámenes tipo test, V/F y respuesta corta, y tarjetas de estudio generados con IA fundamentada y citas precisas.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
