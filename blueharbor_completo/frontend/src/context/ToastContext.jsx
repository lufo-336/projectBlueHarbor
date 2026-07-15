// ═══ SPRINT 5 ═══ Notifiche non bloccanti (sostituiscono gli alert()).
import { createContext, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]); // { id, type, message }
  const nextId = useRef(1);

  const push = (type, message) => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, type, message }]);
    // Auto-rimozione dopo 4 secondi.
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 4000);
  };

  return (
    <ToastContext.Provider value={{
      toasts,
      showSuccess: (message) => push('success', message),
      showError: (message) => push('error', message),
    }}>
      {children}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
