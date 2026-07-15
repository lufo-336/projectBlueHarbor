// ═══ SPRINT 6 ═══
// Porta d'ingresso dell'app: sostituisce il vecchio selettore libero di ruolo.
// Accessibilità (Sprint 10): label associate, errore annunciato via role="alert".
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginView() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault(); // niente ricaricamento pagina: gestiamo noi il POST
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message); // "Credenziali non valide" dal ProblemDetails
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-view">
      <h1>BlueHarbor Terminal</h1>
      <form onSubmit={handleSubmit} className="login-form">
        <label htmlFor="username">Username</label>
        <input id="username" value={username} autoComplete="username"
               onChange={(e) => setUsername(e.target.value)} required />

        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={password} autoComplete="current-password"
               onChange={(e) => setPassword(e.target.value)} required />

        {/* role="alert": lo screen reader annuncia subito l'errore */}
        {error && <p className="form-error" role="alert">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Accesso…' : 'Accedi'}
        </button>
      </form>
    </main>
  );
}
