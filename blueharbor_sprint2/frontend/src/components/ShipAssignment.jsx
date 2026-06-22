// frontend/src/components/ShipAssignment.jsx
import React, { useState, useEffect } from 'react';
import { getBerths, assignShipToBerth } from '../services/api';
import './ShipAssignment.css';

const ShipAssignment = ({ ship, onAssigned }) => {
  const [berths, setBerths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedBerth, setSelectedBerth] = useState('');

  // Carica le berths disponibili
  useEffect(() => {
    const loadBerths = async () => {
      try {
        const data = await getBerths();
        // ✅ Filtra solo le berths compatibili (size >= ship.size)
        const compatibleBerths = data.filter(berth => 
          berth.status === 'Available' && 
          berth.size >= (ship.size || 0)
        );
        setBerths(compatibleBerths);
      } catch (err) {
        setError('Errore nel caricamento delle berths');
        console.error(err);
      }
    };
    
    loadBerths();
  }, [ship]);

  const handleAssign = async () => {
    if (!selectedBerth) {
      setError('Seleziona una berth');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // ✅ POST all'API per l'assegnazione
      await assignShipToBerth(ship.id || ship._id, selectedBerth);
      
      // ✅ Aggiornamento immediato
      if (onAssigned) {
        onAssigned();
      }
    } catch (err) {
      setError('Errore nell\'assegnazione: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ship-assignment">
      <h4>Assegna a Berth</h4>
      
      {/* ✅ Menu con le sole berths compatibili */}
      <select 
        value={selectedBerth}
        onChange={(e) => setSelectedBerth(e.target.value)}
        disabled={loading || berths.length === 0}
        className="ship-assignment__select"
      >
        <option value="">Seleziona una berth...</option>
        {berths.map((berth) => (
          <option key={berth.id || berth._id} value={berth.id || berth._id}>
            Berth #{berth.number} (Size: {berth.size})
          </option>
        ))}
      </select>

      {berths.length === 0 && !loading && (
        <p className="ship-assignment__no-berths">
          Nessuna berth compatibile disponibile
        </p>
      )}

      <button 
        onClick={handleAssign}
        disabled={loading || !selectedBerth || berths.length === 0}
        className="ship-assignment__button"
      >
        {loading ? 'Assegnazione in corso...' : 'Assegna'}
      </button>

      {error && <p className="ship-assignment__error">{error}</p>}
    </div>
  );
};

export default ShipAssignment;