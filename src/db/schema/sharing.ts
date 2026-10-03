import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";

// Convite/vínculo entre o dono dos dados e um familiar. O token do convite só é guardado como hash.
export const familyMembers = pgTable(
  "family_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    memberUserId: text("member_user_id").references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    // companion = acompanhante (só leitura); guardian = responsável legal confirmado de um menor. Nunca presumido.
    role: text("role").notNull().default("companion"),
    tokenHash: text("token_hash").notNull().unique(),
    inviteExpiresAt: timestamp("invite_expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    acceptedAt: timestamp("accepted_at"),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [
    unique("family_members_owner_email_uq").on(t.ownerId, t.email),
    index("family_members_owner_idx").on(t.ownerId),
    index("family_members_member_idx").on(t.memberUserId),
    check("family_members_status_chk", sql`${t.status} in ('pending','accepted','revoked')`),
    check("family_members_role_chk", sql`${t.role} in ('companion','guardian')`),
  ],
);

// Somente leitura: cada linha libera um módulo para o familiar.
export const sharingPermissions = pgTable(
  "sharing_permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    familyMemberId: uuid("family_member_id")
      .notNull()
      .references(() => familyMembers.id, { onDelete: "cascade" }),
    module: text("module").notNull(),
  },
  (t) => [
    unique("sharing_permissions_member_module_uq").on(t.familyMemberId, t.module),
    check(
      "sharing_permissions_module_chk",
      sql`${t.module} in ('glucose','meals','medications','insulin','reports')`,
    ),
  ],
);

// Histórico do compartilhamento: convites, aceites, mudanças de permissão e revogações. Sem dado clínico:
// guarda só quem fez, o quê, os módulos liberados e o e-mail convidado mascarado.
export const sharingEvents = pgTable(
  "sharing_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
    familyMemberId: uuid("family_member_id").references(() => familyMembers.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    memberEmailMasked: text("member_email_masked"),
    modules: text("modules").array(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("sharing_events_owner_idx").on(t.ownerId, t.createdAt.desc()),
    check(
      "sharing_events_action_chk",
      sql`${t.action} in ('invite','accept','permissions_change','invite_cancel','revoke','guardian_confirm','majority_review','admin_revoke')`,
    ),
  ],
);
