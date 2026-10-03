import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Teste de integração das regras de compartilhamento, com um banco de TESTE (migrations aplicadas).
//   Neon de teste:      TEST_DATABASE_URL=postgresql://... npm test
//   Postgres local:     TEST_LOCAL_PG_URL=postgres://postgres@localhost:5432/teste npm test
// Nunca aponte para o banco de produção: o teste cria e apaga usuários próprios.
const neonUrl = process.env.TEST_DATABASE_URL;
const localUrl = process.env.TEST_LOCAL_PG_URL;
const enabled = Boolean(neonUrl || localUrl);
if (neonUrl) process.env.DATABASE_URL = neonUrl;
if (localUrl) process.env.DATABASE_URL ??= localUrl;
process.env.BETTER_AUTH_SECRET ??= "teste-teste-teste-teste-teste-teste-0";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";

type TestUser = { id: string; name: string; email: string; emailVerified: boolean; suspendedAt: null };
const session = vi.hoisted(() => ({ user: null as TestUser | null }));

vi.mock("@/db", async (importOriginal) => {
  const url = process.env.TEST_LOCAL_PG_URL;
  if (!url || process.env.TEST_DATABASE_URL) return importOriginal();
  const { createLocalDb } = await import("./local-db");
  return { db: createLocalDb(url) };
});
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("@/lib/email", () => ({ sendEmail: async () => false }));
vi.mock("@/lib/session", () => ({
  requireUser: async () => {
    if (!session.user) throw new Error("REDIRECT:/login");
    return session.user;
  },
  getSession: async () => (session.user ? { user: session.user } : null),
}));

const stamp = Date.now();
const mk = (key: string, verified = true): TestUser => ({
  id: `it-${key}-${stamp}`,
  name: key.toUpperCase(),
  email: `${key}-${stamp}@test.local`,
  emailVerified: verified,
  suspendedAt: null,
});
// A = adulto titular; C = acompanhante antigo de A (convite de antes da retirada); D = estranho;
// M = menor; G = responsável de M; H = outra pessoa que tenta virar responsável
const A = mk("a");
const C = mk("c");
const D = mk("d");
const M = mk("m");
const G = mk("g");
const H = mk("h");
const ALL = [A, C, D, M, G, H];

const as = (u: TestUser) => {
  session.user = u;
};
const form = (entries: Record<string, string | string[]>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) for (const x of [v].flat()) fd.append(k, x);
  return fd;
};
const expectRedirect = async (p: Promise<unknown>, to: RegExp) => {
  await expect(p).rejects.toThrow(to);
};

async function memberOf(ownerId: string, email: string) {
  const { db } = await import("@/db");
  const { familyMembers } = await import("@/db/schema");
  const { and, eq } = await import("drizzle-orm");
  const [row] = await db.select().from(familyMembers).where(and(eq(familyMembers.ownerId, ownerId), eq(familyMembers.email, email)));
  return row;
}
async function events(ownerId: string) {
  const { listSharingEvents } = await import("@/lib/sharing/audit");
  return (await listSharingEvents(ownerId, 100)).map((e) => e.action);
}
async function modulesOf(viewer: TestUser, owner: TestUser) {
  const { getAccessibleModules } = await import("@/lib/sharing/access");
  return [...(await getAccessibleModules(viewer.id, owner.id))].sort();
}

