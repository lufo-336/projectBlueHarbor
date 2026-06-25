// frontend/src/components/SchedulerView.jsx
import React, { useState, useEffect } from 'react';
import { useRole } from '../context/RoleContext';
import { useDay } from '../context/DayContext';
import { useToast } from '../context/ToastContext';
import PendingShipsList from './PendingShipsList';
import BerthBoard from './BerthBoard';
import LoadingSpinner from './common/LoadingSpinner';
import { getSchedulerDashboard } from '../services/api';  // ← NUOVA API
import './SchedulerView.css';

const SchedulerView = ({ refreshTrigger }) => {
  const { role } = useRole();
  const { currentDay } = useDay();
  const { showError } = useToast();
  
  const [pendingShips, setPendingShips] = useState([]);
  const [berths, setBerths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshCounter, setRefreshCounter] = useState(0);

  if (role !== 'Scheduler') {
    return null;
  }

  useEffect(() => {
    if (refreshTrigger !== undefined) {
      setRefreshCounter(prev => prev + 1);
    }
  }, [refreshTrigger]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // ✅ UNA SOLA CHIAMATA invece di 3!
      const dashboard = await getSchedulerDashboard();
      setPendingShips(dashboard.pendingShips);
      setBerths(dashboard.berths);
    } catch (err) {
      const errorMsg = err.message || 'Errore nel caricamento della dashboard';
      setError(errorMsg);
      showError(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshCounter]);

  const refreshData = () => {
    setRefreshCounter(prev => prev + 1);
  };

  if (loading) {
    return <LoadingSpinner message="Caricamento dati Scheduler..." />;
  }

  if (error) {
    return <div className="scheduler-view__error">{error}</div>;
  }

  return (
    <div className="scheduler-view">
      <h1>Gestione Assegnazioni Berths</h1>
      <div className="scheduler-view__day-info">
        <span>📅 Giorno Corrente: <strong>{currentDay}</strong></span>
      </div>
      
      <div className="scheduler-view__layout">
        <div className="scheduler-view__sidebar">
          <PendingShipsList 
            ships={pendingShips} 
            onShipAssigned={refreshData}
          />
        </div>
        
        <div className="scheduler-view__main">
          <BerthBoard 
            berths={berths}
            assignments={[]}  // ← Le assegnazioni sono già dentro le berths!
            onAssignmentChange={refreshData}
          />
        </div>
      </div>
    </div>
  );
};

export default SchedulerView;