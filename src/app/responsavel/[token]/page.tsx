import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { guardianRequests, users } from "@/db/schema";
import { getSession } from "@/lib/session";
import { hashToken } from "@/lib/sharing/tokens";
import { confirmGuardian } from "../actions";

const isExpired = (d: Date) => d.getTime() <= Date.now();

export const metadata: Metadata = { title: "Confirmar responsável", robots: { index: false } };

export default async function ConfirmarResponsavelPage({ params, searchParams }: PageProps<"/responsavel/[token]">) {
  const { token } = await params;
  const { erro } = await searchParams;
  const session = await getSession();

  const [req] = await db
    .select({ id: guardianRequests.id, minorName: users.name, expiresAt: guardianRequests.expiresAt, confirmedAt: guardianRequests.confirmedAt })
    .from(guardianRequests)
    .innerJoin(users, eq(users.id, guardianRequests.minorId))
    .where(eq(guardianRequests.tokenHash, hashToken(token)));
  const usable = req && !req.confirmedAt && !isExpired(req.expiresAt);
  const next = encodeURIComponent(`/responsavel/${token}`);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold">Confirmação do responsável legal</h1>
      {!usable ? (
        <p className="text-base">Este link é inválido, expirou ou já foi usado.</p>
      ) : !session ? (
        <>
          <p className="text-base">
            {req.minorName} é menor de 18 anos e indicou você como responsável legal. Entre ou crie uma conta com o e-mail que
            recebeu este pedido (o e-mail precisa estar confirmado).
          </p>
          <Link href={`/login?next=${next}`} className="flex min-h-14 items-center justify-center rounded-lg bg-primary text-lg font-semibold text-primary-foreground">Entrar</Link>
          <Link href={`/cadastro?next=${next}`} className="flex min-h-14 items-center justify-center rounded-lg border-2 text-lg font-semibold">Criar conta</Link>
        </>
      ) : (
        <form action={confirmGuardian.bind(null, token)} className="flex flex-col gap-4">
          <p className="text-base">
            {req.minorName} é menor de 18 anos. Ao confirmar, você passa a acompanhar os registros dele(a) (somente leitura) e
            autoriza o uso do app e o tratamento dos dados de saúde, em nome do menor. Você pode revogar o acesso a qualquer momento.
          </p>
          <label className="flex min-h-12 items-start gap-3 text-base">
            <input type="checkbox" name="declaro" className="mt-1 size-6" required />
            Declaro ter 18 anos ou mais e ser pai, mãe ou responsável legal de {req.minorName}.
          </label>
          {erro && (
            <p role="alert" className="text-base font-medium text-destructive">
              Não foi possível confirmar. Entre com o mesmo e-mail que recebeu o pedido, com o e-mail já confirmado, e marque a declaração.
            </p>
          )}
          <Button type="submit" className="h-14 text-lg">Confirmar como responsável</Button>
        </form>
      )}
    </main>
  );
}
