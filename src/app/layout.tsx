import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { RegisterServiceWorker } from "@/components/register-sw";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Glicose Tech", template: "%s · Glicose Tech" },
  description: "Acompanhe sua glicemia, alimentação e medicamentos de forma simples.",
  applicationName: "Glicose Tech",
  appleWebApp: { capable: true, title: "Glicose", statusBarStyle: "default" },
  icons: { icon: "/icons/192", apple: "/icons/180" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1d4ed8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col text-base">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
