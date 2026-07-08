// frontend/src/context/RoleContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const RoleContext = createContext(null);

export function RoleProvider({ children }) {
  const { user } = useAuth();
  const [role, setRole] = useState(null);

  // Il ruolo è deciso esclusivamente dal server, tramite l'utente autenticato:
  // non esiste (più) un modo per cambiarlo lato client.
  useEffect(() => {
    setRole(user?.role ?? null);
  }, [user]);

  return (
    <RoleContext.Provider value={{ role }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole deve essere usato all\'interno di RoleProvider');
  }
  return context;
}
