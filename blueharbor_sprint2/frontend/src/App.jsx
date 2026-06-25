// frontend/src/App.jsx
import React, { useState } from 'react';
import { RoleProvider, useRole } from './context/RoleContext';
import { DayProvider } from './context/DayContext';
import { ToastProvider } from './context/ToastContext';  // ← NUOVO
import Topbar from './components/Topbar';
import OperatorView from './components/OperatorView';
import SchedulerView from './components/SchedulerView';
import ProtectedRoute from './components/common/ProtectedRoute';  // ← NUOVO
import './App.css';

function AppContent() {
  const { role } = useRole();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDayChange = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <>
      <Topbar onDayChange={handleDayChange} />
      <main className="app__main">
        {/* ✅ Solo Operator può vedere OperatorView */}
        <ProtectedRoute allowedRoles={['Operator']}>
          <OperatorView refreshTrigger={refreshTrigger} />
        </ProtectedRoute>

        {/* ✅ Solo Scheduler può vedere SchedulerView */}
        <ProtectedRoute allowedRoles={['Scheduler']}>
          <SchedulerView refreshTrigger={refreshTrigger} />
        </ProtectedRoute>

        {/* Se il ruolo non è riconosciuto */}
        {!['Operator', 'Scheduler'].includes(role) && (
          <div className="app__placeholder">
            <div className="app__placeholder-content">
              <span className="app__placeholder-icon">🔒</span>
              <h2>Ruolo Non Riconosciuto</h2>
              <p>Il tuo ruolo: <strong>{role}</strong></p>
              <p className="text-muted">Contatta l'amministratore per i permessi.</p>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

function App() {
  return (
    <RoleProvider>
      <DayProvider>
        <ToastProvider>  {/* ← NUOVO */}
          <AppContent />
        </ToastProvider>
      </DayProvider>
    </RoleProvider>
  );
}

export default App;