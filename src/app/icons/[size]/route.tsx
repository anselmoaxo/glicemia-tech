import { ImageResponse } from "next/og";

const SIZES = new Set(["180", "192", "512"]);

// Ícone do app (PWA / tela inicial): gota sobre fundo azul, gerado sem arquivos binários.
export async function GET(_: Request, { params }: RouteContext<"/icons/[size]">) {
  const { size } = await params;
  if (!SIZES.has(size)) return new Response("Not found", { status: 404 });
  const px = Number(size);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1d4ed8",
        }}
      >
        <div
          style={{
            width: px * 0.42,
            height: px * 0.42,
            background: "#ffffff",
            borderRadius: "50% 50% 50% 0",
            transform: "rotate(-45deg)",
          }}
        />
      </div>
    ),
    { width: px, height: px },
  );
}
