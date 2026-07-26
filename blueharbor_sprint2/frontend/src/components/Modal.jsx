import { useEffect } from 'react';
import { useT } from '../context/PrefsContext.jsx';
import './Modal.css';

// Modale accessibile e coerente col design (al posto dei dialoghi nativi).
// Chiude con Esc o click sull'overlay.
export default function Modal({ title, onClose, children }) {
  const t = useT();
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal__overlay" onMouseDown={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}
           onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h2>{title}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label={t('common.close')}>✕</button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}
