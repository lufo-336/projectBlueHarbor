// ============================================================================
// Formattazione del tempo. Il giorno virtuale intero `gN`/`dN` resta la verità
// del dominio; la data calendario è solo una PROIEZIONE derivata da Day1Date,
// mai usata nella logica. La modalità (day/date) decide quale mostrare in primo
// piano ed è una preferenza UI (vedi PrefsContext). `lang` decide locale della
// data, prefisso del giorno (g/d) e unità di durata (giorni/days).
// ============================================================================

const localeFor = (lang) => (lang === 'en' ? 'en-GB' : 'it-IT');
const dayPrefix = (lang) => (lang === 'en' ? 'd' : 'g');

/** Data calendario del giorno virtuale `dayNumber` (giorno 1 = day1Date). */
export function dayToDate(dayNumber, day1Date) {
  if (dayNumber === null || dayNumber === undefined || !day1Date) return null;
  return new Date(new Date(day1Date + 'T00:00:00').getTime() + (dayNumber - 1) * 86400000);
}

/**
 * Etichetta di un GIORNO (istante), es. arrivo o giorno evento.
 * mode 'date' → "20 giugno"/"20 June" se Day1Date è noto, altrimenti "g13"/"d13".
 * mode 'day'  → "g13"/"d13" (o "13" senza prefisso).
 */
export function formatDay(dayNumber, { mode = 'day', day1Date = null, withPrefix = true, compact = false, lang = 'it' } = {}) {
  if (dayNumber === null || dayNumber === undefined) return '—';
  if (mode === 'date') {
    const d = dayToDate(dayNumber, day1Date);
    if (d) {
      // compact = numerico "20/6" (per le colonne strette della timeline);
      // esteso = "20 giugno" (mese per intero, non abbreviato).
      return compact
        ? `${d.getDate()}/${d.getMonth() + 1}`
        : d.toLocaleDateString(localeFor(lang), { day: 'numeric', month: 'long' });
    }
  }
  return withPrefix ? `${dayPrefix(lang)}${dayNumber}` : String(dayNumber);
}

/**
 * Etichetta di un INTERVALLO [start, endExclusive) di giorni, es. occupazione.
 * Rende l'estremo destro incluso (endExclusive - 1), come già faceva la UI.
 */
export function formatDayRange(start, endExclusive, opts = {}) {
  return `${formatDay(start, opts)} – ${formatDay(endExclusive - 1, opts)}`;
}

/** Etichetta di una DURATA (conteggio di giorni): "N giorni"/"N days", mai "gN". */
export function formatDuration(days, lang = 'it') {
  if (lang === 'en') return days === 1 ? '1 day' : `${days} days`;
  return days === 1 ? '1 giorno' : `${days} giorni`;
}

/** Valore "YYYY-MM-DD" per un <input type="date"> a partire dal giorno virtuale. */
export function dayToInputValue(dayNumber, day1Date) {
  const d = dayToDate(dayNumber, day1Date);
  if (!d) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Giorno virtuale (giorno 1 = day1Date) a partire da un "YYYY-MM-DD". */
export function inputValueToDay(iso, day1Date) {
  if (!iso || !day1Date) return null;
  const ms = new Date(iso + 'T00:00:00').getTime() - new Date(day1Date + 'T00:00:00').getTime();
  return Math.round(ms / 86400000) + 1;
}
