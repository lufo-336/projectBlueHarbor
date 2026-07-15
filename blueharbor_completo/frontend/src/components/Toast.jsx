// ═══ SPRINT 5 (aria SPRINT 10) ═══ Rende i toast del ToastContext.
import { useToast } from '../context/ToastContext';

export default function Toast() {
  const { toasts } = useToast();
  return (
    // aria-live: i messaggi vengono annunciati senza spostare il focus.
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <p key={toast.id} className={`toast toast-${toast.type}`}>{toast.message}</p>
      ))}
    </div>
  );
}
