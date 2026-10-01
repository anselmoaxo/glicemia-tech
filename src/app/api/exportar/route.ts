import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { consentLogs, glucoseReadings, insulinLogs, meals, medicationLogs, medications, profiles } from "@/db/schema";
import { auth } from "@/lib/auth";
import { toCsv } from "@/lib/privacy/csv";

export const runtime = "nodejs";

const HEADERS = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

// Exportação dos dados do PRÓPRIO usuário (o id vem sempre da sessão, nunca de parâmetro).
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || session.user.suspendedAt) return new Response("Não autenticado", { status: 401, headers: HEADERS });
  const userId = session.user.id;
  const formato = request.nextUrl.searchParams.get("formato") === "csv" ? "csv" : "json";

  const readings = await db.select().from(glucoseReadings).where(eq(glucoseReadings.userId, userId));

  if (formato === "csv") {
    const csv = toCsv(
      ["data_hora_utc", "valor_mg_dl", "contexto", "observacoes", "sintomas", "atividade"],
      readings.map((r) => [r.measuredAt, r.valueMgDl, r.contextKey, r.notes, r.symptoms, r.activity]),
    );
    return new Response("﻿" + csv, {
      headers: { ...HEADERS, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="glicemias.csv"' },
    });
  }

  const [profile, mealRows, meds, medLogs, insulin, consents] = await Promise.all([
    db.select().from(profiles).where(eq(profiles.userId, userId)),
    db.select().from(meals).where(eq(meals.userId, userId)),
    db.select().from(medications).where(eq(medications.userId, userId)),
    db.select().from(medicationLogs).where(eq(medicationLogs.userId, userId)),
    db.select().from(insulinLogs).where(eq(insulinLogs.userId, userId)),
    db.select().from(consentLogs).where(eq(consentLogs.userId, userId)),
  ]);

  const body = {
    exportadoEm: new Date().toISOString(),
    conta: { nome: session.user.name, email: session.user.email },
    perfil: profile[0] ?? null,
    glicemias: readings,
    refeicoes: mealRows,
    medicamentos: meds,
    registrosDeMedicamentos: medLogs,
    insulina: insulin,
    consentimentos: consents,
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { ...HEADERS, "Content-Type": "application/json; charset=utf-8", "Content-Disposition": 'attachment; filename="glicose-tech-meus-dados.json"' },
  });
}
