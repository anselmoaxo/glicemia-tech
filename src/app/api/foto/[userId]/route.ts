import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { profilePhotos } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getAccessibleModules } from "@/lib/sharing/access";

export const runtime = "nodejs";

const PRIVATE = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

// Foto de perfil protegida: só o próprio titular ou um familiar com vínculo ativo enxerga.
export async function GET(request: NextRequest, ctx: { params: Promise<{ userId: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || session.user.suspendedAt) return new Response(null, { status: 401, headers: PRIVATE });

  const { userId } = await ctx.params;
  if (!userId || userId.length > 64) return new Response(null, { status: 404, headers: PRIVATE });
  if (userId !== session.user.id && (await getAccessibleModules(session.user.id, userId)).size === 0) {
    return new Response(null, { status: 404, headers: PRIVATE });
  }

  const [photo] = await db.select().from(profilePhotos).where(eq(profilePhotos.userId, userId));
  if (!photo) return new Response(null, { status: 404, headers: PRIVATE });
  return new Response(Buffer.from(photo.dataBase64, "base64"), {
    headers: { ...PRIVATE, "Content-Type": photo.contentType, "Content-Security-Policy": "default-src 'none'" },
  });
}
