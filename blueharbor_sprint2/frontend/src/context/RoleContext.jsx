// context/RoleContext.jsx
import React, { createContext, useContext, useState } from 'react';

// Creo il context
const RoleContext = createContext();

// Hook personalizzato - ESPORTO CON NOME { useRole }
export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole deve essere usato all\'interno di RoleProvider');
  }
  return context;
};

// Provider - ESPORTO CON NOME { RoleProvider }
export const RoleProvider = ({ children }) => {
  const [role, setRole] = useState('Scheduler'); // Default per test

  const changeRole = (newRole) => {
    setRole(newRole);
  };

  return (
    <RoleContext.Provider value={{ role, changeRole }}>
      {children}
    </RoleContext.Provider>
  );
};