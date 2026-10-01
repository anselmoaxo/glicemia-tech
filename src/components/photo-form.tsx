"use client";

import { removePhoto, savePhoto, type PhotoState } from "@/app/(app)/perfil/foto-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useFormAction } from "@/lib/use-form-action";

export function PhotoForm({ userId, hasPhoto, version }: { userId: string; hasPhoto: number | null; version: number }) {
  const [state, onSubmit, pending] = useFormAction<PhotoState>(savePhoto, {});
  return (
    <section aria-labelledby="foto" className="flex flex-col gap-3">
      <h2 id="foto" className="text-xl font-semibold">Foto de perfil</h2>
      <div className="flex items-center gap-4">
        {hasPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/foto/${encodeURIComponent(userId)}?v=${version}`} alt="Sua foto de perfil" width={80} height={80} className="size-20 rounded-full object-cover" />
        ) : (
          <div aria-hidden className="grid size-20 place-items-center rounded-full bg-secondary text-2xl text-muted-foreground">?</div>
        )}
        <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-2">
          <Label htmlFor="photo" className="text-base">{hasPhoto ? "Substituir foto" : "Enviar foto"} (JPG, PNG ou WebP, até 512 KB)</Label>
          <input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" required className="text-base" />
          <Button type="submit" disabled={pending} className="h-12 text-base">{pending ? "Enviando..." : "Salvar foto"}</Button>
        </form>
      </div>
      {hasPhoto ? (
        <form action={removePhoto}>
          <Button type="submit" variant="outline" className="h-12 text-base">Remover foto</Button>
        </form>
      ) : null}
      {state.error && <p role="alert" className="text-base font-medium text-destructive">{state.error}</p>}
      {state.ok && <p role="status" className="text-base font-medium">Foto salva.</p>}
      <p className="text-sm text-muted-foreground">A foto só aparece para você e para familiares que você autorizou.</p>
    </section>
  );
}
