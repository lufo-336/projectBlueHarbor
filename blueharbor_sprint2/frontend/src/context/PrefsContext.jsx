import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { formatDay, formatDuration } from '../services/time.js';
import { COPY, LANG_KEY, detectLang, translate, translateApiError } from '../i18n/copy.js';
import { useDay } from './DayContext.jsx';

// ============================================================================
// Preferenze UI persistenti (localStorage), indipendenti dal dominio:
//  - theme:    'light' | 'dark'  → applicato come data-theme sul root
//  - timeMode: 'day'   | 'date'  → i giorni si mostrano come "gN" o come data
//  - lang:     'it'    | 'en'    → lingua dell'interfaccia (dizionario in i18n/)
// Il primo paint è già coerente grazie allo script no-flash in index.html.
// ============================================================================

const THEME_KEY = 'blueharbor_theme';
const TIME_MODE_KEY = 'blueharbor_time_mode';

const PrefsContext = createContext(null);

function initialTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function initialTimeMode() {
  const saved = localStorage.getItem(TIME_MODE_KEY);
  return saved === 'date' ? 'date' : 'day';
}

export function PrefsProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme);
  const [timeMode, setTimeMode] = useState(initialTimeMode);
  const [lang, setLang] = useState(detectLang);

  // Un solo effetto per ciascuna preferenza: applica + persiste.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(TIME_MODE_KEY, timeMode);
  }, [timeMode]);

  useEffect(() => {
    document.documentElement.lang = lang; // accessibilità: <html lang> coerente
    localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  const value = useMemo(() => ({
    theme,
    timeMode,
    lang,
    toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    toggleTimeMode: () => setTimeMode((m) => (m === 'date' ? 'day' : 'date')),
    setLang: (l) => setLang(l === 'en' ? 'en' : 'it'),
  }), [theme, timeMode, lang]);

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs() {
  const context = useContext(PrefsContext);
  if (!context) throw new Error('usePrefs va usato dentro <PrefsProvider>.');
  return context;
}

/**
 * Traduttore legato alla lingua corrente: t('area.chiave', params).
 * Se una chiave manca nella lingua attiva, ripiega sull'italiano, poi sulla
 * chiave stessa (visibile, così un buco si nota subito).
 */
export function useT() {
  const { lang } = usePrefs();
  return useCallback((key, params) => {
    const v = translate(COPY[lang], key, params);
    if (v === key && lang !== 'it') return translate(COPY.it, key, params);
    return v;
  }, [lang]);
}

/** Traduce un messaggio d'errore backend nella lingua corrente (soft fallback IT). */
export function useErrorText() {
  const { lang } = usePrefs();
  return useCallback((message) => translateApiError(message, lang), [lang]);
}

/**
 * Formattatore di giorni legato alla modalità corrente, alla lingua e al
 * Day1Date del DayContext: le viste chiamano fmt(day) senza ripetere i dettagli.
 * Va usato dentro <DayProvider> (tutte le viste autenticate lo sono).
 */
export function useDayLabel() {
  const { timeMode, lang } = usePrefs();
  const { day1Date } = useDay();
  return useCallback(
    (day, opts) => formatDay(day, { mode: timeMode, day1Date, lang, ...opts }),
    [timeMode, day1Date, lang],
  );
}

/** Formattatore di durate ("N giorni" / "N days") legato alla lingua corrente. */
export function useDurationLabel() {
  const { lang } = usePrefs();
  return useCallback((days) => formatDuration(days, lang), [lang]);
}
