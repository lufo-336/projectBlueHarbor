// frontend/src/components/AuthPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const LANG_LABELS = { en: 'EN', it: 'IT', es: 'ES' };

function BrandLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="6" fill="var(--sahara)"/>
      <text x="20" y="26" textAnchor="middle" fontFamily="system-ui" fontWeight="900" fontSize="18" fill="var(--cobalt)">bh</text>
      <path d="M8 30 Q14 22 20 26 Q26 30 32 18" stroke="var(--cobalt)" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.4"/>
    </svg>
  );
}

export default function AuthPage() {
  const { login, loading: authLoading, error: authError } = useAuth();
  const { lang, setLang, t } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Il login aggiorna AuthContext e RoleContext automaticamente.
    } catch (err) {
      setError(err.message || t('loginError'));
    } finally {
      setLoading(false);
    }
  };

  const isLoading = loading || authLoading;

  return (
    <div className="auth-page">
      {/* Ocean SVG background */}
      <div className="auth-page__bg" aria-hidden="true">
        <svg className="auth-page__waves" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0D2545"/>
              <stop offset="60%" stopColor="#0A1C38"/>
              <stop offset="100%" stopColor="#061528"/>
            </linearGradient>
          </defs>
          <rect width="1440" height="900" fill="url(#ocean)"/>
          {/* Wave layers */}
          <path d="M0 600 Q180 540 360 580 Q540 620 720 560 Q900 500 1080 550 Q1260 600 1440 540 L1440 900 L0 900Z" fill="rgba(255,255,255,0.03)"/>
          <path d="M0 650 Q200 590 400 630 Q600 670 800 610 Q1000 550 1200 600 Q1350 630 1440 590 L1440 900 L0 900Z" fill="rgba(255,255,255,0.025)"/>
          <path d="M0 700 Q180 660 360 690 Q540 720 720 670 Q900 620 1080 660 Q1260 700 1440 650 L1440 900 L0 900Z" fill="rgba(255,255,255,0.02)"/>
          {/* Horizon glow */}
          <ellipse cx="400" cy="300" rx="600" ry="180" fill="rgba(200,164,90,0.06)"/>
          {/* Vessel silhouette */}
          <g transform="translate(80,340)" opacity="0.18" fill="var(--cobalt-dark,#061528)">
            <rect x="0" y="80" width="380" height="18" rx="4" fill="rgba(255,255,255,0.15)"/>
            <rect x="20" y="60" width="300" height="20" fill="rgba(255,255,255,0.12)"/>
            <rect x="40" y="10" width="40" height="52" rx="2" fill="rgba(255,255,255,0.10)"/>
            <rect x="55" y="0" width="6" height="14" fill="rgba(200,164,90,0.5)"/>
            <rect x="100" y="20" width="180" height="40" rx="2" fill="rgba(255,255,255,0.08)"/>
            {[0,30,60,90,120,150].map(x => (
              <rect key={x} x={110+x} y={24} width="22" height="32" rx="1" fill="rgba(200,164,90,0.25)"/>
            ))}
          </g>
          {/* Stars */}
          {[
            [100,80],[200,50],[350,100],[500,40],[650,90],[800,55],[950,70],[1100,45],[1300,85],[1400,60],
            [150,150],[450,170],[700,140],[900,160],[1200,130]
          ].map(([x,y],i) => (
            <circle key={i} cx={x} cy={y} r={i%3===0?1.5:1} fill="white" opacity={0.3+Math.random()*0.4}/>
          ))}
        </svg>

        {/* Hero text */}
        <div className="auth-page__hero-text">
          <p className="auth-page__tagline">{t('tagline')}</p>
          <h1 className="auth-page__hero-h1">
            <span className="auth-page__hero-line1">{t('heroLine1')}</span>
            <span className="auth-page__hero-line2">{t('heroLine2')}</span>
          </h1>
          <p className="auth-page__hero-sub">{t('heroSub')}</p>
        </div>
      </div>

      {/* Top bar */}
      <div className="auth-topbar">
        <div className="auth-topbar__brand">
          <BrandLogo size={36}/>
          <span className="auth-topbar__name">{t('brand')}</span>
        </div>
        <div className="auth-topbar__right">
          {Object.entries(LANG_LABELS).map(([code, label]) => (
            <button key={code} onClick={() => setLang(code)}
              className={`auth-topbar__lang${lang===code?' auth-topbar__lang--active':''}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Auth panel — MSC-style white card on right */}
      <div className="auth-panel-wrap">
        <div className="auth-panel">
          <form className="auth-form" onSubmit={handleLogin} noValidate>
            <div className="auth-form__field">
              <label className="auth-form__label">{t('email')}</label>
              <input
                className="auth-form__input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="name@company.com"
              />
            </div>
            <div className="auth-form__field">
              <div className="auth-form__label-row">
                <label className="auth-form__label">{t('password')}</label>
              </div>
              <div className="auth-form__pw-wrap">
                <input
                  className="auth-form__input"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="auth-form__pw-toggle"
                  onClick={() => setShowPw(s => !s)}
                  aria-label="Toggle password"
                >
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {(error || authError) && (
              <p className="auth-form__error">{error || authError}</p>
            )}

            <button className="auth-btn" type="submit" disabled={isLoading}>
              {isLoading ? t('loggingIn') : t('signIn')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
