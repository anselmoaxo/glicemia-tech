import { getReportData } from "@/lib/reports/data";
import { pdfResponse } from "@/lib/reports/response";
import { getActiveSharedReport } from "@/lib/reports/shared";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: RouteContext<"/r/[token]/pdf">) {
  const { token } = await params;
  const shared = await getActiveSharedReport(token);
  if (!shared) return new Response("Link inválido ou expirado", { status: 404 });
  return pdfResponse(await getReportData(shared.userId, shared.range));
}
