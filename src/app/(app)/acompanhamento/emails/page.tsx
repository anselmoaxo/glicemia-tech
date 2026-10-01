import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { EmailHistoryList } from "@/components/email-history-list";
import { EMAIL_CATEGORIES } from "@/lib/email-categories";
import { listUserEmails, refreshEmailStatus } from "@/lib/email-history";
import { uuidSchema } from "@/lib/glucose/validation";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "E-mails enviados" };

async function refresh(formData: FormData) {
  "use server";
  const user = await requireUser();
  const id = uuidSchema.safeParse(formData.get("id"));
  if (id.success) await refreshEmailStatus(id.data, user.id); // só e-mails do próprio usuário
  revalidatePath("/acompanhamento/emails");
}

export default async function EmailsPage() {
  const user = await requireUser();
  const rows = await listUserEmails(user.id);
  return (
    <section className="flex flex-col gap-6">
      <Link href="/acompanhamento" className="flex min-h-12 items-center text-base underline underline-offset-4">← Configurações de acompanhamento</Link>
      <h1 className="text-3xl font-bold">E-mails enviados</h1>
      <p className="text-base text-muted-foreground">
        Mostramos o tipo, o motivo e o status informado pelo provedor, sem o conteúdo da mensagem. &ldquo;Enviado&rdquo; significa que o
        provedor aceitou a mensagem; só &ldquo;Entregue&rdquo; indica que ela chegou à caixa do destinatário.
      </p>
      <details className="rounded-2xl border bg-card p-4 text-base">
        <summary className="cursor-pointer font-semibold">Quando o app envia e-mail</summary>
        <ul className="mt-2 list-disc pl-6">
          {Object.values(EMAIL_CATEGORIES).map((c) => (
            <li key={c.label}>{c.label} <span className="text-muted-foreground">({c.essential ? "obrigatório" : "opcional, você escolhe"})</span></li>
          ))}
        </ul>
      </details>
      <EmailHistoryList rows={rows} refresh={refresh} />
    </section>
  );
}
