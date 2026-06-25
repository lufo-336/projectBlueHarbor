import React, { useState } from 'react';
import { RoleProvider, useRole } from './context/RoleContext';
import { DayProvider } from './context/DayContext';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Topbar from './components/Topbar';
import OperatorView from './components/OperatorView';
import SchedulerView from './components/SchedulerView';
import AuthPage from './components/AuthPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import './App.css';

function AppContent() {
  const { role } = useRole();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (!user) return <AuthPage />;

  return (
    <>
      <Topbar onDayChange={() => setRefreshTrigger(p => p + 1)} />
      <main className="app__main">
        <ProtectedRoute allowedRoles={['Operator']}>
          <OperatorView refreshTrigger={refreshTrigger} />
        </ProtectedRoute>
        <ProtectedRoute allowedRoles={['Scheduler']}>
          <SchedulerView refreshTrigger={refreshTrigger} />
        </ProtectedRoute>
        {!['Operator','Scheduler'].includes(role) && (
          <div className="app__placeholder">
            <div className="app__placeholder-content">
              <span className="app__placeholder-icon">🔒</span>
              <h2>{t('unknownRole')}</h2>
              <p>{t('unknownRoleDesc')}: <strong>{role}</strong></p>
              <p className="text-muted">{t('unknownRoleHelp')}</p>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <RoleProvider>
          <DayProvider>
            <ToastProvider>
              <AppContent />
            </ToastProvider>
          </DayProvider>
        </RoleProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
