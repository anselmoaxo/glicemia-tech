import { timingSafeEqual } from "node:crypto";
import { and, eq, isNull, ne, or } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { reminders, users } from "@/db/schema";
import { isDue } from "@/lib/alerts/reminders";
import { sendEmail } from "@/lib/email";
import { emailEnabled } from "@/lib/email-flags";
import { reminderEmail } from "@/lib/email-templates";
import { dateToLocalInputs } from "@/lib/datetime";
import { env } from "@/lib/env";
import { runPlanChecks } from "@/lib/tracking/checks";
import { processDueDeliveries } from "@/lib/webhooks/service";

// Chamado por um agendador (a cada 10–15 min) com `Authorization: Bearer <CRON_SECRET>`.
// A Vercel envia esse cabeçalho sozinha quando CRON_SECRET existe e há um cron configurado.
export const dynamic = "force-dynamic";

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const wanted = Buffer.from(`Bearer ${secret}`);
  return given.length === wanted.length && timingSafeEqual(given, wanted);
}

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  if (!authorized(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const now = new Date();
  const rows = await db
    .select({
      id: reminders.id,
      userId: users.id,
      email: users.email,
      timeLocal: reminders.timeLocal,
      daysMask: reminders.daysMask,
      timezone: reminders.timezone,
      enabled: reminders.enabled,
      lastSentOn: reminders.lastSentOn,
    })
    .from(reminders)
    .innerJoin(users, eq(users.id, reminders.userId))
    .where(and(eq(reminders.enabled, true), isNull(users.suspendedAt)));

  let sent = 0;
  for (const r of emailEnabled() ? rows : []) {
    if (!isDue(r, now)) continue;
    const today = dateToLocalInputs(now, r.timezone).date;
    // reserva o envio do dia antes de mandar: duas chamadas seguidas não duplicam
    const claimed = await db
      .update(reminders)
      .set({ lastSentOn: today })
      .where(and(eq(reminders.id, r.id), or(isNull(reminders.lastSentOn), ne(reminders.lastSentOn, today))))
      .returning({ id: reminders.id });
    if (claimed.length === 0) continue;
    const mail = reminderEmail({ appUrl: env.BETTER_AUTH_URL });
    if (await sendEmail(r.email, mail.subject, mail.html, mail.text, { userId: r.userId, category: "lembrete_medicao", reason: "Lembrete de medição agendado", idempotencyKey: `reminder-${r.id}-${today}` })) sent++;
  }

  // verificações do plano (medição prevista sem registro, medicamento sem confirmação) e reenvio de webhooks pendentes
  const planEvents = await runPlanChecks(now);
  const webhooks = await processDueDeliveries();
  return NextResponse.json({ sent, planEvents, webhooks });
}
