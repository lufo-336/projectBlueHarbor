import { useAuth } from './context/AuthContext.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import AuthPage from './views/AuthPage.jsx';

export default function App() {
  const { user, loading, logout } = useAuth();

  // Finché non sappiamo se il token salvato è valido non mostriamo niente
  // di definitivo: così al refresh non c'è il flash della pagina di login.
  if (loading) return <LoadingSpinner fullPage />;
  if (!user) return <AuthPage />;

  return (
    <div className="app-shell">
      <main className="app-main">
        <div className="card">
          <h1>Benvenuto, {user.name}</h1>
          <p>Ruolo: {user.role}. Topbar e viste operative arrivano nei Task 5-7.</p>
          <button className="btn btn-ghost" onClick={logout}>Esci</button>
        </div>
      </main>
    </div>
  );
}
