import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";

export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

/** Garante usuário autenticado e não suspenso no backend; nunca confie só no proxy/frontend. */
export async function requireUser() {
  const session = await getSession();
  if (!session || session.user.suspendedAt) redirect("/login");
  return session.user;
}
