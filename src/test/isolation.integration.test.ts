import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Teste de integração: roda só com um banco de TESTE configurado (migrations aplicadas).
//   TEST_DATABASE_URL=postgresql://... npm test          (Neon)
//   TEST_LOCAL_PG_URL=postgres://... npm test            (Postgres local)
// Nunca aponte para o banco de produção: o teste cria e apaga usuários próprios.
const url = process.env.TEST_DATABASE_URL ?? process.env.TEST_LOCAL_PG_URL;
if (url) process.env.DATABASE_URL = url;

vi.mock("@/db", async (importOriginal) => {
  const local = process.env.TEST_LOCAL_PG_URL;
  if (!local || process.env.TEST_DATABASE_URL) return importOriginal();
  const { createLocalDb } = await import("./local-db");
  return { db: createLocalDb(local) };
});

vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));

describe.skipIf(!url)("isolamento entre usuários", () => {
  const a = `test-a-${Date.now()}`;
  const b = `test-b-${Date.now()}`;
  let readingId: string;
  let memberId: string;

  beforeAll(async () => {
    const { db } = await import("@/db");
    const { users, glucoseReadings, familyMembers } = await import("@/db/schema");
    await db.insert(users).values([
      { id: a, name: "A", email: `${a}@test.local` },
      { id: b, name: "B", email: `${b}@test.local` },
    ]);
    const [r] = await db
      .insert(glucoseReadings)
      .values({ userId: a, valueMgDl: 120, measuredAt: new Date(), contextKey: "jejum" })
      .returning({ id: glucoseReadings.id });
    readingId = r.id;
    memberId = crypto.randomUUID();
    await db.insert(familyMembers).values({
      id: memberId,
      ownerId: a,
      email: `${b}@test.local`,
      memberUserId: b,
      status: "pending",
      tokenHash: `hash-${a}`,
      inviteExpiresAt: new Date(Date.now() + 86_400_000),
    });
  });

  afterAll(async () => {
    const { db } = await import("@/db");
    const { users } = await import("@/db/schema");
    const { inArray } = await import("drizzle-orm");
    await db.delete(users).where(inArray(users.id, [a, b])); // cascade limpa o resto
  });

  it("outro usuário não lê nem lista registros alheios", async () => {
    const { getReading, listReadings } = await import("@/lib/glucose/queries");
    expect(await getReading(b, readingId)).toBeNull();
    expect((await listReadings(b, 1)).items).toHaveLength(0);
    expect(await getReading(a, readingId)).not.toBeNull();
  });

  it("só o responsável legal aceito acessa; acompanhante (convite antigo) não lê nada", async () => {
    const { db } = await import("@/db");
    const { familyMembers, sharingPermissions } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const { getAccessibleModules } = await import("@/lib/sharing/access");

    await db.insert(sharingPermissions).values({ familyMemberId: memberId, module: "glucose" });
    expect((await getAccessibleModules(b, a)).size).toBe(0); // convite ainda pendente

    await db.update(familyMembers).set({ status: "accepted" }).where(eq(familyMembers.id, memberId));
    expect((await getAccessibleModules(b, a)).size).toBe(0); // acompanhante: função retirada

    await db.update(familyMembers).set({ role: "guardian" }).where(eq(familyMembers.id, memberId));
    const modules = await getAccessibleModules(b, a);
    expect(modules.has("glucose")).toBe(true);
    expect(modules.has("insulin")).toBe(false);

    await db.update(familyMembers).set({ status: "revoked" }).where(eq(familyMembers.id, memberId));
    expect((await getAccessibleModules(b, a)).size).toBe(0); // revogado
    expect((await getAccessibleModules(a, b)).size).toBe(0); // sem vínculo no sentido inverso
  });

  it("familiar comum não edita o plano de acompanhamento nem webhook de outro perfil", async () => {
    const { canManagePlan } = await import("@/lib/tracking/plan");
    expect(await canManagePlan(a, a)).toBe(true); // a própria pessoa
    expect(await canManagePlan(b, a)).toBe(false); // outro usuário (mesmo vinculado como familiar) não edita
  });

  it("evento do plano é registrado uma única vez por ocorrência", async () => {
    const { db } = await import("@/db");
    const { planEvents } = await import("@/db/schema");
    const slotAt = new Date();
    const claim = () =>
      db.insert(planEvents).values({ userId: a, kind: "missed_measurement", slotKey: "measure:teste", slotAt, status: "unconfirmed" }).onConflictDoNothing().returning({ id: planEvents.id });
    expect(await claim()).toHaveLength(1);
    expect(await claim()).toHaveLength(0); // repetir não duplica
  });

  it("entrega de webhook repetida com o mesmo evento não duplica", async () => {
    const { db } = await import("@/db");
    const { webhookDeliveries } = await import("@/db/schema");
    const eventId = crypto.randomUUID();
    const enqueue = () =>
      db.insert(webhookDeliveries).values({ userId: a, eventId, type: "measurement_missed" }).onConflictDoNothing().returning({ id: webhookDeliveries.id });
    expect(await enqueue()).toHaveLength(1);
    expect(await enqueue()).toHaveLength(0);
  });
});
