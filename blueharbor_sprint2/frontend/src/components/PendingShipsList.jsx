// frontend/src/components/PendingShipsList.jsx
import React, { useState } from 'react';
import ShipAssignment from './ShipAssignment';
import './PendingShipsList.css';

const PendingShipsList = ({ ships, onShipAssigned }) => {
  const [selectedShip, setSelectedShip] = useState(null);

  // Se non ci sono navi pending
  if (!ships || ships.length === 0) {
    return (
      <div className="pending-ships-list">
        <h3>Navi in Attesa (Pending)</h3>
        <p className="pending-ships-list__empty">Nessuna nave in attesa di assegnazione</p>
      </div>
    );
  }

  return (
    <div className="pending-ships-list">
      <h3>Navi in Attesa (Pending)</h3>
      <p className="pending-ships-list__count">{ships.length} navi in attesa</p>
      
      <div className="pending-ships-list__items">
        {ships.map((ship) => (
          <div 
            key={ship.id || ship._id}
            className={`pending-ships-list__item ${selectedShip?.id === ship.id ? 'selected' : ''}`}
            onClick={() => setSelectedShip(ship)}
          >
            <div className="pending-ships-list__item-header">
              <strong>{ship.name}</strong>
            </div>
            
            {/* ✅ Dettagli: Size, ArrivalDay, Duration */}
            <div className="pending-ships-list__item-details">
              <div className="detail">
                <span className="detail-label">Size:</span>
                <span className="detail-value">{ship.size || 'N/D'}</span>
              </div>
              <div className="detail">
                <span className="detail-label">Arrival Day:</span>
                <span className="detail-value">
                  {ship.arrivalDay ? new Date(ship.arrivalDay).toLocaleDateString() : 'N/D'}
                </span>
              </div>
              <div className="detail">
                <span className="detail-label">Duration:</span>
                <span className="detail-value">{ship.duration || 'N/D'} giorni</span>
              </div>
            </div>
            
            {/* ✅ Azione di assegnazione */}
            {selectedShip?.id === ship.id && (
              <div className="pending-ships-list__assignment">
                <ShipAssignment 
                  ship={ship}
                  onAssigned={() => {
                    setSelectedShip(null);
                    onShipAssigned();
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingShipsList;