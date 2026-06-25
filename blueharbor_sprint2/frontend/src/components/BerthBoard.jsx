// frontend/src/components/BerthBoard.jsx
import React from 'react';
import './BerthBoard.css';

const BerthBoard = ({ berths, onAssignmentChange }) => {
  return (
    <div className="berth-board">
      <h2>Tabellone Berths</h2>
      
      <div className="berth-board__grid">
        {berths.map((berth) => {
          // ✅ isOccupiedNow viene dal backend!
          const isOccupied = berth.isOccupiedNow;
          const assignments = berth.assignments || [];
          const currentAssignment = assignments[0]; // Prendi la prima occupazione
          
          return (
            <div 
              key={berth.id}
              className={`berth-board__berth berth-board__berth--${isOccupied ? 'occupied' : 'available'}`}
            >
              <div className="berth-board__berth-number">
                Berth #{berth.name}
              </div>
              
              <div className="berth-board__berth-size">
                Size: {berth.size}
              </div>
              
              {isOccupied && currentAssignment && (
                <div className="berth-board__berth-ship">
                  <div className="ship-name">{currentAssignment.shipName}</div>
                  <div className="ship-details">
                    <span>Da giorno: {currentAssignment.startDay}</span>
                    <span>Fino a: {currentAssignment.endDay}</span>
                  </div>
                </div>
              )}
              
              {!isOccupied && (
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