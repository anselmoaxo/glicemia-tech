import { ImageResponse } from "next/og";
import { BrandIcon } from "@/lib/brand-icon";

// Ícone da aba do navegador (favicon).
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<BrandIcon size={64} rounded />, size);
}
