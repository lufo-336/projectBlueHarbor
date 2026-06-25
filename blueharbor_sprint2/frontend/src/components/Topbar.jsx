import React, { useState } from 'react';
import { useRole } from '../context/RoleContext';
import { useDay } from '../context/DayContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const LANG_LABELS = { en: 'EN', it: 'IT', es: 'ES' };

function BrandLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="6" fill="var(--sahara)"/>
      <text x="20" y="26" textAnchor="middle" fontFamily="system-ui" fontWeight="900" fontSize="18" fill="var(--cobalt)">bh</text>
      <path d="M8 30 Q14 22 20 26 Q26 30 32 18" stroke="var(--cobalt)" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.4"/>
    </svg>
  );
}

export default function Topbar({ onDayChange }) {
  const { role, setRole } = useRole();
  const { day, setDay } = useDay();
  const { lang, setLang, t } = useLanguage();
  const { user, logout } = useAuth();
  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const handleDayChange = (e) => { setDay(e.target.value); onDayChange?.(); };

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <BrandLogo/>
        <span className="topbar__brand-name">{t('brand')}</span>
        <span className="topbar__tagline-pill">{t('tagline')}</span>
      </div>

      <nav className="topbar__controls">
        {/* Day */}
        <label className="topbar__control">
          <span className="topbar__label">{t('day')}</span>
          <input type="date" className="topbar__input" value={day} onChange={handleDayChange}/>
        </label>

        {/* Role */}
        <label className="topbar__control">
          <span className="topbar__label">{t('role')}</span>
          <select className="topbar__select" value={role} onChange={e => setRole(e.target.value)}>
            <option value="Operator">{t('operator')}</option>
            <option value="Scheduler">{t('scheduler')}</option>
          </select>
        </label>

        {/* Language */}
        <div className="topbar__lang">
          <button className="topbar__lang-btn" onClick={() => setLangOpen(o => !o)} aria-expanded={langOpen}>
            <svg viewBox="0 0 20 20" fill="none" width="14" height="14"><circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.2"/><ellipse cx="10" cy="10" rx="3.5" ry="8.5" stroke="currentColor" strokeWidth="1.2"/><path d="M2 7.5h16M2 12.5h16" stroke="currentColor" strokeWidth="1.2"/></svg>
            {LANG_LABELS[lang]}
          </button>
          {langOpen && (
            <ul className="topbar__dropdown" role="menu" onClick={() => setLangOpen(false)}>
              {Object.entries(LANG_LABELS).map(([code, label]) => (
                <li key={code}>
                  <button className={`topbar__dropdown-item${lang===code?' topbar__dropdown-item--active':''}`}
                    role="menuitem" onClick={() => setLang(code)}>
                    {label}{lang===code && <span className="topbar__check">✓</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* User menu */}
        <div className="topbar__user">
          <button className="topbar__user-btn" onClick={() => setUserOpen(o => !o)} aria-expanded={userOpen}>
            <span className="topbar__avatar">{user?.name?.[0]?.toUpperCase() ?? '?'}</span>
            <span className="topbar__user-name">{user?.name}</span>
            <svg viewBox="0 0 12 12" fill="none" width="10" height="10"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
          {userOpen && (
            <ul className="topbar__dropdown topbar__dropdown--right" role="menu" onClick={() => setUserOpen(false)}>
              <li className="topbar__dropdown-info">
                <span className="topbar__dropdown-name">{user?.name}</span>
                <span className="topbar__dropdown-email">{user?.email}</span>
              </li>
              <li className="topbar__dropdown-divider"/>
              <li>
                <button className="topbar__dropdown-item topbar__dropdown-item--danger" role="menuitem" onClick={logout}>
                  {t('logout')}
                </button>
              </li>
            </ul>
          )}
        </div>
      </nav>
    </header>
  );
}
