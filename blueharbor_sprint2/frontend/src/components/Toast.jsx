import './Toast.css';

// Notifica singola. La pila e i tempi li gestisce ToastContext.
export default function Toast({ type, message }) {
  return <div className={`toast toast-${type}`}>{message}</div>;
}
