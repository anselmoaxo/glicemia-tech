import { Button } from "@/components/ui/button";
import { fmtDateTime } from "@/lib/admin-format";
import { categoryLabel, EMAIL_STATUS_LABEL, type EmailStatus } from "@/lib/email-categories";

export type EmailRow = {
  id: string;
  category: string;
  reason: string;
  recipient: string;
  status: string;
  error: string | null;
  requestedAt: Date;
  sentAt: Date | null;
  providerUpdatedAt: Date | null;
  hasProviderId: boolean;
};

const tone = (s: string) =>
  s === "delivered" ? "text-ok" : s === "rejected" || s === "failed" ? "text-destructive" : "text-muted-foreground";

/** Lista de e-mails enviados: tipo, motivo, destinatário mascarado, horários e status reais do provedor. */
export function EmailHistoryList({ rows, refresh }: { rows: EmailRow[]; refresh?: (formData: FormData) => Promise<void> }) {
  if (rows.length === 0) return <p className="text-base text-muted-foreground">Nenhum e-mail enviado ainda.</p>;
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((r) => (
        <li key={r.id} className="flex flex-col gap-1 rounded-2xl border bg-card p-4 text-base">
          <p className="font-semibold">{categoryLabel(r.category)}</p>
          <p className="text-muted-foreground">{r.reason} · para {r.recipient}</p>
          <p className={`font-medium ${tone(r.status)}`}>{EMAIL_STATUS_LABEL[r.status as EmailStatus] ?? "Desconhecido"}</p>
          <dl className="grid grid-cols-1 gap-x-4 text-sm text-muted-foreground sm:grid-cols-3">
            <div><dt className="inline font-medium">Solicitado: </dt><dd className="inline">{fmtDateTime(r.requestedAt)}</dd></div>
            <div><dt className="inline font-medium">Enviado: </dt><dd className="inline">{fmtDateTime(r.sentAt)}</dd></div>
            <div><dt className="inline font-medium">Atualizado pelo provedor: </dt><dd className="inline">{fmtDateTime(r.providerUpdatedAt)}</dd></div>
          </dl>
          {r.error && <p className="text-sm text-destructive">Motivo: {r.error}</p>}
          {refresh && r.hasProviderId && r.status !== "delivered" && (
            <form action={refresh}>
              <input type="hidden" name="id" value={r.id} />
              <Button type="submit" variant="outline" className="mt-1 h-11 text-base">Atualizar status</Button>
            </form>
          )}
        </li>
      ))}
    </ul>
  );
}
