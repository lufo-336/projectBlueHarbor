import React, { createContext, useContext, useState } from 'react';

const DayContext = createContext(null);

export function DayProvider({ children }) {
  const today = new Date().toISOString().split('T')[0];
  const [day, setDay] = useState(today);
  return (
    <DayContext.Provider value={{ day, setDay }}>
      {children}
    </DayContext.Provider>
  );
}

export function useDay() {
  return useContext(DayContext);
}
