import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/session";
import { getOwnerName, getUsableInvite } from "@/lib/sharing/queries";
import { acceptInvite } from "./actions";

export const metadata: Metadata = { title: "Convite", robots: { index: false } };

export default async function ConvitePage({ params, searchParams }: PageProps<"/convite/[token]">) {
  const { token } = await params;
  const { erro } = await searchParams;
  const session = await getSession();

  const invite = await getUsableInvite(token);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold">Convite de acompanhamento</h1>
      {!invite ? (
        <p className="text-base">Este convite é inválido, expirou ou já foi usado.</p>
      ) : !session ? (
        <>
          <p className="text-base">
            {await getOwnerName(invite.ownerId)} convidou você para acompanhar os registros de saúde dele(a),
            somente para leitura. Entre ou crie uma conta usando o e-mail que recebeu o convite.
          </p>
          <Link href={`/login?next=${encodeURIComponent(`/convite/${token}`)}`} className="flex min-h-14 items-center justify-center rounded-lg bg-primary text-lg font-semibold text-primary-foreground">
            Entrar
          </Link>
          <Link href={`/cadastro?next=${encodeURIComponent(`/convite/${token}`)}`} className="flex min-h-14 items-center justify-center rounded-lg border-2 text-lg font-semibold">
            Criar conta
          </Link>
        </>
      ) : (
        <form action={acceptInvite.bind(null, token)} className="flex flex-col gap-4">
          <p className="text-base">
            {await getOwnerName(invite.ownerId)} convidou você para acompanhar os registros de saúde
            dele(a), somente para leitura.
          </p>
          {erro && (
            <p role="alert" className="text-base font-medium text-destructive">
              Não foi possível aceitar. Entre com o mesmo e-mail que recebeu o convite.
            </p>
          )}
          <Button type="submit" className="h-14 text-lg">Aceitar convite</Button>
        </form>
      )}
    </main>
  );
}
