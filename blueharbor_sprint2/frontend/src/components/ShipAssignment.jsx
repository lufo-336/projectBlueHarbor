// frontend/src/components/ShipAssignment.jsx
import React, { useState } from 'react';
import { assignShip } from '../services/api';
import { useToast } from '../context/ToastContext';
import './ShipAssignment.css';

const ShipAssignment = ({ ship, berths, onAssigned }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedBerth, setSelectedBerth] = useState('');
  const { showSuccess, showError } = useToast();

  const compatibleBerths = berths || [];

  const handleAssign = async () => {
    if (!selectedBerth) {
      setError('Seleziona una berth');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await assignShip(ship.id, Number(selectedBerth));
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

  return (
    <div className="ship-assignment">
      {compatibleBerths.length === 0 ? (
        <p className="ship-assignment__empty">Nessuna banchina compatibile disponibile</p>
      ) : (
        <>
          <select
            className="ship-assignment__select"
            value={selectedBerth}
            onChange={(e) => setSelectedBerth(e.target.value)}
            disabled={loading}
          >
            <option value="">Seleziona una banchina...</option>
            {compatibleBerths.map((berth) => (
              <option key={berth.id} value={berth.id}>
                {berth.name} ({berth.size}) {berth.isOccupiedNow ? '— occupata ora' : '— libera'}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="ship-assignment__button"
            onClick={handleAssign}
            disabled={loading || !selectedBerth}
          >
            {loading ? 'Assegnazione in corso...' : 'Assegna'}
          </button>
        </>
      )}
      {error && <div className="ship-assignment__error">{error}</div>}
    </div>
  );
};

export default ShipAssignment;
