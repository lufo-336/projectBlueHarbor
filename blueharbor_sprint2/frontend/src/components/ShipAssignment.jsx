// frontend/src/components/ShipAssignment.jsx
import React, { useState } from 'react';
import { assignShip } from '../services/api';  // ← NUOVA API
import { useToast } from '../context/ToastContext';
import './ShipAssignment.css';

const ShipAssignment = ({ ship, onAssigned }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedBerth, setSelectedBerth] = useState('');
  const { showSuccess, showError } = useToast();

  // Le berths compatibili vengono dal parent (SchedulerView)
  // riceviamo la lista delle berths come prop
  const berths = ship?.compatibleBerths || [];

  const handleAssign = async () => {
    if (!selectedBerth) {
      setError('Seleziona una berth');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // ✅ NUOVO ENDPOINT: POST /api/ships/{id}/assign
      const result = await assignShip(ship.id, selectedBerth);
      showSuccess(`✅ Nave "${ship.name}" assegnata con successo!`);
      if (onAssigned) {
        onAssigned();
      }
    } catch (err) {
      const errorMsg = err.message || 'Errore nell\'assegnazione';
      setError(errorMsg);
      showError(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // ... resto del componente
};

export default ShipAssignment;