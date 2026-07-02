// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, logout as apiLogout, getCurrentUser } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Controlla se c'è una sessione attiva all'avvio
  useEffect(() => {
    const checkSession = async () => {
      try {
        const userData = await getCurrentUser();
        if (userData) {
          setUser(userData);
        }
      } catch (err) {
        console.log('Nessuna sessione attiva');
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  // ✅ Login - Riceve ruolo dal backend
  const login = async (email, password) => {
    setError(null);
    try {
      const response = await apiLogin(email, password);
      // ✅ Il backend restituisce { user: { email, name, role }, token }
      setUser(response.user);
      // Salva il token per le richieste future
      localStorage.setItem('authToken', response.token);
      return response;
    } catch (err) {
      setError(err.message || 'Login fallito');
      throw err;
    }
  };

  // ✅ Logout
  const logout = async () => {
    try {
      await apiLogout();
    } catch (err) {
      console.error('Errore durante il logout:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('authToken');
      // Reindirizza al login
      window.location.href = '/';
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve essere usato all\'interno di AuthProvider');
  }
  return context;
}
