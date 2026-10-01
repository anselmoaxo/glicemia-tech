"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { profilePhotos } from "@/db/schema";
import { MAX_PHOTO_BYTES, validatePhoto } from "@/lib/privacy/photo";
import { requireUser } from "@/lib/session";

export type PhotoState = { ok?: boolean; error?: string };

export async function savePhoto(_: PhotoState, formData: FormData): Promise<PhotoState> {
  const user = await requireUser();
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "Escolha uma imagem." };
  if (file.size > MAX_PHOTO_BYTES) return { error: "A foto deve ter no máximo 512 KB." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const result = validatePhoto(bytes);
  if (!result.ok) return { error: result.error };

  const dataBase64 = Buffer.from(bytes).toString("base64");
  await db
    .insert(profilePhotos)
    .values({ userId: user.id, contentType: result.type, dataBase64 })
    .onConflictDoUpdate({
      target: profilePhotos.userId,
      set: { contentType: result.type, dataBase64, updatedAt: new Date() },
    });
  revalidatePath("/perfil");
  return { ok: true };
}

export async function removePhoto() {
  const user = await requireUser();
  await db.delete(profilePhotos).where(eq(profilePhotos.userId, user.id));
  revalidatePath("/perfil");
}
