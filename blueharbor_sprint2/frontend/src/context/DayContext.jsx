import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api.js';

// Tiene il giorno virtuale REALE letto dal backend (niente date calendario finte).
// Chi avanza il giorno (Topbar) chiama setCurrentDay col valore restituito
// dall'API; le viste osservano currentDay e si ricaricano da sole.
const DayContext = createContext(null);

export function DayProvider({ children }) {
  const [currentDay, setCurrentDay] = useState(null); // null finché il backend non risponde

  useEffect(() => {
    let cancelled = false;
    api.getCurrentDay()
      .then(({ currentDay: day }) => { if (!cancelled) setCurrentDay(day); })
      .catch(() => { /* la topbar mostra "—"; gli errori li segnalano le viste */ });
    return () => { cancelled = true; };
  }, []);

  return (
    <DayContext.Provider value={{ currentDay, setCurrentDay }}>
      {children}
    </DayContext.Provider>
  );
}

export function useDay() {
  const context = useContext(DayContext);
  if (!context) throw new Error('useDay va usato dentro <DayProvider>.');
  return context;
}
