"use client";

import { ArrowLeft, BadgeCheck, Inbox, LayoutDashboard, LogOut, Mail, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const items: { href: string; label: string; icon: LucideIcon; exact?: boolean }[] = [
  { href: "/admin", label: "Resumo", icon: LayoutDashboard, exact: true },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/solicitacoes", label: "Solicitações", icon: Inbox },
  { href: "/admin/profissionais", label: "Profissionais", icon: BadgeCheck },
  { href: "/admin/emails", label: "E-mails", icon: Mail },
];

/** Navegação própria da administração: menu lateral no desktop, faixa rolável no celular. */
export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  const active = (i: (typeof items)[number]) => (i.exact ? pathname === i.href : pathname.startsWith(i.href));

  return (
    <>
      <div className="flex items-center justify-between gap-2 border-b bg-card px-4 md:hidden">
        <p className="flex min-h-14 items-center gap-2 text-lg font-bold">
          <ShieldCheck aria-hidden className="size-5 text-primary" /> Administração
        </p>
        <button onClick={signOut} className="flex min-h-12 items-center rounded-full px-3 text-base font-medium text-muted-foreground hover:bg-secondary">
          Sair
        </button>
      </div>

      <nav aria-label="Administração" className="border-b bg-card md:sticky md:top-0 md:flex md:h-dvh md:w-64 md:shrink-0 md:flex-col md:justify-between md:border-b-0 md:border-r md:p-4">
        <div className="md:flex md:flex-col md:gap-6">
          <p className="hidden items-center gap-2 px-2 text-lg font-bold md:flex">
            <span aria-hidden className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 text-primary-foreground">
              <ShieldCheck className="size-5" />
            </span>
            Administração
          </p>
          <ul className="flex gap-1 overflow-x-auto px-2 py-2 md:flex-col md:overflow-visible md:p-0">
            {items.map((i) => (
              <li key={i.href} className="shrink-0">
                <Link
                  href={i.href}
                  aria-current={active(i) ? "page" : undefined}
                  className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-base font-semibold text-muted-foreground hover:bg-secondary aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground"
                >
                  <i.icon aria-hidden className="size-5" />
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="hidden flex-col gap-1 md:flex">
          <Link href="/inicio" className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-base font-semibold text-muted-foreground hover:bg-secondary">
            <ArrowLeft aria-hidden className="size-5" /> Voltar ao app
          </Link>
          <button onClick={signOut} className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-left text-base font-semibold text-muted-foreground hover:bg-secondary">
            <LogOut aria-hidden className="size-5" /> Sair
          </button>
        </div>
      </nav>
    </>
  );
}
