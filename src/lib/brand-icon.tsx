// Ícone da marca (gota branca sobre azul-petróleo), usado no navegador, no PWA e no iOS.
// A gota é a mesma do logo do app (lucide "droplet").
const INK = "#4338ca";

export function BrandIcon({ size, rounded = false }: { size: number; rounded?: boolean }) {
  // Ícones "maskable"/iOS são cortados pelo sistema: a gota fica no centro, com margem segura.
  const drop = Math.round(size * (rounded ? 0.66 : 0.5));
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: INK,
        borderRadius: rounded ? Math.round(size * 0.22) : 0,
      }}
    >
      <svg width={drop} height={drop} viewBox="0 0 24 24">
        <path
          d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"
          fill="#ffffff"
        />
      </svg>
    </div>
  );
}
