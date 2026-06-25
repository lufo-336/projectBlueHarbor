// frontend/src/context/ToastContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/common/Toast';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve essere usato all\'interno di ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((msg) => addToast(msg, 'success'), [addToast]);
  const showError = useCallback((msg) => addToast(msg, 'error'), [addToast]);
  const showWarning = useCallback((msg) => addToast(msg, 'warning'), [addToast]);
  const showInfo = useCallback((msg) => addToast(msg, 'info'), [addToast]);

  const ToastContainer = () => (
    <div className="toast-container">
      {toasts.map(({ id, message, type, duration }) => (
        <Toast
          key={id}
          message={message}
          type={type}
          duration={duration}
          onClose={() => removeToast(id)}
        />
      ))}
    </div>
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};