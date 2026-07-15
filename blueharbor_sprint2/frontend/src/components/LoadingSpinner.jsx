import './LoadingSpinner.css';

// fullPage: true per gli stati "sto capendo chi sei" (avvio app),
// false (default) per i caricamenti dentro una vista.
export default function LoadingSpinner({ fullPage = false }) {
  return (
    <div className={fullPage ? 'spinner-wrap spinner-wrap--full' : 'spinner-wrap'}
         role="status" aria-label="Caricamento in corso">
      <div className="spinner" aria-hidden="true" />
    </div>
  );
}
