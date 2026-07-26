import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useDay } from '../context/DayContext.jsx';
import { usePrefs } from '../context/PrefsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../services/api.js';
import { dayToDate } from '../services/time.js';
import { roleLabel } from '../services/roles.js';
import './Topbar.css';

export default function Topbar() {
  const { user, logout } = useAuth();
  const { currentDay, setCurrentDay, day1Date } = useDay();
  const { theme, timeMode, toggleTheme, toggleTimeMode } = usePrefs();
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

  // Data calendario derivata dal giorno virtuale (solo proiezione, mai logica).
  const date = currentDay !== null ? dayToDate(currentDay, day1Date) : null;
  const dateStr = date && date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  const dayStr = currentDay === null ? '—' : String(currentDay).padStart(2, '0');
  const role = roleLabel(user.role);
  const initial = role.charAt(0).toUpperCase();

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <span aria-hidden="true">⚓</span>
        <span>BlueHarbor Terminal</span>
      </div>

      <div className="topbar__clock">
        <span className="topbar__day mono">
          {timeMode === 'date' ? (dateStr ?? '—') : `GIORNO ${dayStr}`}
        </span>
        <button className="btn btn-gold" onClick={handleNextDay} disabled={advancing}>
          {advancing ? 'Avanzo…' : 'Next Day →'}
        </button>
      </div>

      <div className="topbar__right">
        {/* Toggle formato tempo: giorno virtuale gN <-> data calendario. */}
        <div className="seg" role="group" aria-label="Formato del tempo">
          <button type="button" className={timeMode === 'day' ? 'is-active' : ''}
                  aria-pressed={timeMode === 'day'}
                  onClick={() => timeMode !== 'day' && toggleTimeMode()}>Giorno</button>
          <button type="button" className={timeMode === 'date' ? 'is-active' : ''}
                  aria-pressed={timeMode === 'date'}
                  onClick={() => timeMode !== 'date' && toggleTimeMode()}>Data</button>
        </div>

        {/* Toggle tema chiaro/scuro. */}
        <button type="button" className="topbar__icon-btn" onClick={toggleTheme}
                title={theme === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
                aria-label={theme === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro'}>
          {theme === 'dark' ? '☀' : '☾'}
        </button>

        <div className="topbar__identity" title={user.email}>
          <span className="topbar__avatar" aria-hidden="true">{initial}</span>
          <span className="topbar__role-single">{role}</span>
        </div>

        <button className="btn btn-ghost topbar__logout" onClick={logout}>Esci</button>
      </div>
    </header>
  );
}
