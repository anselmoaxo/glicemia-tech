import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/db";
import { emailLogs } from "@/db/schema";
import type { EmailStatus } from "@/lib/email-categories";
import { shouldUpdate, statusFromEvent } from "@/lib/email-status";

export const runtime = "nodejs";

// Recebe os eventos de entrega do Resend (Webhooks > Add endpoint > este endereço).
// Sem RESEND_WEBHOOK_SECRET a rota fica desligada. A assinatura é conferida antes de qualquer leitura do corpo.
export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return new Response(null, { status: 503 });

  const payload = await request.text();
  if (payload.length > 100_000) return new Response(null, { status: 413 });

  let event;
  try {
    event = new Resend(process.env.RESEND_API_KEY ?? "re_unused").webhooks.verify({
      payload,
      headers: {
        id: request.headers.get("svix-id") ?? "",
        timestamp: request.headers.get("svix-timestamp") ?? "",
        signature: request.headers.get("svix-signature") ?? "",
      },
      webhookSecret: secret,
    });
  } catch {
    return new Response(null, { status: 401 });
  }

  const next = statusFromEvent(event.type);
  const emailId = (event.data as { email_id?: string }).email_id;
  if (!next || !emailId) return new Response(null, { status: 200 });

  const [row] = await db.select({ id: emailLogs.id, status: emailLogs.status }).from(emailLogs).where(eq(emailLogs.providerId, emailId));
  if (row && shouldUpdate(row.status as EmailStatus, next)) {
    await db
      .update(emailLogs)
      .set({ status: next, providerUpdatedAt: new Date(event.created_at) })
      .where(eq(emailLogs.id, row.id));
  }
  return new Response(null, { status: 200 });
}
