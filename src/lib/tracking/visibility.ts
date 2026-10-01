/**
 * Os controles de diabetes (frequência de medição, insulina, alertas) aparecem quando a pessoa NÃO marcou
 * "não tenho diabetes", ou quando ativou o acompanhamento específico mesmo assim. Não presume diagnóstico.
 */
export function diabetesControlsVisible(trackingPurpose: string | null | undefined, specificEnabled: boolean) {
  return trackingPurpose !== "sem_diabetes" || specificEnabled;
}
