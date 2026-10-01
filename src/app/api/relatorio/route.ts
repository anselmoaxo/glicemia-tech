import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getTimezone } from "@/lib/profile";
import { getReportData } from "@/lib/reports/data";
import { resolveRange } from "@/lib/reports/range";
import { pdfResponse } from "@/lib/reports/response";
import { getAccessibleModules } from "@/lib/sharing/access";
import { logAccess } from "@/lib/privacy/access-log";

export const runtime = "nodejs";

// PDF do próprio usuário (ou de quem compartilhou "Relatórios" com ele).
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || session.user.suspendedAt) return new Response("Não autenticado", { status: 401 });

  const params = request.nextUrl.searchParams;
  const ownerId = params.get("owner") ?? session.user.id;
  if (ownerId.length > 64) return new Response("Não encontrado", { status: 404 });

  const modules = await getAccessibleModules(session.user.id, ownerId);
  if (!modules.has("reports")) return new Response("Não encontrado", { status: 404 });

  if (ownerId !== session.user.id) await logAccess(ownerId, session.user.id, "relatorio");

  const range = resolveRange(
    { dias: params.get("dias"), from: params.get("from"), to: params.get("to") },
    await getTimezone(ownerId),
  );
  if (!range) return new Response("Período inválido", { status: 400 });

  return pdfResponse(await getReportData(ownerId, range));
}
