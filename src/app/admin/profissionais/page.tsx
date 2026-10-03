import { asc, eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { professionalProfiles, users } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { COUNCILS } from "@/lib/privacy/professional";
import { decideProfessional } from "./actions";

export const metadata = { title: "Verificação de profissionais" };

export default async function ProfissionaisPage() {
  await requireAdmin();
  const pending = await db
    .select({
      userId: professionalProfiles.userId,
      name: users.name,
      email: users.email,
      profession: professionalProfiles.profession,
      council: professionalProfiles.registryCouncil,
      uf: professionalProfiles.registryUf,
      number: professionalProfiles.registryNumber,
    })
    .from(professionalProfiles)
    .innerJoin(users, eq(users.id, professionalProfiles.userId))
    .where(eq(professionalProfiles.verificationStatus, "pending"))
    .orderBy(asc(professionalProfiles.updatedAt))
    .limit(50);

  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-display text-4xl font-extrabold tracking-tight">Profissionais</h1>
      <p className="text-lg text-muted-foreground">Registros profissionais aguardando conferência.</p>
      <p className="text-base text-muted-foreground">
        Confira no portal oficial do conselho se o nome, a UF e o número existem, estão ativos e pertencem à pessoa. Só então
        marque a caixa e decida. A decisão fica na auditoria.
      </p>
      {pending.length === 0 && <p className="text-base">Nada pendente.</p>}
      <ul className="flex flex-col gap-3">
        {pending.map((p) => {
          const portal = COUNCILS.find((c) => c.key === p.council)?.portal;
          return (
            <li key={p.userId} className="flex flex-col gap-2 rounded-2xl border bg-card p-4 text-base">
              <p className="font-semibold">{p.name} · {p.profession}</p>
              <p className="break-all text-muted-foreground">{p.email}</p>
              <p>Registro: <strong>{p.council} {p.number}/{p.uf}</strong></p>
              {portal && (
                <a href={portal} target="_blank" rel="noopener noreferrer" className="underline">
                  Abrir portal do {p.council} em nova aba
                </a>
              )}
              <form action={decideProfessional} className="flex flex-col gap-3">
                <input type="hidden" name="userId" value={p.userId} />
                <label className="flex min-h-12 items-center gap-3">
                  <input type="checkbox" name="conferido" className="size-6" required />
                  Conferi no portal oficial do conselho
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" name="decision" value="verified" className="h-11 text-base">Registro confere</Button>
                  <Button type="submit" name="decision" value="rejected" variant="outline" className="h-11 text-base">Não confere</Button>
                </div>
              </form>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
