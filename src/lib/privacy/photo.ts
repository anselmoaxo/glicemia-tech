export const MAX_PHOTO_BYTES = 512 * 1024;

const SIGNATURES = [
  { type: "image/jpeg", test: (b: Uint8Array) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    type: "image/png",
    test: (b: Uint8Array) => [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v),
  },
  {
    type: "image/webp",
    test: (b: Uint8Array) =>
      String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP",
  },
] as const;

/** Confere o conteúdo real do arquivo (não confia no nome nem no tipo informado pelo navegador). */
export function detectImageType(bytes: Uint8Array): (typeof SIGNATURES)[number]["type"] | null {
  return SIGNATURES.find((s) => bytes.length > 12 && s.test(bytes))?.type ?? null;
}

export function validatePhoto(bytes: Uint8Array): { ok: true; type: string } | { ok: false; error: string } {
  if (bytes.length === 0) return { ok: false, error: "Escolha uma imagem." };
  if (bytes.length > MAX_PHOTO_BYTES) return { ok: false, error: "A foto deve ter no máximo 512 KB." };
  const type = detectImageType(bytes);
  if (!type) return { ok: false, error: "Use uma foto JPG, PNG ou WebP." };
  return { ok: true, type };
}
