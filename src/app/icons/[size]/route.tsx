import { ImageResponse } from "next/og";
import { BrandIcon } from "@/lib/brand-icon";

const SIZES = new Set(["192", "512"]);

// Ícones do manifesto do PWA (instalação no celular). Fundo cheio: serve também como "maskable".
export async function GET(_: Request, { params }: RouteContext<"/icons/[size]">) {
  const { size } = await params;
  if (!SIZES.has(size)) return new Response("Not found", { status: 404 });
  const px = Number(size);
  return new ImageResponse(<BrandIcon size={px} />, { width: px, height: px });
}
