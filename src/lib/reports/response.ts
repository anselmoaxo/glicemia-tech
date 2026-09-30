import "server-only";
import type { ReportData } from "./data";
import { renderReportPdf } from "./pdf";

export async function pdfResponse(data: ReportData) {
  const buffer = await renderReportPdf(data);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="relatorio-glicemia-${data.range.fromDate}_${data.range.toDate}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
