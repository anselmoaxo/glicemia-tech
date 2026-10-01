import "server-only";
import { redirect } from "next/navigation";
import { safeNext } from "@/lib/safe-next";
import { getSession } from "@/lib/session";

/** Telas de entrada não servem a quem já está logado: leva ao destino pedido (`next`) ou ao início. */
export async function redirectIfSignedIn(next?: unknown) {
  if (await getSession()) redirect(safeNext(next));
}
