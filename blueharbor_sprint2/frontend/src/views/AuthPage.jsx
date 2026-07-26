import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { usePrefs, useT, useErrorText } from '../context/PrefsContext.jsx';
import './AuthPage.css';

// Account del seed backend: comodi da compilare al volo durante le demo.
// La label è la chiave del ruolo (tradotta a runtime), l'email/password sono fisse.
const DEMO_ACCOUNTS = [
  { role: 'Operator', email: 'operator@blueharbor', password: 'operator123' },
  { role: 'Scheduler', email: 'scheduler@blueharbor', password: 'scheduler123' },
  { role: 'Admin', email: 'admin@blueharbor', password: 'admin123' },
];

export default function AuthPage() {
  const { login } = useAuth();
  const { theme, lang, toggleTheme, setLang } = usePrefs();
  const t = useT();
  const te = useErrorText();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password); // al successo App smonta questa pagina
    } catch (err) {
      setError(te(err.message)); // es. "Credenziali non valide." (dal Problem Details)
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-tools">
        <div className="seg" role="group" aria-label={t('topbar.languageAria')}>
          <button type="button" className={lang === 'it' ? 'is-active' : ''}
                  aria-pressed={lang === 'it'}
                  onClick={() => lang !== 'it' && setLang('it')}>IT</button>
          <button type="button" className={lang === 'en' ? 'is-active' : ''}
                  aria-pressed={lang === 'en'}
                  onClick={() => lang !== 'en' && setLang('en')}>EN</button>
        </div>
        <button type="button" className="auth-theme-toggle" onClick={toggleTheme}
                title={theme === 'dark' ? t('common.themeToLight') : t('common.themeToDark')}
                aria-label={theme === 'dark' ? t('common.themeToLight') : t('common.themeToDark')}>
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </div>
      {/* Colonna scura: brand + numeri del terminal (estetica "manifesto di carico") */}
      <section className="auth-hero">
        <div className="auth-hero__brand mono">⚓ BLUEHARBOR TERMINAL</div>
        <h1 className="auth-hero__title">{t('auth.heroTitleL1')}<br />{t('auth.heroTitleL2')}</h1>
        <p className="auth-hero__subtitle">{t('auth.subtitle')}</p>
        <dl className="auth-hero__stats">
          <div><dt className="mono">08</dt><dd>{t('auth.stat1')}</dd></div>
          <div><dt className="mono">S–XL</dt><dd>{t('auth.stat2')}</dd></div>
          <div><dt className="mono">{t('auth.statHorizonValue')}</dt><dd>{t('auth.stat3')}</dd></div>
        </dl>
      </section>

      {/* Colonna chiara: il form di accesso */}
      <section className="auth-panel">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>{t('auth.signIn')}</h2>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} required
                   onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} required
                   onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          {error && <p className="auth-form__error" role="alert">{error}</p>}
          <button type="submit" className="btn btn-gold" disabled={submitting}>
            {submitting ? t('auth.entering') : t('auth.enter')}
          </button>

          <div className="auth-form__demo">
            <span>{t('auth.demoAccounts')}</span>
            {DEMO_ACCOUNTS.map((account) => (
              <button key={account.email} type="button" className="btn btn-ghost"
                      onClick={() => { setEmail(account.email); setPassword(account.password); }}>
                {t(`roles.${account.role}`)}
              </button>
            ))}
          </div>
        </form>
      </section>
    </div>
  );
}
