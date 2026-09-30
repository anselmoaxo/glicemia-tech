import { Droplet, House, History, PlusCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Demonstração", robots: { index: false, follow: false } };

const items = [
  { href: "/demo", label: "Início", icon: House },
  { href: "/demo/registrar", label: "Registrar", icon: PlusCircle },
  { href: "/demo/historico", label: "Histórico", icon: History },
];

// Páginas de demonstração: dados fictícios, sem login e sem banco. Remover antes do uso real.
export default function DemoLayout({ children }: LayoutProps<"/demo">) {
  return (
    <>
      <div role="note" className="flex items-center justify-center gap-2 bg-primary px-4 py-2 text-center text-base font-medium text-primary-foreground">
        <Droplet aria-hidden className="size-4" /> Demonstração com dados fictícios
      </div>
      <header className="bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4">
          <Link href="/demo" className="flex min-h-16 items-center" aria-label="Demonstração, ir para o início">
            <Logo />
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-4 pb-28">{children}</main>
      <nav aria-label="Demonstração" className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur">
        <ul className="mx-auto flex max-w-3xl px-2">
          {items.map(({ href, label, icon: Icon }) => (
            <li key={href} className="flex-1">
              <Link href={href} className="flex min-h-[4.5rem] flex-col items-center justify-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary">
                <Icon aria-hidden className="size-6" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
