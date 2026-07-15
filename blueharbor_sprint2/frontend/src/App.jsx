import { useAuth } from './context/AuthContext.jsx';
import { DayProvider } from './context/DayContext.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import AuthPage from './views/AuthPage.jsx';
import Topbar from './components/Topbar.jsx';
import OperatorView from './views/OperatorView.jsx';
import SchedulerView from './views/SchedulerView.jsx';

export default function App() {
  const { user, loading } = useAuth();

  // Finché non sappiamo se il token salvato è valido non mostriamo niente
  // di definitivo: così al refresh non c'è il flash della pagina di login.
  if (loading) return <LoadingSpinner fullPage />;
  if (!user) return <AuthPage />;

  return (
    <DayProvider>
      <div className="app-shell">
        <Topbar />
        <main className="app-main">
          {user.role === 'Operator' ? <OperatorView /> : <SchedulerView />}
        </main>
      </div>
    </DayProvider>
  );
}
