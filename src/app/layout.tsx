import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Mono, Inter, Plus_Jakarta_Sans } from "next/font/google";
import { RegisterServiceWorker } from "@/components/register-sw";
import "./globals.css";

// Padrão AnselmoTech: Plus Jakarta Sans nos títulos e Inter no texto. Os números da glicemia mantêm a Atkinson Mono,
// desenhada para baixa visão (dígitos inconfundíveis).
const display = Plus_Jakarta_Sans({ variable: "--font-display-face", subsets: ["latin"], weight: ["500", "600", "700", "800"], display: "swap" });
const ui = Inter({ variable: "--font-ui", subsets: ["latin"], display: "swap" });
const lcd = Atkinson_Hyperlegible_Mono({ variable: "--font-lcd-face", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Glicose Tech", template: "%s · Glicose Tech" },
  description: "Acompanhe sua glicemia, alimentação e medicamentos de forma simples.",
  applicationName: "Glicose Tech",
  appleWebApp: { capable: true, title: "Glicose", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4f46e5",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${ui.variable} ${lcd.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col text-base">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
