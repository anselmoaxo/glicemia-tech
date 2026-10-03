import Link from "next/link";
import { revalidatePath } from "next/cache";
import { EmailHistoryList } from "@/components/email-history-list";
import { requireAdmin } from "@/lib/admin";
import { EMAIL_STATUS_LABEL, type EmailStatus } from "@/lib/email-categories";
import { emailStats, listAllEmails, refreshEmailStatus } from "@/lib/email-history";
import { uuidSchema } from "@/lib/glucose/validation";

export const metadata = { title: "E-mails (visão técnica)" };

async function refresh(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = uuidSchema.safeParse(formData.get("id"));
  if (id.success) await refreshEmailStatus(id.data);
  revalidatePath("/admin/emails");
}

export default async function AdminEmailsPage({ searchParams }: PageProps<"/admin/emails">) {
  await requireAdmin();
  const page = Math.max(1, Number.parseInt(String((await searchParams).pagina ?? "1"), 10) || 1);
  const [{ items, hasMore }, stats] = await Promise.all([listAllEmails(page), emailStats()]);
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">E-mails (visão técnica)</h1>
      <p className="text-base text-muted-foreground">
        Só metadados: tipo, motivo, destinatário mascarado, horários e status do provedor. O conteúdo das mensagens e dados de saúde não
        são guardados. Para receber &ldquo;entregue&rdquo;, &ldquo;rejeitado&rdquo; e &ldquo;atrasado&rdquo; automaticamente, configure o webhook do Resend
        (<code>/api/webhooks/resend</code> e <code>RESEND_WEBHOOK_SECRET</code>).
      </p>
      <ul className="flex flex-wrap gap-2 text-base">
        {stats.map((s) => (
          <li key={s.status} className="rounded-full border bg-card px-3 py-1">
            {EMAIL_STATUS_LABEL[s.status as EmailStatus] ?? s.status}: <strong>{s.n}</strong>
          </li>
        ))}
        {stats.length === 0 && <li className="text-muted-foreground">Nenhum envio nos últimos 7 dias.</li>}
      </ul>
      <EmailHistoryList rows={items} refresh={refresh} />
      <nav aria-label="Paginação" className="flex justify-between gap-3">
        {page > 1 ? <Link href={`/admin/emails?pagina=${page - 1}`} className="flex min-h-12 items-center px-3 text-base underline underline-offset-4">← Anteriores</Link> : <span />}
        {hasMore && <Link href={`/admin/emails?pagina=${page + 1}`} className="flex min-h-12 items-center px-3 text-base underline underline-offset-4">Próximos →</Link>}
      </nav>
    </section>
  );
}
