import { createContext, useCallback, useContext, useRef, useState } from 'react';
import Toast from '../components/Toast.jsx';

// Espone ESATTAMENTE le due funzioni che i componenti usano:
// showSuccess / showError. Ogni toast sparisce da solo dopo 4 secondi.
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const pushToast = useCallback((type, message) => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, type, message }]);
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const showSuccess = useCallback((message) => pushToast('success', message), [pushToast]);
  const showError = useCallback((message) => pushToast('error', message), [pushToast]);

  return (
    <ToastContext.Provider value={{ showSuccess, showError }}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => <Toast key={t.id} type={t.type} message={t.message} />)}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast va usato dentro <ToastProvider>.');
  return context;
}
