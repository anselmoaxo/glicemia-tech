import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Demonstração", robots: { index: false, follow: false } };

// Páginas de demonstração: dados fictícios, sem login e sem banco. Remover antes do uso real.
export default function DemoLayout({ children }: LayoutProps<"/demo">) {
  return (
    <>
      <div role="note" className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-950">
        Modo demonstração · dados fictícios
      </div>
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4">
          <Link href="/demo" className="flex min-h-14 items-center text-lg font-bold">Glicose Tech</Link>
          <nav aria-label="Demonstração" className="flex gap-1">
            <Link href="/demo" className="flex min-h-14 items-center px-3 text-base font-medium">Início</Link>
            <Link href="/demo/registrar" className="flex min-h-14 items-center px-3 text-base font-medium">Registrar</Link>
            <Link href="/demo/historico" className="flex min-h-14 items-center px-3 text-base font-medium">Histórico</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
