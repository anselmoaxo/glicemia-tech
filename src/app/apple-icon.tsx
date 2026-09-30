import { ImageResponse } from "next/og";
import { BrandIcon } from "@/lib/brand-icon";

// Ícone ao adicionar à tela inicial do iPhone/iPad (o iOS aplica os cantos arredondados).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<BrandIcon size={180} />, size);
}
