import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { listSharedWithMe } from "@/lib/sharing/queries";

export const metadata: Metadata = { title: "Familiares" };

export default async function FamiliaPage() {
  const user = await requireUser();
  const owners = await listSharedWithMe(user.id);
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Acompanhando</h1>
      {owners.length === 0 ? (
        <p className="text-base text-muted-foreground">Ninguém compartilhou dados com você ainda.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {owners.map((o) => (
            <li key={o.ownerId}>
              <Link
                href={`/familia/${o.ownerId}`}
                className="flex min-h-14 items-center rounded-2xl border-2 bg-card px-4 text-lg font-semibold focus-visible:outline-2 focus-visible:outline-ring"
              >
                {o.ownerName}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
