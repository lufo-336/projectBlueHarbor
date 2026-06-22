// frontend/src/components/BerthBoard.jsx
import React from 'react';
import './BerthBoard.css';

const BerthBoard = ({ berths, assignments, onAssignmentChange }) => {
  // Funzione per trovare la nave assegnata a una berth
  const getShipForBerth = (berthId) => {
    const assignment = assignments.find(a => a.berthId === berthId);
    return assignment ? assignment.ship : null;
  };

  // Funzione per ottenere il colore in base allo stato
  const getBerthColor = (berth) => {
    const ship = getShipForBerth(berth.id || berth._id);
    if (ship) {
      return 'occupied';
    }
    return 'available';
  };

  return (
    <div className="berth-board">
      <h2>Tabellone Berths</h2>
      
      {/* ✅ Griglia CSS Grid con 8 berths */}
      <div className="berth-board__grid">
        {berths.map((berth) => {
          const ship = getShipForBerth(berth.id || berth._id);
          const status = ship ? 'occupied' : 'available';
          
          return (
            <div 
              key={berth.id || berth._id}
              className={`berth-board__berth berth-board__berth--${status}`}
            >
              <div className="berth-board__berth-number">
                Berth #{berth.number}
              </div>
              
              <div className="berth-board__berth-size">
                Size: {berth.size}
              </div>
              
              {ship && (
                <div className="berth-board__berth-ship">
                  <div className="ship-name">{ship.name}</div>
                  <div className="ship-details">
                    <span>Arrivo: {ship.arrivalDay ? new Date(ship.arrivalDay).toLocaleDateString() : 'N/D'}</span>
                    <span>Durata: {ship.duration || 'N/D'} giorni</span>
                  </div>
                </div>
              )}
              
              {!ship && (
                <div className="berth-board__berth-status">
                  ✨ Disponibile
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="berth-board__legend">
        <span className="legend-item">
          <span className="legend-color available"></span>
          Disponibile
        </span>
        <span className="legend-item">
          <span className="legend-color occupied"></span>
          Occupata
        </span>
      </div>
    </div>
  );
};

export default BerthBoard;