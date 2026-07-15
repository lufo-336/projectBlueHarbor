import { useAuth } from './context/AuthContext.jsx';
import { DayProvider } from './context/DayContext.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import AuthPage from './views/AuthPage.jsx';
import Topbar from './components/Topbar.jsx';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner fullPage />;
  if (!user) return <AuthPage />;

  return (
    <DayProvider>
      <div className="app-shell">
        <Topbar />
        <main className="app-main">
          <div className="card">
            <p>Vista {user.role === 'Operator' ? 'Operatore' : 'Scheduler'} in arrivo nei Task 6-7.</p>
          </div>
        </main>
      </div>
    </DayProvider>
  );
}
