import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useDay } from '../context/DayContext.jsx';
import { usePrefs, useT, useDayLabel } from '../context/PrefsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../services/api.js';
import { requestBerthFocus } from '../services/nav.js';
import './Topbar.css';

export default function Topbar() {
  const { user, logout } = useAuth();
  const { currentDay, setCurrentDay } = useDay();
  const { theme, timeMode, lang, toggleTheme, toggleTimeMode, setLang } = usePrefs();
  const t = useT();
  const fmtDay = useDayLabel();
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
      showSuccess(t('topbar.nowDay', { n: day }));
    } catch (err) {
      showError(err.message);
    } finally {
      setAdvancing(false);
    }
  }

  // In modalità "Data" mostra la data calendario estesa; in "Giorno" la parola
  // "Giorno N" (fmtDay in modalità date proietta o ripiega su gN/dN da solo).
  const dateStr = fmtDay(currentDay, { mode: 'date' });
  const role = t(`roles.${user.role}`);
  const initial = role.charAt(0).toUpperCase();
  // Solo Scheduler e Admin possono aprire lo Scheduler; l'Operatore non vi ha
  // accesso, quindi per lui le celle restano informative (non cliccabili).
  const canOpenScheduler = user.role === 'Scheduler' || user.role === 'Admin';

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

      {summary?.berths && (
        <div className="topbar__berthmap" aria-label={t('topbar.berthsAria')}>
          <span className="topbar__berthmap-label">
            {t('topbar.berths')} <b className="mono">{summary.berthsOccupied}/{summary.berthsTotal}</b>
          </span>
          <span className="bmap">
            {summary.berths.map((b, i) => {
              const groupStart = i > 0 && b.size !== summary.berths[i - 1].size;
              const stateKey = b.state === 'maintenance' ? 'maintenance'
                             : b.state === 'occupied' ? 'occupied' : 'free';
              const label = t(`topbar.berthState.${stateKey}`);
              const cls = `bmap-cell bmap-cell--${b.state}${groupStart ? ' bmap-cell--gap' : ''}`;
              return canOpenScheduler ? (
                <button key={b.id} type="button" className={`${cls} bmap-cell--btn`}
                        title={`${b.name} · ${label} · ${t('topbar.openInScheduler')}`}
                        onClick={() => requestBerthFocus(b.id)}>
                  {b.size}
                </button>
              ) : (
                <span key={b.id} className={cls} title={`${b.name} · ${label}`}>
                  {b.size}
                </span>
              );
            })}
          </span>
        </div>
      )}

      <div className="topbar__right">
        {/* Giorno virtuale + Next Day: un'unica unità coesa. */}
        <div className="topbar__daybox">
          <span className="topbar__day mono">
            {timeMode === 'date'
              ? dateStr
              : (currentDay === null ? t('common.dash') : t('topbar.dayN', { n: currentDay }))}
          </span>
          <button className="btn btn-gold topbar__next" onClick={handleNextDay} disabled={advancing}>
            {advancing ? t('topbar.advancing') : t('topbar.nextDay')}
          </button>
        </div>

        {/* Gruppo strumenti: formato tempo + lingua + tema. */}
        <div className="topbar__tools">
          <div className="seg" role="group" aria-label={t('topbar.timeFormatAria')}>
            <button type="button" className={timeMode === 'day' ? 'is-active' : ''}
                    aria-pressed={timeMode === 'day'}
                    onClick={() => timeMode !== 'day' && toggleTimeMode()}>{t('topbar.day')}</button>
            <button type="button" className={timeMode === 'date' ? 'is-active' : ''}
                    aria-pressed={timeMode === 'date'}
                    onClick={() => timeMode !== 'date' && toggleTimeMode()}>{t('topbar.date')}</button>
          </div>
          <div className="seg" role="group" aria-label={t('topbar.languageAria')}>
            <button type="button" className={lang === 'it' ? 'is-active' : ''}
                    aria-pressed={lang === 'it'}
                    onClick={() => lang !== 'it' && setLang('it')}>IT</button>
            <button type="button" className={lang === 'en' ? 'is-active' : ''}
                    aria-pressed={lang === 'en'}
                    onClick={() => lang !== 'en' && setLang('en')}>EN</button>
          </div>
          <button type="button" className="topbar__icon-btn" onClick={toggleTheme}
                  title={theme === 'dark' ? t('common.themeToLight') : t('common.themeToDark')}
                  aria-label={theme === 'dark' ? t('common.themeToLight') : t('common.themeToDark')}>
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>

        <div className="topbar__identity" title={user.email}>
          <span className="topbar__avatar" aria-hidden="true">{initial}</span>
          <span className="topbar__role-single">{role}</span>
          <button className="btn btn-ghost btn-sm topbar__logout" onClick={logout}>{t('topbar.logout')}</button>
        </div>
      </div>
    </header>
  );
}
