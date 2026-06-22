// frontend/src/components/SchedulerView.jsx
import React, { useState, useEffect } from 'react';
import { useRole } from '../context/RoleContext';
import PendingShipsList from './PendingShipsList';
import BerthBoard from './BerthBoard';
import { getShipsByStatus, getBerths, getAssignments } from '../services/api';
import './SchedulerView.css';

const SchedulerView = () => {
  const { role } = useRole();
  
  // Stati per i dati
  const [pendingShips, setPendingShips] = useState([]);
  const [berths, setBerths] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshCounter, setRefreshCounter] = useState(0);

  // ✅ Controllo del ruolo: visibile solo se Scheduler
  if (role !== 'Scheduler') {
    return null;
  }

  // Funzione per caricare tutti i dati
  const loadData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Carica navi Pending
      const pendingData = await getShipsByStatus('Pending');
      setPendingShips(pendingData);
      
      // Carica berths
      const berthsData = await getBerths();
      setBerths(berthsData);
      
      // Carica assegnazioni
      const assignmentsData = await getAssignments();
      setAssignments(assignmentsData);
      
    } catch (err) {
      setError('Errore nel caricamento dei dati: ' + err.message);
      console.error('Errore loadData:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carica i dati all'apertura e dopo ogni refresh
  useEffect(() => {
    loadData();
  }, [refreshCounter]);

  // Funzione per ricaricare i dati dopo un'assegnazione
  const refreshData = () => {
    setRefreshCounter(prev => prev + 1);
  };

  if (loading) {
    return <div className="scheduler-view__loading">Caricamento dati Scheduler...</div>;
  }

  if (error) {
    return <div className="scheduler-view__error">{error}</div>;
  }

  return (
    <div className="scheduler-view">
      <h1>Gestione Assegnazioni Berths</h1>
      
      <div className="scheduler-view__layout">
        {/* ✅ Colonna laterale: Lista navi Pending */}
        <div className="scheduler-view__sidebar">
          <PendingShipsList 
            ships={pendingShips} 
            onShipAssigned={refreshData}
          />
        </div>
        
        {/* ✅ Tabellone delle 8 berths */}
        <div className="scheduler-view__main">
          <BerthBoard 
            berths={berths}
            assignments={assignments}
            onAssignmentChange={refreshData}
          />
        </div>
      </div>
    </div>
  );
};

export default SchedulerView;