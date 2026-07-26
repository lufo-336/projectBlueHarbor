// ============================================================================
// Formattazione del tempo. Il giorno virtuale intero `gN` resta la verità del
// dominio; la data calendario è solo una PROIEZIONE derivata da Day1Date, mai
// usata nella logica. La modalità (day/date) decide quale mostrare in primo
// piano ed è una preferenza UI (vedi PrefsContext).
// ============================================================================

/** Data calendario del giorno virtuale `dayNumber` (giorno 1 = day1Date). */
export function dayToDate(dayNumber, day1Date) {
  if (dayNumber === null || dayNumber === undefined || !day1Date) return null;
  return new Date(new Date(day1Date + 'T00:00:00').getTime() + (dayNumber - 1) * 86400000);
}

/**
 * Etichetta di un GIORNO (istante), es. arrivo o giorno evento.
 * mode 'date' → "20 giu" se Day1Date è noto, altrimenti ripiega su "g13".
 * mode 'day'  → "g13" (o "13" senza prefisso).
 */
export function formatDay(dayNumber, { mode = 'day', day1Date = null, withPrefix = true, compact = false } = {}) {
  if (dayNumber === null || dayNumber === undefined) return '—';
  if (mode === 'date') {
    const d = dayToDate(dayNumber, day1Date);
    if (d) {
      // compact = numerico "20/6" (per le colonne strette della timeline).
      return compact
        ? `${d.getDate()}/${d.getMonth() + 1}`
        : d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
    }
  }
  return withPrefix ? `g${dayNumber}` : String(dayNumber);
}

/**
 * Etichetta di un INTERVALLO [start, endExclusive) di giorni, es. occupazione.
 * Rende l'estremo destro incluso (endExclusive - 1), come già faceva la UI.
 */
export function formatDayRange(start, endExclusive, opts = {}) {
  return `${formatDay(start, opts)} – ${formatDay(endExclusive - 1, opts)}`;
}

/** Etichetta di una DURATA (conteggio di giorni): sempre "N giorni", mai "gN". */
export function formatDuration(days) {
  return days === 1 ? '1 giorno' : `${days} giorni`;
}
