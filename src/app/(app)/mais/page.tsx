import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Mais" };

const items = [
  { href: "/insulina", label: "Insulina" },
  { href: "/metas", label: "Metas de glicemia" },
  { href: "/relatorios", label: "Relatórios e link para o médico" },
  { href: "/compartilhar", label: "Compartilhar com familiar" },
  { href: "/familia", label: "Acompanhando familiares" },
  { href: "/perfil", label: "Meu perfil" },
];

export default async function MaisPage() {
  await requireUser();
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Mais</h1>
      <ul className="flex flex-col gap-3">
        {items.map((i) => (
          <li key={i.href}>
            <Link
              href={i.href}
              className="flex min-h-14 items-center rounded-2xl border-2 bg-card px-4 text-lg font-semibold focus-visible:outline-2 focus-visible:outline-ring"
            >
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
