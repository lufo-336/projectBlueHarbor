// ============================================================================
// Replica CLIENT di SchedulingRules (backend, funzioni pure) — serve SOLO per
// l'anteprima nella timeline dello Scheduler. Al momento dell'assegnazione
// vera fa fede il giorno calcolato dal server (risposta di /assign).
// Se la regola cambia sul backend, va aggiornata anche qui.
// ============================================================================

/**
 * Primo giorno in cui la nave può occupare la banchina.
 * occupations: occupazioni attive della banchina, intervalli [start, end).
 * Stessa logica di SchedulingRules.ComputeOccupationStartDay.
 */
export function computeOccupationStartDay(arrivalDay, duration, currentDay, occupations) {
  // Punto di partenza: non prima dell'arrivo, non nel passato.
  let candidate = Math.max(arrivalDay, currentDay);

  const sorted = [...occupations].sort((a, b) => a.start - b.start);
  for (const occ of sorted) {
    // C'è un buco lungo almeno `duration` prima di questa occupazione?
    if (occ.start >= candidate + duration) return candidate;
    // Altrimenti questa occupazione blocca: si riparte dalla sua fine.
    candidate = Math.max(candidate, occ.end);
  }
  return candidate; // in coda a tutto
}

/** Una banchina ospita solo navi della sua identica dimensione. */
export function isCompatible(shipSize, berthSize) {
  return shipSize.toUpperCase() === berthSize.toUpperCase();
}