describe.skipIf(!enabled)("compartilhamento: só o responsável legal de menores, com banco", () => {
  beforeAll(async () => {
    const { db } = await import("@/db");
    const { users, profiles, glucoseReadings, familyMembers, sharingPermissions } = await import("@/db/schema");
    const { hashToken } = await import("@/lib/sharing/tokens");
    await db.insert(users).values(ALL.map(({ id, name, email, emailVerified }) => ({ id, name, email, emailVerified })));
    await db.insert(profiles).values([
      { userId: A.id, birthDate: "1980-01-01" },
      { userId: M.id, birthDate: "2012-06-01", guardianConsentAt: null },
      { userId: G.id, birthDate: "1982-01-01" },
    ]);
    await db.insert(glucoseReadings).values({ userId: A.id, valueMgDl: 130, measuredAt: new Date(), contextKey: "jejum" });
    // vínculo de acompanhante criado antes da retirada do convite (aceito, com glicemia liberada)
    const id = crypto.randomUUID();
    await db.insert(familyMembers).values({
      id,
      ownerId: A.id,
      email: C.email,
      memberUserId: C.id,
      status: "accepted",
      role: "companion",
      acceptedAt: new Date(),
      tokenHash: hashToken(`legado-${stamp}`),
      inviteExpiresAt: new Date(),
    });
    await db.insert(sharingPermissions).values([{ familyMemberId: id, module: "glucose" }, { familyMemberId: id, module: "reports" }]);
  });

  afterAll(async () => {
    const { db } = await import("@/db");
    const { users } = await import("@/db/schema");
    const { inArray } = await import("drizzle-orm");
    await db.delete(users).where(inArray(users.id, ALL.map((u) => u.id))); // cascade limpa o resto
  });

  it("acompanhante antigo não lê nada, não aparece como acompanhado e não recebe alertas", async () => {
    expect(await modulesOf(C, A)).toEqual([]);
    const { listGlucoseFamilyEmails, listSharedWithMe } = await import("@/lib/sharing/queries");
    expect(await listSharedWithMe(C.id)).toEqual([]);
    expect(await listGlucoseFamilyEmails(A.id)).toEqual([]);
    const { getSharingContext } = await import("@/lib/sharing/manage");
    expect(await getSharingContext(C.id, A.id)).toBeNull();
    // estranho que conhece o id do titular também não lê nada
    expect(await modulesOf(D, A)).toEqual([]);
  });

  it("ações de registro sempre usam o usuário da sessão: outra conta não apaga a medição do titular", async () => {
    const { db } = await import("@/db");
    const { glucoseReadings } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const [reading] = await db.select({ id: glucoseReadings.id }).from(glucoseReadings).where(eq(glucoseReadings.userId, A.id));
    const { deleteReading } = await import("@/app/(app)/glicemia/actions");
    as(C);
    await deleteReading(form({ id: reading.id })).catch(() => {});
    expect(await db.select().from(glucoseReadings).where(eq(glucoseReadings.id, reading.id))).toHaveLength(1);
  });

  it("menor: responsável confirma, vê tudo, configura o plano e recebe alertas; o menor não o revoga", async () => {
    const { db } = await import("@/db");
    const { guardianRequests } = await import("@/db/schema");
    const { generateToken } = await import("@/lib/sharing/tokens");
    const { confirmGuardian } = await import("@/app/responsavel/actions");
    const { token, hash } = generateToken();
    await db.insert(guardianRequests).values({ minorId: M.id, guardianEmail: G.email, tokenHash: hash, expiresAt: new Date(Date.now() + 86_400_000) });

    // outra pessoa (outro e-mail) não vira responsável
    as(H);
    await expectRedirect(confirmGuardian(token, form({ declaro: "on" })), /erro=1/);
    as(G);
    await expectRedirect(confirmGuardian(token, form({ declaro: "on" })), /familia/);
    const g = await memberOf(M.id, G.email);
    expect([g.status, g.role]).toEqual(["accepted", "guardian"]);
    expect(await events(M.id)).toContain("guardian_confirm");
    expect(await modulesOf(G, M)).toEqual(["glucose", "insulin", "meals", "medications", "reports"]);
    expect(await modulesOf(H, M)).toEqual([]);

    const { listGlucoseFamilyEmails, listSharedWithMe } = await import("@/lib/sharing/queries");
    expect((await listSharedWithMe(G.id)).map((o) => o.ownerId)).toEqual([M.id]);
    expect(await listGlucoseFamilyEmails(M.id)).toEqual([G.email]);

    const { canManagePlan } = await import("@/lib/tracking/plan");
    expect(await canManagePlan(G.id, M.id)).toBe(true);
    expect(await canManagePlan(H.id, M.id)).toBe(false);

    const { revokeMember } = await import("@/lib/sharing/manage");
    expect((await revokeMember(M.id, M.id, g.id)).ok).toBe(false);
    expect((await revokeMember(G.id, M.id, g.id)).ok).toBe(false);
  });

  it("alertas por e-mail não vão para responsável suspenso nem saem de titular suspenso", async () => {
    const { listGlucoseFamilyEmails } = await import("@/lib/sharing/queries");
    const { db } = await import("@/db");
    const { users } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    await db.update(users).set({ suspendedAt: new Date() }).where(eq(users.id, G.id));
    expect(await listGlucoseFamilyEmails(M.id)).toEqual([]);
    await db.update(users).set({ suspendedAt: null }).where(eq(users.id, G.id));
    await db.update(users).set({ suspendedAt: new Date() }).where(eq(users.id, M.id));
    expect(await listGlucoseFamilyEmails(M.id)).toEqual([]);
    await db.update(users).set({ suspendedAt: null }).where(eq(users.id, M.id));
    expect(await listGlucoseFamilyEmails(M.id)).toEqual([G.email]);
  });

  it("menor com responsável não muda a própria data de nascimento para virar adulto", async () => {
    const { updateProfile } = await import("@/app/(app)/perfil/actions");
    as(M);
    const r = await updateProfile({}, form({ name: "Menor", birthDate: "1990-01-01", fontScale: "100" }));
    expect(r.error).toMatch(/suporte/);
  });

  it("maioridade: o responsável perde a administração e a pessoa pode revisar e revogar", async () => {
    const { db } = await import("@/db");
    const { profiles } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    await db.update(profiles).set({ birthDate: "2000-01-01" }).where(eq(profiles.userId, M.id));

    const { canManagePlan } = await import("@/lib/tracking/plan");
    const { getSharingContext, revokeMember } = await import("@/lib/sharing/manage");
    expect(await canManagePlan(G.id, M.id)).toBe(false);
    expect(await getSharingContext(G.id, M.id)).toBeNull();
    expect(await modulesOf(G, M)).not.toEqual([]); // continua lendo até a pessoa decidir

    const { confirmMajorityReview } = await import("@/app/(app)/compartilhar/actions");
    as(M);
    await confirmMajorityReview();
    expect(await events(M.id)).toContain("majority_review");
    expect((await revokeMember(M.id, M.id, (await memberOf(M.id, G.email)).id)).ok).toBe(true);
    expect(await modulesOf(G, M)).toEqual([]);
  });

  it("perfil sem diabetes: esconde os controles sem apagar o histórico e pode voltar atrás", async () => {
    const { updateProfile } = await import("@/app/(app)/perfil/actions");
    const { getTrackingContext } = await import("@/lib/tracking/plan");
    const { db } = await import("@/db");
    const { glucoseReadings } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    as(A);
    await updateProfile({}, form({ name: "Adulto", birthDate: "1980-01-01", fontScale: "100", trackingPurpose: "sem_diabetes" }));
    expect((await getTrackingContext(A.id)).diabetesVisible).toBe(false);
    expect(await db.select().from(glucoseReadings).where(eq(glucoseReadings.userId, A.id))).toHaveLength(1);
    await updateProfile({}, form({ name: "Adulto", birthDate: "1980-01-01", fontScale: "100", trackingPurpose: "diabetes" }));
    expect((await getTrackingContext(A.id)).diabetesVisible).toBe(true);
  });
});
