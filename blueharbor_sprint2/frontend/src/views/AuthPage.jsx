import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import './AuthPage.css';

// Account del seed backend: comodi da compilare al volo durante le demo.
const DEMO_ACCOUNTS = [
  { label: 'Operatore', email: 'operator@blueharbor', password: 'operator123' },
  { label: 'Scheduler', email: 'scheduler@blueharbor', password: 'scheduler123' },
];

export default function AuthPage() {
  const { login } = useAuth();
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
      setError(err.message); // es. "Credenziali non valide." (dal Problem Details)
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      {/* Colonna scura: brand + numeri del terminal (estetica "manifesto di carico") */}
      <section className="auth-hero">
        <div className="auth-hero__brand mono">⚓ BLUEHARBOR TERMINAL</div>
        <h1 className="auth-hero__title">La banchina giusta,<br />al giorno giusto.</h1>
        <p className="auth-hero__subtitle">Gestione arrivi e ormeggi del terminal container.</p>
        <dl className="auth-hero__stats">
          <div><dt className="mono">08</dt><dd>banchine operative</dd></div>
          <div><dt className="mono">S–XL</dt><dd>taglie nave gestite</dd></div>
          <div><dt className="mono">+30gg</dt><dd>orizzonte arrivi</dd></div>
        </dl>
      </section>

      {/* Colonna chiara: il form di accesso */}
      <section className="auth-panel">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Accedi</h2>
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
            {submitting ? 'Accesso in corso…' : 'Entra'}
          </button>

          <div className="auth-form__demo">
            <span>Account demo:</span>
            {DEMO_ACCOUNTS.map((account) => (
              <button key={account.email} type="button" className="btn btn-ghost"
                      onClick={() => { setEmail(account.email); setPassword(account.password); }}>
                {account.label}
              </button>
            ))}
          </div>
        </form>
      </section>
    </div>
  );
}
