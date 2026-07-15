// ═══ SPRINT 1 (Next Day SPRINT 4, logout SPRINT 6) ═══
// Barra sempre visibile: giorno virtuale (aria-live: annunciato quando
// cambia), pulsante Next Day, utente corrente e logout.
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDay } from '../context/DayContext';
import { useToast } from '../context/ToastContext';
import { nextDay } from '../services/api';

export default function Topbar({ onDayAdvanced }) {
  const { user, logout } = useAuth();
  const { currentDay, setCurrentDay, refreshDay } = useDay();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);

  // Primo caricamento del giorno dopo il login.
  useEffect(() => { refreshDay().catch(() => {}); }, []);

  const handleNextDay = async () => {
    setLoading(true);
    try {
      const result = await nextDay();
      setCurrentDay(result.currentDay);
      showSuccess(`Giorno avanzato al ${result.currentDay} (navi partite: ${result.releasedShips})`);
      onDayAdvanced(); // refresh globale delle viste (Sprint 4)
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="topbar">
      <h1 className="topbar-title">BlueHarbor Terminal</h1>
      {/* aria-live="polite": lo screen reader annuncia il nuovo giorno */}
      <span aria-live="polite">Giorno virtuale: <strong>{currentDay ?? '…'}</strong></span>
      <button onClick={handleNextDay} disabled={loading}>
        {loading ? 'Avanzamento…' : 'Next Day'}
      </button>
      <span className="topbar-user">
        {user.username} ({user.role})
        <button onClick={logout} className="btn-link">Esci</button>
      </span>
    </header>
  );
}
