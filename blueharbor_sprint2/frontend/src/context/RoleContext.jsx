// frontend/src/context/RoleContext.jsx
import React, { createContext, useContext, useState } from 'react';

const RoleContext = createContext();

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole deve essere usato all\'interno di RoleProvider');
  }
  return context;
};

export const RoleProvider = ({ children }) => {
  const [role, setRole] = useState('Scheduler');

  // ✅ ESPONI sia changeRole che setRole per compatibilità
  const changeRole = (newRole) => {
    setRole(newRole);
  };

  // ✅ Lista dei ruoli disponibili
  const roles = ['Operator', 'Scheduler'];

  return (
    <RoleContext.Provider value={{ role, setRole, changeRole, roles }}>
      {children}
    </RoleContext.Provider>
  );
};