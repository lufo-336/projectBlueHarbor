import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = not logged in

  const login = (email, password) => {
    // Simulated auth — replace with real API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email && password.length >= 6) {
          const u = { email, name: email.split('@')[0], role: 'Operator' };
          setUser(u);
          resolve(u);
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 800);
    });
  };

  const register = (name, email, password, role) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (name && email && password.length >= 6) {
          const u = { email, name, role: role || 'Operator' };
          setUser(u);
          resolve(u);
        } else {
          reject(new Error('Please fill all fields correctly'));
        }
      }, 900);
    });
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
