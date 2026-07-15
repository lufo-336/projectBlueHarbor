// ═══ SPRINT 6 ═══
// Chi è l'utente? Il ruolo arriva SOLO dal login (mai scelto dal client).
// Al mount prova /auth/me: se il cookie è ancora valido, il refresh di
// pagina non butta fuori l'utente.
import { createContext, useContext, useEffect, useState } from 'react';
import * as api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);      // { username, role } | null
  const [loading, setLoading] = useState(true); // finché non sappiamo chi sei

  useEffect(() => {
    // Sessione scaduta in QUALSIASI momento → si torna al login.
    api.setUnauthorizedHandler(() => setUser(null));
    api.fetchMe()
      .then(setUser)
      .catch(() => setUser(null)) // 401 atteso al primo avvio: nessun cookie
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const me = await api.login(username, password); // lascia propagare l'errore
    setUser(me);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
