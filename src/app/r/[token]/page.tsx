import type { Metadata } from "next";
import { ReportView } from "@/components/report-view";
import { getReportData } from "@/lib/reports/data";
import { getActiveSharedReport } from "@/lib/reports/shared";

export const metadata: Metadata = {
  title: "Relatório compartilhado",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function SharedReportPage({ params }: PageProps<"/r/[token]">) {
  const { token } = await params;
  const shared = await getActiveSharedReport(token);

  if (!shared) {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-10">
        <h1 className="text-2xl font-bold">Link inválido ou expirado</h1>
        <p className="mt-2 text-base">Peça ao paciente para gerar um novo link.</p>
      </main>
    );
  }

  const data = await getReportData(shared.userId, shared.range);
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <ReportView data={data} />
      <a
        href={`/r/${encodeURIComponent(token)}/pdf`}
        className="mt-8 flex min-h-14 items-center justify-center rounded-lg bg-primary text-lg font-semibold text-primary-foreground"
      >
        Baixar PDF
      </a>
    </main>
  );
}
