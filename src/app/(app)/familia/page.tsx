import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { listSharedWithMe } from "@/lib/sharing/queries";
import { ROLE_LABEL, type MemberRole } from "@/lib/sharing/rules";

export const metadata: Metadata = { title: "Menores sob sua responsabilidade" };

export default async function FamiliaPage() {
  const user = await requireUser();
  const owners = await listSharedWithMe(user.id);
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Menores sob sua responsabilidade</h1>
      {owners.length === 0 ? (
        <p className="text-base text-muted-foreground">Você não é responsável legal de nenhuma conta.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {owners.map((o) => (
            <li key={o.ownerId}>
              <Link
                href={`/familia/${o.ownerId}`}
                className="flex min-h-14 items-center rounded-2xl py-2 border-2 bg-card px-4 text-lg font-semibold focus-visible:outline-2 focus-visible:outline-ring"
              >
                <span className="flex flex-col">
                  {o.ownerName}
                  <span className="text-sm font-normal text-muted-foreground">Você é: {ROLE_LABEL[o.role as MemberRole]} · somente leitura</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
