// ═══ SPRINT 1 (auth SPRINT 6) ═══
// Smistamento delle viste: login → vista per ruolo. refreshKey è il
// meccanismo di "refresh globale" dello Sprint 4: il Next Day lo incrementa
// e le viste (che lo hanno nelle dipendenze dei loro useEffect) si ricaricano.
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DayProvider } from './context/DayContext';
import { ToastProvider } from './context/ToastContext';
import LoginView from './components/LoginView';
import Topbar from './components/Topbar';
import OperatorView from './components/OperatorView';
import SchedulerView from './components/SchedulerView';
import Toast from './components/Toast';
import './App.css';

function AppContent() {
  const { user, loading } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  if (loading) return <p className="app-loading" role="status">Caricamento…</p>;
  if (!user) return <LoginView />;

  return (
    <>
      <Topbar onDayAdvanced={() => setRefreshKey((k) => k + 1)} />
      <main>
        {user.role === 'Operator'
          ? <OperatorView refreshKey={refreshKey} />
          : <SchedulerView refreshKey={refreshKey} />}
      </main>
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DayProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </DayProvider>
    </AuthProvider>
  );
}
