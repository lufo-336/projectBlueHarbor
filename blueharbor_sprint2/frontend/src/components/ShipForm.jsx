// components/ShipForm.jsx
import React, { useState } from 'react';
import { createShip } from '../services/api';

const ShipForm = ({ onShipCreated }) => {
  const [shipName, setShipName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!shipName.trim()) {
      setError('Il nome della nave è obbligatorio');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await createShip(shipName.trim());
      setShipName('');
      if (onShipCreated) {
        onShipCreated();
      }
    } catch (err) {
      setError('Errore durante la registrazione: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ship-form">
      <h2>Registrazione Nuova Nave</h2>
      <form onSubmit={handleSubmit}>
        <div className="ship-form__group">
          <label htmlFor="shipName">Nome della nave:</label>
          <input
            id="shipName"
            type="text"
            value={shipName}
            onChange={(e) => setShipName(e.target.value)}
            placeholder="Inserisci il nome della nave"
            disabled={loading}
          />
          <button 
            type="submit" 
            disabled={loading || !shipName.trim()}
          >
            {loading ? 'Registrazione in corso...' : 'Register'}
          </button>
        </div>
        {error && <div className="ship-form__error">{error}</div>}
      </form>
    </div>
  );
};

export default ShipForm;