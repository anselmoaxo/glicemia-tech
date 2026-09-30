export type GaugeGeometry = {
  /** posição do marcador, em % da régua (0–100) */
  marker: number;
  /** início e largura da faixa-alvo, em % (null se não há meta) */
  band: { left: number; width: number } | null;
  min: number;
  max: number;
};

/**
 * Escala da régua do visor: sempre cabe o valor e a faixa-alvo, com folga dos dois lados.
 * Só posiciona; não interpreta clinicamente.
 */
export function gaugeGeometry(value: number, target: { min: number; max: number } | null): GaugeGeometry {
  const low = Math.min(value, target?.min ?? value);
  const high = Math.max(value, target?.max ?? value);
  const min = Math.max(0, Math.floor((low - 40) / 10) * 10);
  const max = Math.ceil((high + 60) / 10) * 10;
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const clamp = (n: number) => Math.min(100, Math.max(0, n));

  return {
    min,
    max,
    marker: clamp(pct(value)),
    band: target ? { left: clamp(pct(target.min)), width: clamp(pct(target.max)) - clamp(pct(target.min)) } : null,
  };
}
