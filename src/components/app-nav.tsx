"use client";

import { Droplet, Ellipsis, House, Pill, Utensils, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Logo } from "./logo";

// Itens principais ficam na barra inferior (alcance do polegar); o resto vai em "Mais".
const primary: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/inicio", label: "Início", icon: House },
  { href: "/glicemia", label: "Glicemia", icon: Droplet },
  { href: "/refeicoes", label: "Refeições", icon: Utensils },
  { href: "/medicamentos", label: "Remédios", icon: Pill },
  { href: "/mais", label: "Mais", icon: Ellipsis },
];

const moreRoutes = ["/insulina", "/metas", "/compartilhar", "/familia", "/relatorios", "/perfil", "/admin", "/mais"];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/mais" ? moreRoutes.some((r) => pathname.startsWith(r)) : pathname.startsWith(href);

  return (
    <>
      <header className="bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4">
          <Link href="/inicio" className="flex min-h-16 items-center" aria-label="Glicose Tech, ir para o início">
            <Logo />
          </Link>
          <button
            onClick={signOut}
            className="flex min-h-12 items-center rounded-full px-4 text-base font-medium text-muted-foreground hover:bg-secondary"
          >
            Sair
          </button>
        </div>
      </header>

      <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur">
        <ul className="mx-auto flex max-w-3xl px-2 pb-[env(safe-area-inset-bottom)]">
          {primary.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className="group flex min-h-[4.5rem] flex-col items-center justify-center gap-1 py-2 text-sm font-medium text-muted-foreground aria-[current=page]:font-bold aria-[current=page]:text-primary"
                >
                  <span className="grid h-8 w-14 place-items-center rounded-full transition-colors group-aria-[current=page]:bg-accent">
                    <Icon aria-hidden className="size-6" strokeWidth={active ? 2.5 : 2} />
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
