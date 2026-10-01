import { describe, expect, it } from "vitest";
import { MAX_PHOTO_BYTES, validatePhoto } from "./photo";

const png = () => new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 1, 2]);

describe("validatePhoto", () => {
  it("aceita PNG pelo conteúdo real", () => {
    expect(validatePhoto(png())).toEqual({ ok: true, type: "image/png" });
  });
  it("recusa arquivo que só finge ser imagem", () => {
    const html = new TextEncoder().encode("<script>alert(1)</script> xxxxxxxx");
    expect(validatePhoto(html).ok).toBe(false);
  });
  it("recusa vazio e acima do limite", () => {
    expect(validatePhoto(new Uint8Array()).ok).toBe(false);
    expect(validatePhoto(new Uint8Array(MAX_PHOTO_BYTES + 1)).ok).toBe(false);
  });
});
