import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, setToken, setSessionExpiredHandler } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // true finché non abbiamo verificato l'eventuale token salvato:
  // App NON deve mostrare la pagina di login prima di questa verifica
  // (era il bug del "flash" al refresh).
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Se una chiamata qualsiasi risponde 401 (sessione scaduta),
    // api.js pulisce il token e noi torniamo alla pagina di login.
    setSessionExpiredHandler(() => setUser(null));

    let cancelled = false;
    (async () => {
      try {
        // /me risponde: UserDto se il token salvato è valido, null se non c'è token.
        const me = await api.me();
        if (!cancelled) setUser(me);
      } catch {
        // Token scaduto/manomesso: api.js lo ha già rimosso.
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email, password) => {
    const { user: loggedUser, token } = await api.login(email, password);
    setToken(token);
    setUser(loggedUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Il logout JWT è simbolico: il token si scarta comunque.
    }
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth va usato dentro <AuthProvider>.');
  return context;
}
