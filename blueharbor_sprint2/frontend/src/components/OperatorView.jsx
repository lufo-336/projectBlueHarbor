// frontend/src/components/OperatorView.jsx
import React, { useState, useEffect } from 'react';
import ShipForm from './ShipForm';
import ShipTable from './ShipTable';
import { getCurrentDay } from '../services/api';

const OperatorView = ({ refreshTrigger }) => {
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [currentDay, setCurrentDay] = useState(null);

  useEffect(() => {
    if (refreshTrigger !== undefined) {
      setRefreshCounter(prev => prev + 1);
    }
  }, [refreshTrigger]);

  useEffect(() => {
    getCurrentDay().then(setCurrentDay).catch(() => {});
  }, [refreshCounter]);

  const refreshTable = () => {
    setRefreshCounter(prev => prev + 1);
  };

  return (
    <div className="operator-view">
      <div className="operator-view__day-info">
        <span>📅 Giorno Corrente: <strong>{currentDay ?? '—'}</strong></span>
      </div>
      <div className="operator-view__form-section">
        <ShipForm onShipCreated={refreshTable} />
      </div>
      <div className="operator-view__table-section">
        <ShipTable refreshCounter={refreshCounter} />
      </div>
    </div>
  );
};

export default OperatorView;
