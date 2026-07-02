// frontend/src/context/RoleContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const RoleContext = createContext(null);

export function RoleProvider({ children }) {
  const { user } = useAuth();
  const [role, setRole] = useState('Operator');

  // ✅ Il ruolo viene impostato DALL'UTENTE AUTENTICATO
  useEffect(() => {
    if (user && user.role) {
      setRole(user.role);
    } else {
      // Se non c'è utente, ruolo di default (non dovrebbe succedere)
      setRole('Operator');
    }
  }, [user]);

  // ✅ Cambio ruolo solo se autorizzato (es. admin)
  const changeRole = (newRole) => {
    // Qui potresti controllare se l'utente ha i permessi per cambiare ruolo
    setRole(newRole);
  };

  return (
    <RoleContext.Provider value={{ role, setRole: changeRole }}>
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