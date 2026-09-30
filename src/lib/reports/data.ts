import "server-only";
import { and, asc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import {
  glucoseContexts,
  glucoseReadings,
  insulinLogs,
  insulinTypes,
  meals,
  medicationLogs,
  profiles,
  medications,
  users,
} from "@/db/schema";
import { classify, type GlucoseStatus } from "@/lib/glucose/classify";
import { contextLabel } from "@/lib/glucose/contexts";
import { getTargets } from "@/lib/glucose/queries";
import { getTimezone } from "@/lib/profile";
import { describePatient } from "@/lib/profile-utils";
import { computeStats } from "./stats";
import type { ReportRange } from "./range";

// Limites de linhas por seção (proteção de memória/tamanho do PDF).
const LIMIT = { readings: 2000, meals: 500, medications: 1500, insulin: 1000 };

export type ReportData = Awaited<ReturnType<typeof getReportData>>;

/** Reúne tudo que o relatório mostra. Sempre filtrado por userId. */
export async function getReportData(userId: string, range: ReportRange) {
  const { from, to } = range;
  const [tz, [owner], targets, [profile]] = await Promise.all([
    getTimezone(userId),
    db.select({ name: users.name }).from(users).where(eq(users.id, userId)),
    getTargets(userId),
    db
      .select({
        birthDate: profiles.birthDate,
        sex: profiles.sex,
        diabetesType: profiles.diabetesType,
        diagnosisYear: profiles.diagnosisYear,
      })
      .from(profiles)
      .where(eq(profiles.userId, userId)),
  ]);

  const [readingRows, mealRows, medRows, insulinRows] = await Promise.all([
    db
      .select({
        value: glucoseReadings.valueMgDl,
        measuredAt: glucoseReadings.measuredAt,
        contextKey: glucoseReadings.contextKey,
        customLabel: glucoseContexts.label,
        notes: glucoseReadings.notes,
        symptoms: glucoseReadings.symptoms,
        activity: glucoseReadings.activity,
      })
      .from(glucoseReadings)
      .leftJoin(glucoseContexts, eq(glucoseReadings.customContextId, glucoseContexts.id))
      .where(and(eq(glucoseReadings.userId, userId), gte(glucoseReadings.measuredAt, from), lt(glucoseReadings.measuredAt, to)))
      .orderBy(asc(glucoseReadings.measuredAt))
      .limit(LIMIT.readings),
    db
      .select({ mealType: meals.mealType, customType: meals.customType, eatenAt: meals.eatenAt, description: meals.description })
      .from(meals)
      .where(and(eq(meals.userId, userId), gte(meals.eatenAt, from), lt(meals.eatenAt, to)))
      .orderBy(asc(meals.eatenAt))
      .limit(LIMIT.meals),
    db
      .select({
        name: medications.name,
        dose: medications.dose,
        unit: medications.unit,
        scheduledFor: medicationLogs.scheduledFor,
        status: medicationLogs.status,
      })
      .from(medicationLogs)
      .innerJoin(medications, eq(medicationLogs.medicationId, medications.id))
      .where(and(eq(medicationLogs.userId, userId), gte(medicationLogs.scheduledFor, from), lt(medicationLogs.scheduledFor, to)))
      .orderBy(asc(medicationLogs.scheduledFor))
      .limit(LIMIT.medications),
    db
      .select({
        units: insulinLogs.units,
        appliedAt: insulinLogs.appliedAt,
        mealRelation: insulinLogs.mealRelation,
        site: insulinLogs.site,
        notes: insulinLogs.notes,
        typeName: insulinTypes.name,
      })
      .from(insulinLogs)
      .innerJoin(insulinTypes, eq(insulinLogs.insulinTypeId, insulinTypes.id))
      .where(and(eq(insulinLogs.userId, userId), gte(insulinLogs.appliedAt, from), lt(insulinLogs.appliedAt, to)))
      .orderBy(asc(insulinLogs.appliedAt))
      .limit(LIMIT.insulin),
  ]);

  const readings = readingRows.map((r) => ({
    ...r,
    context: contextLabel(r.contextKey, r.customLabel),
    status: classify(r.value, r.contextKey, targets) as GlucoseStatus,
  }));

  return {
    ownerName: owner?.name ?? "Usuário",
    patientSummary: profile ? describePatient(profile) : "",
    timezone: tz,
    range,
    targets,
    stats: computeStats(readings.map((r) => r.value)),
    readings,
    meals: mealRows,
    medications: medRows,
    insulin: insulinRows,
  };
}
