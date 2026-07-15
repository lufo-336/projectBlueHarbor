// ═══ SPRINT 1 ═══ Il giorno virtuale, condiviso da Topbar e viste.
import { createContext, useContext, useState } from 'react';
import { getCurrentDay } from '../services/api';

const DayContext = createContext(null);

export function DayProvider({ children }) {
  const [currentDay, setCurrentDay] = useState(null);

  // Ri-legge il giorno dal server (usato al login e come fallback).
  const refreshDay = async () => {
    const data = await getCurrentDay();
    setCurrentDay(data.currentDay);
  };

  return (
    <DayContext.Provider value={{ currentDay, setCurrentDay, refreshDay }}>
      {children}
    </DayContext.Provider>
  );
}

export const useDay = () => useContext(DayContext);
