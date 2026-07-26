import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { formatDay } from '../services/time.js';
import { useDay } from './DayContext.jsx';

// ============================================================================
// Preferenze UI persistenti (localStorage), indipendenti dal dominio:
//  - theme:    'light' | 'dark'  → applicato come data-theme sul root
//  - timeMode: 'day'   | 'date'  → i giorni si mostrano come "gN" o come data
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

  // Un solo effetto per ciascuna preferenza: applica + persiste.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(TIME_MODE_KEY, timeMode);
  }, [timeMode]);

  const value = useMemo(() => ({
    theme,
    timeMode,
    toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    toggleTimeMode: () => setTimeMode((m) => (m === 'date' ? 'day' : 'date')),
  }), [theme, timeMode]);

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs() {
  const context = useContext(PrefsContext);
  if (!context) throw new Error('usePrefs va usato dentro <PrefsProvider>.');
  return context;
}

/**
 * Formattatore di giorni legato alla modalità corrente e al Day1Date del
 * DayContext: le viste chiamano fmt(day) senza ripetere mode/day1Date.
 * Va usato dentro <DayProvider> (tutte le viste autenticate lo sono).
 */
export function useDayLabel() {
  const { timeMode } = usePrefs();
  const { day1Date } = useDay();
  return useCallback(
    (day, opts) => formatDay(day, { mode: timeMode, day1Date, ...opts }),
    [timeMode, day1Date],
  );
}
