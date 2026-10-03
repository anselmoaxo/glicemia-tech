// Traçado ilustrativo de um dia de medições, desenhado como no visor de um glicosímetro. Puramente decorativo:
// os números são um exemplo fixo, não dados de ninguém.
const POINTS = [118, 104, 142, 131, 97, 112, 156, 128, 109, 121, 138, 115];
const W = 320;
const H = 120;
const MIN = 70;
const MAX = 190;
const BAND = { min: 90, max: 145 }; // faixa de exemplo

const y = (v: number) => H - ((v - MIN) / (MAX - MIN)) * H;
const x = (i: number) => (i / (POINTS.length - 1)) * W;

// curva suave (Catmull-Rom convertida em Bézier)
function path() {
  const p = POINTS.map((v, i) => [x(i), y(v)] as const);
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const [x0, y0] = p[i - 1] ?? p[i];
    const [x1, y1] = p[i];
    const [x2, y2] = p[i + 1];
    const [x3, y3] = p[i + 2] ?? p[i + 1];
    d += ` C${x1 + (x2 - x0) / 6},${y1 + (y2 - y0) / 6} ${x2 - (x3 - x1) / 6},${y2 - (y3 - y1) / 6} ${x2},${y2}`;
  }
  return d;
}

export function GlucoseTrace({ className }: { className?: string }) {
  const last = POINTS.length - 1;
  return (
    <svg viewBox={`-10 -10 ${W + 20} ${H + 20}`} aria-hidden className={className} preserveAspectRatio="xMinYMid meet">
      <rect x={0} y={y(BAND.max)} width={W} height={y(BAND.min) - y(BAND.max)} rx={6} className="fill-lcd-ink/12" />
      {[BAND.min, BAND.max].map((v) => (
        <line key={v} x1={0} x2={W} y1={y(v)} y2={y(v)} className="stroke-lcd-ink/35" strokeDasharray="2 5" strokeWidth={1.5} />
      ))}
      <path d={path()} pathLength={1} className="trace-line fill-none stroke-lcd-ink" strokeWidth={3} strokeLinecap="round" />
      {POINTS.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={i === last ? 6 : 3} className={`trace-dot ${i === last ? "fill-lcd-ink" : "fill-lcd"} stroke-lcd-ink`} strokeWidth={2} style={{ animationDelay: `${0.25 + (i / last) * 1.1}s` }} />
      ))}
    </svg>
  );
}

export const TRACE_LAST_VALUE = POINTS[POINTS.length - 1];
