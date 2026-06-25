// frontend/src/components/OperatorView.jsx
import React, { useState, useEffect } from 'react';
import ShipForm from './ShipForm';
import ShipTable from './ShipTable';
import { useRole } from '../context/RoleContext';
import { useDay } from '../context/DayContext';
import LoadingSpinner from './common/LoadingSpinner';  // ← NUOVO
import { getShips } from '../services/api';

const OperatorView = ({ refreshTrigger }) => {
  const { role } = useRole();
  const { currentDay } = useDay();
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [loading, setLoading] = useState(false);  // ← NUOVO

  useEffect(() => {
    if (refreshTrigger !== undefined) {
      setRefreshCounter(prev => prev + 1);
    }
  }, [refreshTrigger]);

  if (role !== 'Operator') {
    return null;
  }

  const refreshTable = () => {
    setRefreshCounter(prev => prev + 1);
  };

  return (
    <div className="operator-view">
      <div className="operator-view__day-info">
        <span>📅 Giorno Corrente: <strong>{currentDay}</strong></span>
      </div>
      <div className="operator-view__form-section">
        <ShipForm onShipCreated={refreshTable} />
      </div>
      <div className="operator-view__table-section">
        {loading ? (
          <LoadingSpinner message="Caricamento navi..." />  // ← NUOVO
        ) : (
          <ShipTable refreshCounter={refreshCounter} />
        )}
      </div>
    </div>
  );
};

export default OperatorView;