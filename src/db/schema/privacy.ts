import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";

// Foto de perfil (imagem pequena, já validada). Fica no banco e só é servida por rota autenticada.
export const profilePhotos = pgTable(
  "profile_photos",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    contentType: text("content_type").notNull(),
    dataBase64: text("data_base64").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("profile_photos_type_chk", sql`${t.contentType} in ('image/jpeg','image/png','image/webp')`)],
);

// Quem acessou os dados de um titular (familiar vendo o acompanhamento ou baixando relatório).
export const accessLogs = pgTable(
  "access_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    viewerId: text("viewer_id").references(() => users.id, { onDelete: "set null" }),
    resource: text("resource").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("access_logs_owner_idx").on(t.ownerId, t.createdAt.desc()),
    check("access_logs_resource_chk", sql`${t.resource} in ('acompanhamento','relatorio')`),
  ],
);

// Registro de consentimentos (versão do texto aceito e quando).
export const consentLogs = pgTable(
  "consent_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    version: text("version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("consent_logs_user_idx").on(t.userId),
    check("consent_logs_kind_chk", sql`${t.kind} in ('lgpd','guardian')`),
  ],
);

// Solicitações de suporte, privacidade, exportação e exclusão de conta.
export const supportRequests = pgTable(
  "support_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    message: text("message").notNull(),
    status: text("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (t) => [
    index("support_requests_status_idx").on(t.status, t.createdAt.desc()),
    index("support_requests_user_idx").on(t.userId),
    check("support_requests_kind_chk", sql`${t.kind} in ('suporte','privacidade','exclusao','exportacao')`),
    check("support_requests_status_chk", sql`${t.status} in ('open','in_progress','done')`),
  ],
);

// Perfil profissional. Nunca "verificado" por conta própria: não existe processo de validação do registro.
export const professionalProfiles = pgTable(
  "professional_profiles",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    profession: text("profession").notNull(),
    // Conselho (CRM, CRN, CRP, COREN...), UF e número, conferidos manualmente no portal oficial do conselho
    registryCouncil: text("registry_council"),
    registryUf: text("registry_uf"),
    registryNumber: text("registry_number"),
    bio: text("bio"),
    // unverified = sem registro informado; pending = aguardando conferência; verified/rejected = decisão de um administrador
    verificationStatus: text("verification_status").notNull().default("unverified"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    verifiedBy: text("verified_by").references(() => users.id, { onDelete: "set null" }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("professional_profiles_status_chk", sql`${t.verificationStatus} in ('unverified','pending','verified','rejected')`),
  ],
);

// Pedido de confirmação do responsável legal de um menor de 18 anos. O token só é guardado como hash.
export const guardianRequests = pgTable(
  "guardian_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    minorId: text("minor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    guardianEmail: text("guardian_email").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    confirmedBy: text("confirmed_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("guardian_requests_minor_idx").on(t.minorId)],
);
