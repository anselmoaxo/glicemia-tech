import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Mono, Atkinson_Hyperlegible_Next } from "next/font/google";
import { RegisterServiceWorker } from "@/components/register-sw";
import "./globals.css";

// Atkinson Hyperlegible foi desenhada para baixa visão: letras e números inconfundíveis.
const ui = Atkinson_Hyperlegible_Next({ variable: "--font-ui", subsets: ["latin"], display: "swap" });
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
  themeColor: "#0f3d4c",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${ui.variable} ${lcd.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col text-base">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
