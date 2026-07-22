import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useDay } from '../context/DayContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../services/api.js';
import { roleLabel } from '../services/roles.js';
import './Topbar.css';

export default function Topbar() {
  const { user, logout } = useAuth();
  const { currentDay, setCurrentDay, day1Date } = useDay();
  const { showSuccess, showError } = useToast();
  const [advancing, setAdvancing] = useState(false);

  // "Next Day": avanza il giorno virtuale. Le viste si ricaricano da sole
  // perché osservano currentDay dal DayContext.
  async function handleNextDay() {
    setAdvancing(true);
    try {
      const { currentDay: day } = await api.nextDay();
      setCurrentDay(day);
      showSuccess(`Siamo al giorno ${day}.`);
    } catch (err) {
      showError(err.message);
    } finally {
      setAdvancing(false);
    }
  }

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <span aria-hidden="true">⚓</span>
        <span>BlueHarbor Terminal</span>
      </div>
      <div className="topbar__controls">
        <span className="topbar__day mono">
          GIORNO {currentDay === null ? '—' : String(currentDay).padStart(2, '0')}
          {currentDay !== null && day1Date && (
            <span className="topbar__date">
              {new Date(new Date(day1Date + 'T00:00:00').getTime() + (currentDay - 1) * 86400000)
                .toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </span>
        <button className="btn btn-gold" onClick={handleNextDay} disabled={advancing}>
          {advancing ? 'Avanzo…' : 'Next Day →'}
        </button>
        <span className="topbar__role">{roleLabel(user.role)}</span>
        <span className="topbar__user">{user.name}</span>
        <button className="btn btn-ghost topbar__logout" onClick={logout}>Esci</button>
      </div>
    </header>
  );
}
