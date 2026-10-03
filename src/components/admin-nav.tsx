"use client";

import { ArrowLeft, BadgeCheck, History, Inbox, LayoutDashboard, LogOut, Mail, Settings, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const items: { href: string; label: string; icon: LucideIcon; exact?: boolean }[] = [
  { href: "/admin", label: "Resumo", icon: LayoutDashboard, exact: true },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/solicitacoes", label: "Solicitações", icon: Inbox },
  { href: "/admin/profissionais", label: "Profissionais", icon: BadgeCheck },
  { href: "/admin/emails", label: "E-mails", icon: Mail },
  { href: "/admin/auditoria", label: "Auditoria", icon: History },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
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
    <div className="bg-lcd text-white md:sticky md:top-0 md:flex md:h-dvh md:w-64 md:shrink-0 md:flex-col">
      <div className="flex items-center justify-between gap-2 px-4 md:hidden">
        <p className="flex min-h-14 items-center gap-2 font-display text-lg font-bold">
          <ShieldCheck aria-hidden className="size-5 text-lcd-ink" /> Administração
        </p>
        <button onClick={signOut} className="flex min-h-12 items-center rounded-full px-3 text-base font-medium text-white/75 hover:bg-white/10">
          Sair
        </button>
      </div>

      <nav aria-label="Administração" className="md:flex md:flex-1 md:flex-col md:justify-between md:p-4">
        <div className="md:flex md:flex-col md:gap-8">
          <p className="hidden items-center gap-3 px-2 pt-2 md:flex">
            <span aria-hidden className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 shadow-md shadow-black/30">
              <ShieldCheck className="size-5" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-display text-lg font-bold">Administração</span>
              <span className="text-sm text-white/60">Glicose Tech</span>
            </span>
          </p>
          <ul className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-visible md:p-0">
            {items.map((i) => (
              <li key={i.href} className="shrink-0">
                <Link
                  href={i.href}
                  aria-current={active(i) ? "page" : undefined}
                  className="relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-base font-semibold text-white/70 transition-colors hover:bg-white/5 hover:text-white aria-[current=page]:bg-white/10 aria-[current=page]:text-white"
                >
                  <i.icon aria-hidden className="size-5" />
                  {i.label}
                  {active(i) && <span aria-hidden className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-lcd-ink md:inset-x-auto md:inset-y-2 md:left-0 md:h-auto md:w-1" />}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="hidden flex-col gap-1 border-t border-white/10 pt-4 md:flex">
          <Link href="/inicio" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-base font-semibold text-white/70 hover:bg-white/5 hover:text-white">
            <ArrowLeft aria-hidden className="size-5" /> Voltar ao app
          </Link>
          <button onClick={signOut} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-base font-semibold text-white/70 hover:bg-white/5 hover:text-white">
            <LogOut aria-hidden className="size-5" /> Sair
          </button>
        </div>
      </nav>
    </div>
  );
}
