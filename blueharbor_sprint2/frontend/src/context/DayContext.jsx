import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api.js';

// Tiene il giorno virtuale REALE letto dal backend (niente date calendario finte).
// Chi avanza il giorno (Topbar) chiama setCurrentDay col valore restituito
// dall'API; le viste osservano currentDay e si ricaricano da sole.
const DayContext = createContext(null);

export function DayProvider({ children }) {
  const [currentDay, setCurrentDay] = useState(null); // null finché il backend non risponde
  const [day1Date, setDay1Date] = useState(null); // data calendario del giorno 1 (nullable)

  useEffect(() => {
    let cancelled = false;
    api.getCurrentDay()
      .then(({ currentDay: day, day1Date: d1 }) => {
        if (!cancelled) { setCurrentDay(day); setDay1Date(d1 ?? null); }
      })
      .catch(() => { /* la topbar mostra "—"; gli errori li segnalano le viste */ });
    return () => { cancelled = true; };
  }, []);

  return (
    <DayContext.Provider value={{ currentDay, setCurrentDay, day1Date }}>
      {children}
    </DayContext.Provider>
  );
}

export function useDay() {
  const context = useContext(DayContext);
  if (!context) throw new Error('useDay va usato dentro <DayProvider>.');
  return context;
}
