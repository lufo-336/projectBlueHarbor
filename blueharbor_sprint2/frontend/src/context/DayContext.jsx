// frontend/src/context/DayContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentDay } from '../services/api';

const DayContext = createContext();

export const useDay = () => {
  const context = useContext(DayContext);
  if (!context) {
    throw new Error('useDay deve essere usato all\'interno di DayProvider');
  }
  return context;
};

export const DayProvider = ({ children }) => {
  const [currentDay, setCurrentDay] = useState(1);
  const [loading, setLoading] = useState(false);

  // Carica il giorno corrente all'avvio
  useEffect(() => {
    const loadCurrentDay = async () => {
      try {
        const day = await getCurrentDay();  // ← Ora ritorna solo il numero
        setCurrentDay(day);
      } catch (error) {
        console.error('Errore nel caricamento del giorno:', error);
        setCurrentDay(1);
      }
    };
    loadCurrentDay();
  }, []);

  const updateDay = (newDay) => {
    setCurrentDay(newDay);
  };

  return (
    <DayContext.Provider value={{ currentDay, updateDay, loading, setLoading }}>
      {children}
    </DayContext.Provider>
  );
};