import { useAuth } from './context/AuthContext.jsx';
import { DayProvider } from './context/DayContext.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import AuthPage from './views/AuthPage.jsx';
import Topbar from './components/Topbar.jsx';
import OperatorView from './views/OperatorView.jsx';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner fullPage />;
  if (!user) return <AuthPage />;

  return (
    <DayProvider>
      <div className="app-shell">
        <Topbar />
        <main className="app-main">
          {user.role === 'Operator'
            ? <OperatorView />
            : <div className="card"><p>Vista Scheduler in arrivo nel Task 7.</p></div>}
        </main>
      </div>
    </DayProvider>
  );
}
