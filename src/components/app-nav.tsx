"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

// Itens principais ficam na barra inferior (polegar); o resto vai em "Mais".
const primary = [
  { href: "/inicio", label: "Início" },
  { href: "/glicemia", label: "Glicemia" },
  { href: "/refeicoes", label: "Refeições" },
  { href: "/medicamentos", label: "Remédios" },
  { href: "/mais", label: "Mais" },
];

const moreRoutes = ["/insulina", "/metas", "/compartilhar", "/familia", "/relatorios", "/perfil", "/mais"];

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
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4">
          <Link href="/inicio" className="flex min-h-14 items-center text-lg font-bold">
            Glicose Tech
          </Link>
          <button
            onClick={signOut}
            className="flex min-h-14 items-center px-2 text-base underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
          >
            Sair
          </button>
        </div>
      </header>

      <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-40 border-t bg-background">
        <ul className="mx-auto flex max-w-3xl">
          {primary.map((l) => (
            <li key={l.href} className="flex-1">
              <Link
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className="flex min-h-16 flex-col items-center justify-center px-1 text-center text-sm font-medium aria-[current=page]:border-t-4 aria-[current=page]:border-primary aria-[current=page]:font-bold focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
