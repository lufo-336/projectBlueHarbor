import { useT } from '../context/PrefsContext.jsx';
import './LoadingSpinner.css';

// fullPage: true per gli stati "sto capendo chi sei" (avvio app),
// false (default) per i caricamenti dentro una vista.
export default function LoadingSpinner({ fullPage = false }) {
  const t = useT();
  return (
    <div className={fullPage ? 'spinner-wrap spinner-wrap--full' : 'spinner-wrap'}
         role="status" aria-label={t('common.loading')}>
      <div className="spinner" aria-hidden="true" />
    </div>
  );
}
