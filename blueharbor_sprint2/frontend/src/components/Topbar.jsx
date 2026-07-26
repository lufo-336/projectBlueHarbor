import { useEffect, useState } from 'react';
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
  const [summary, setSummary] = useState(null);

  // Riepilogo terminal per la navbar: si aggiorna a ogni Next Day e ogni 12s.
  useEffect(() => {
    let alive = true;
    const load = () => api.getSummary().then((s) => { if (alive) setSummary(s); }).catch(() => {});
    load();
    const id = setInterval(load, 12000);
    return () => { alive = false; clearInterval(id); };
  }, [currentDay]);

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
  const dateStr = date && date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
  const dayStr = currentDay === null ? '—' : String(currentDay);
  const role = roleLabel(user.role);
  const initial = role.charAt(0).toUpperCase();

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <span className="topbar__logo" aria-hidden="true">
          <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="9" fill="url(#bh-logo)" />
            <path d="M5 19c2.6 0 2.6-2.2 5.2-2.2S12.8 19 15.4 19 18 16.8 20.6 16.8 23.2 19 25.8 19"
                  stroke="#0A1628" strokeWidth="2.1" strokeLinecap="round" />
            <path d="M6.2 23.4c2.6 0 2.6-2.2 5.2-2.2s2.6 2.2 5.2 2.2 2.6-2.2 5.2-2.2"
                  stroke="#0A1628" strokeWidth="2.1" strokeLinecap="round" opacity="0.5" />
            <defs>
              <linearGradient id="bh-logo" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#E3C588" /><stop offset="1" stopColor="#C8A45A" />
              </linearGradient>
            </defs>
          </svg>
        </span>
        <span className="topbar__wordmark">
          <span className="topbar__name">BlueHarbor</span>
          <span className="topbar__sub">Terminal</span>
        </span>
      </div>

      {summary && (
        <div className="topbar__summary" aria-label="Riepilogo del terminal">
          <span className="topbar__stat"><b className="mono">{summary.pending}</b> in attesa</span>
          <span className="topbar__stat"><b className="mono">{summary.assigned}</b> assegnate</span>
          <span className="topbar__stat"><b className="mono">{summary.departed}</b> partite</span>
          <span className="topbar__stat topbar__stat--berths">
            <b className="mono">{summary.berthsOccupied}/{summary.berthsTotal}</b> banchine occupate
          </span>
        </div>
      )}

      <div className="topbar__right">
        {/* Giorno virtuale + Next Day: un'unica unità coesa. */}
        <div className="topbar__daybox">
          <span className="topbar__day mono">
            {timeMode === 'date' ? (dateStr ?? '—') : `Giorno ${dayStr}`}
          </span>
          <button className="btn btn-gold topbar__next" onClick={handleNextDay} disabled={advancing}>
            {advancing ? 'Avanzo…' : 'Next Day →'}
          </button>
        </div>

        {/* Gruppo strumenti: formato tempo + tema. */}
        <div className="topbar__tools">
          <div className="seg" role="group" aria-label="Formato del tempo">
            <button type="button" className={timeMode === 'day' ? 'is-active' : ''}
                    aria-pressed={timeMode === 'day'}
                    onClick={() => timeMode !== 'day' && toggleTimeMode()}>Giorno</button>
            <button type="button" className={timeMode === 'date' ? 'is-active' : ''}
                    aria-pressed={timeMode === 'date'}
                    onClick={() => timeMode !== 'date' && toggleTimeMode()}>Data</button>
          </div>
          <button type="button" className="topbar__icon-btn" onClick={toggleTheme}
                  title={theme === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
                  aria-label={theme === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro'}>
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>

        <div className="topbar__identity" title={user.email}>
          <span className="topbar__avatar" aria-hidden="true">{initial}</span>
          <span className="topbar__role-single">{role}</span>
          <button className="btn btn-ghost btn-sm topbar__logout" onClick={logout}>Esci</button>
        </div>
      </div>
    </header>
  );
}
