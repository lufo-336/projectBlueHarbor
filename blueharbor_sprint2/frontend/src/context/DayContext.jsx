import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getCurrentDay } from '../services/api';

const DayContext = createContext(null);

export function DayProvider({ children }) {
  const { user } = useAuth();
  const [currentDay, setCurrentDay] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const day = await getCurrentDay();
      setCurrentDay(day);
    } catch {
      setCurrentDay(null);
    }
  }, []);

  // Il giorno virtuale è dato dal backend: lo ricarico appena c'è un utente autenticato.
  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  return (
    <DayContext.Provider value={{ currentDay, refresh }}>
      {children}
    </DayContext.Provider>
  );
}

export function useDay() {
  return useContext(DayContext);
}
