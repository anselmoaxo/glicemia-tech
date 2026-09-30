"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { getProfile } from "@/lib/profile";
import { requireUser } from "@/lib/session";

/** Registra o aceite dos termos (LGPD) logo após o cadastro. */
export async function recordConsent() {
  const user = await requireUser();
  await getProfile(user.id);
  await db.update(profiles).set({ lgpdConsentAt: new Date() }).where(eq(profiles.userId, user.id));
}
