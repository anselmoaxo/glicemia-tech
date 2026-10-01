import type { Metadata } from "next";
import Link from "next/link";
import { isAdmin } from "@/lib/admin";
import { requireUser } from "@/lib/session";
import { getTrackingContext } from "@/lib/tracking/plan";

export const metadata: Metadata = { title: "Mais" };

const items = [
  { href: "/assistente", label: "Assistente (dúvidas sobre diabetes e carboidratos)" },
  { href: "/insulina", label: "Insulina" },
  { href: "/metas", label: "Metas de glicemia" },
  { href: "/acompanhamento", label: "Configurações de acompanhamento" },
  { href: "/alertas", label: "Alertas e lembretes" },
  { href: "/orientacoes", label: "Orientações para medir e ir à consulta" },
  { href: "/relatorios", label: "Relatórios e link para o médico" },
  { href: "/compartilhar", label: "Compartilhar com familiar" },
  { href: "/familia", label: "Acompanhando familiares" },
  { href: "/perfil", label: "Meu perfil" },
  { href: "/privacidade", label: "Privacidade e meus dados" },
];

export default async function MaisPage() {
  const user = await requireUser();
  const { diabetesVisible } = await getTrackingContext(user.id);
  // "Não tenho diabetes" sem acompanhamento específico: sem insulina, metas de diabetes nem alertas
  const base = diabetesVisible ? items : items.filter((i) => !["/insulina", "/alertas"].includes(i.href));
  const list = isAdmin(user.id) ? [...base, { href: "/admin", label: "Administração" }] : base;
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Mais</h1>
      <ul className="flex flex-col gap-3">
        {list.map((i) => (
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
