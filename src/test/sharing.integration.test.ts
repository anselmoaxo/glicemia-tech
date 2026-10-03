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
// A = adulto titular; C, E, F = convidados; D = estranho; M = menor; G = responsável de M; H = acompanhante de M
const A = mk("a");
const C = mk("c");
const D = mk("d");
const E = mk("e");
const F = mk("f");
const M = mk("m");
const G = mk("g");
const H = mk("h");
const ALL = [A, C, D, E, F, M, G, H];

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
const tokenOf = (link?: string) => link!.split("/convite/")[1];

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
async function invite(actor: TestUser, owner: TestUser, email: string, modules: string[]) {
  const { inviteFamily } = await import("@/app/(app)/compartilhar/actions");
  as(actor);
  return inviteFamily(owner.id, {}, form({ email, modules }));
}
async function accept(user: TestUser, token: string) {
  const { acceptInvite } = await import("@/app/convite/[token]/actions");
  as(user);
  return acceptInvite(token);
}

describe.skipIf(!enabled)("compartilhamento: regras de negócio com banco", () => {
  beforeAll(async () => {
    const { db } = await import("@/db");
    const { users, profiles, glucoseReadings, meals, appSettings } = await import("@/db/schema");
    await db.insert(users).values(ALL.map(({ id, name, email, emailVerified }) => ({ id, name, email, emailVerified })));
    await db.insert(profiles).values([
      { userId: A.id, birthDate: "1980-01-01" },
      { userId: M.id, birthDate: "2012-06-01", guardianConsentAt: null },
      { userId: G.id, birthDate: "1982-01-01" },
    ]);
    await db.insert(glucoseReadings).values({ userId: A.id, valueMgDl: 130, measuredAt: new Date(), contextKey: "jejum" });
    await db.insert(meals).values({ userId: A.id, mealType: "almoco", eatenAt: new Date(), description: "Arroz e feijão" });
    // limite padrão (2) para o teste não depender do valor deixado por outra execução
    await db.insert(appSettings).values({ key: "max_companions", value: 2 }).onConflictDoUpdate({ target: appSettings.key, set: { value: 2 } });
  });

  afterAll(async () => {
    const { db } = await import("@/db");
    const { users, appSettings } = await import("@/db/schema");
    const { eq, inArray } = await import("drizzle-orm");
    await db.delete(users).where(inArray(users.id, ALL.map((u) => u.id))); // cascade limpa o resto
    await db.update(appSettings).set({ value: 2 }).where(eq(appSettings.key, "max_companions"));
  });

  it("convite fica pendente e não dá acesso até ser aceito pelo próprio convidado", async () => {
    const r = await invite(A, A, C.email, ["glucose", "reports"]);
    expect(r.ok).toBe(true);
    expect(r.link).toMatch(/\/convite\//); // sem e-mail configurado o link aparece só para quem convidou
    expect((await memberOf(A.id, C.email)).status).toBe("pending");
    expect(await modulesOf(C, A)).toEqual([]);

    // conhecer o link não basta: outra conta (e-mail diferente) não aceita
    await expectRedirect(accept(D, tokenOf(r.link)), /erro=1/);
    expect((await memberOf(A.id, C.email)).status).toBe("pending");

    await expectRedirect(accept(C, tokenOf(r.link)), new RegExp(`/familia/${A.id}`));
    expect((await memberOf(A.id, C.email)).status).toBe("accepted");
    expect(await modulesOf(C, A)).toEqual(["glucose", "reports"]);
    expect(await events(A.id)).toEqual(expect.arrayContaining(["invite", "accept"]));

    // convite é de uso único
    await expectRedirect(accept(C, tokenOf(r.link)), /erro=1/);
  });

  it("com envio de e-mail ligado, o aceite exige o e-mail confirmado", async () => {
    const unverified = { ...E, emailVerified: false };
    const r = await invite(A, A, E.email, ["glucose"]);
    process.env.RESEND_API_KEY = "re_teste";
    try {
      await expectRedirect(accept(unverified, tokenOf(r.link)), /erro=1/);
      await expectRedirect(accept(E, tokenOf(r.link)), /familia/);
    } finally {
      delete process.env.RESEND_API_KEY;
    }
    expect(await modulesOf(E, A)).toEqual(["glucose"]);
  });

  it("reconvidar quem já tem acesso não derruba o acesso; mudar permissões não exige novo convite", async () => {
    const again = await invite(A, A, C.email, ["meals"]);
    expect(again.error).toMatch(/já tem acesso/);
    expect((await memberOf(A.id, C.email)).status).toBe("accepted");

    const { updatePermissions } = await import("@/app/(app)/compartilhar/actions");
    as(A);
    const member = await memberOf(A.id, C.email);
    expect(await updatePermissions(A.id, {}, form({ id: member.id, modules: ["glucose", "meals", "reports"] }))).toEqual({ ok: true });
    expect(await modulesOf(C, A)).toEqual(["glucose", "meals", "reports"]);
    expect((await memberOf(A.id, C.email)).status).toBe("accepted");
    expect(await events(A.id)).toContain("permissions_change");
  });

  it("limite configurável: padrão 2; o administrador amplia sem mudar o código; convite expirado libera a vaga", async () => {
    // A já tem C e E (2 de 2)
    const blocked = await invite(A, A, F.email, ["glucose"]);
    expect(blocked.error).toMatch(/Limite de 2/);

    const { setMaxCompanions } = await import("@/lib/settings");
    await setMaxCompanions(3, A.id);
    const ok = await invite(A, A, F.email, ["glucose"]);
    expect(ok.ok).toBe(true);

    // convite expirado não pode ser aceito e não ocupa vaga
    const { db } = await import("@/db");
    const { familyMembers } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const f = await memberOf(A.id, F.email);
    await db.update(familyMembers).set({ inviteExpiresAt: new Date(Date.now() - 1000) }).where(eq(familyMembers.id, f.id));
    await expectRedirect(accept(F, tokenOf(ok.link)), /erro=1/);
    await setMaxCompanions(2, A.id);
    const { occupiesSlot } = await import("@/lib/sharing/rules");
    const { listFamilyMembers } = await import("@/lib/sharing/queries");
    expect((await listFamilyMembers(A.id)).filter((m) => occupiesSlot(m))).toHaveLength(2);
  });

  it("cancelar convite pendente e revogar acesso ativo, com histórico", async () => {
    const { revokeFamilyMember } = await import("@/app/(app)/compartilhar/actions");
    const f = await memberOf(A.id, F.email);
    as(A);
    await revokeFamilyMember(A.id, form({ id: f.id }));
    expect((await memberOf(A.id, F.email)).status).toBe("revoked");

    const e = await memberOf(A.id, E.email);
    await revokeFamilyMember(A.id, form({ id: e.id }));
    expect(await modulesOf(E, A)).toEqual([]);
    expect((await memberOf(A.id, E.email)).revokedAt).not.toBeNull();
    expect(await events(A.id)).toEqual(expect.arrayContaining(["invite_cancel", "revoke"]));
  });

  it("acompanhante não administra o compartilhamento, não repassa acesso e não edita registros", async () => {
    const { createInvite, getSharingContext, revokeMember, updateMemberModules } = await import("@/lib/sharing/manage");
    const c = await memberOf(A.id, C.email);
    expect(await getSharingContext(C.id, A.id)).toBeNull();
    expect((await createInvite(C, A.id, { email: D.email, modules: ["glucose"] })).ok).toBe(false);
    expect((await updateMemberModules(C.id, A.id, c.id, ["glucose", "insulin"])).ok).toBe(false);
    expect((await revokeMember(C.id, A.id, c.id)).ok).toBe(false);
    expect(await modulesOf(C, A)).toEqual(["glucose", "meals", "reports"]);

    // estranho que conhece o id do titular não lê nada
    expect(await modulesOf(D, A)).toEqual([]);

    // ações de registro sempre usam o usuário da sessão: o acompanhante não apaga a medição do titular
    const { db } = await import("@/db");
    const { glucoseReadings } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const [reading] = await db.select({ id: glucoseReadings.id }).from(glucoseReadings).where(eq(glucoseReadings.userId, A.id));
    const { deleteReading } = await import("@/app/(app)/glicemia/actions");
    as(C);
    await deleteReading(form({ id: reading.id })).catch(() => {});
    expect(await db.select().from(glucoseReadings).where(eq(glucoseReadings.id, reading.id))).toHaveLength(1);
  });

  it("relatório do acompanhante traz só os módulos liberados", async () => {
    const { getReportData } = await import("@/lib/reports/data");
    const { buildRange } = await import("@/lib/reports/range");
    const { reportSections } = await import("@/lib/sharing/rules");
    const { getAccessibleModules } = await import("@/lib/sharing/access");
    const range = buildRange("2000-01-01", "2100-01-01", "America/Sao_Paulo");

    const { updatePermissions } = await import("@/app/(app)/compartilhar/actions");
    as(A);
    await updatePermissions(A.id, {}, form({ id: (await memberOf(A.id, C.email)).id, modules: ["glucose", "reports"] }));
    const forC = await getReportData(A.id, range, reportSections(await getAccessibleModules(C.id, A.id)));
    expect(forC.readings).toHaveLength(1);
    expect(forC.meals).toHaveLength(0);

    const forOwner = await getReportData(A.id, range);
    expect(forOwner.meals).toHaveLength(1);
  });

  it("menor: responsável confirma, administra o compartilhamento e o plano; o menor não amplia sozinho", async () => {
    const { db } = await import("@/db");
    const { guardianRequests } = await import("@/db/schema");
    const { generateToken } = await import("@/lib/sharing/tokens");
    const { confirmGuardian } = await import("@/app/responsavel/actions");
    const { token, hash } = generateToken();
    await db.insert(guardianRequests).values({ minorId: M.id, guardianEmail: G.email, tokenHash: hash, expiresAt: new Date(Date.now() + 86_400_000) });

    // um familiar qualquer (outro e-mail) não vira responsável
    as(H);
    await expectRedirect(confirmGuardian(token, form({ declaro: "on" })), /erro=1/);
    as(G);
    await expectRedirect(confirmGuardian(token, form({ declaro: "on" })), /familia/);
    const g = await memberOf(M.id, G.email);
    expect([g.status, g.role]).toEqual(["accepted", "guardian"]);
    expect(await events(M.id)).toContain("guardian_confirm");

    // o menor não convida
    const byMinor = await invite(M, M, H.email, ["glucose"]);
    expect(byMinor.error).toMatch(/responsável legal/);

    // o responsável convida um acompanhante para o menor
    const byGuardian = await invite(G, M, H.email, ["glucose"]);
    expect(byGuardian.ok).toBe(true);
    await expectRedirect(accept(H, tokenOf(byGuardian.link)), /familia/);
    expect(await modulesOf(H, M)).toEqual(["glucose"]);

    const { canManagePlan } = await import("@/lib/tracking/plan");
    expect(await canManagePlan(G.id, M.id)).toBe(true);
    expect(await canManagePlan(H.id, M.id)).toBe(false); // acompanhante não é responsável

    // o menor revoga o acompanhante, mas não o responsável
    const { revokeMember } = await import("@/lib/sharing/manage");
    expect((await revokeMember(M.id, M.id, g.id)).ok).toBe(false);
    expect((await revokeMember(G.id, M.id, g.id)).ok).toBe(false);
    expect((await revokeMember(M.id, M.id, (await memberOf(M.id, H.email)).id)).ok).toBe(true);
    expect(await modulesOf(H, M)).toEqual([]);
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

  it("alertas por e-mail não vão para familiar suspenso nem saem de titular suspenso", async () => {
    const { listGlucoseFamilyEmails } = await import("@/lib/sharing/queries");
    expect(await listGlucoseFamilyEmails(A.id)).toEqual([C.email]);
    const { db } = await import("@/db");
    const { users } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    await db.update(users).set({ suspendedAt: new Date() }).where(eq(users.id, C.id));
    expect(await listGlucoseFamilyEmails(A.id)).toEqual([]);
    await db.update(users).set({ suspendedAt: null }).where(eq(users.id, C.id));
    // titular suspenso: nenhum familiar recebe aviso
    await db.update(users).set({ suspendedAt: new Date() }).where(eq(users.id, A.id));
    expect(await listGlucoseFamilyEmails(A.id)).toEqual([]);
    await db.update(users).set({ suspendedAt: null }).where(eq(users.id, A.id));
    expect(await listGlucoseFamilyEmails(A.id)).toEqual([C.email]);
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
