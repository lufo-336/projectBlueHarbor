// frontend/src/components/ShipTable.jsx
import React, { useState, useEffect } from 'react';
import { getShips } from '../services/api';
import LoadingSpinner from './common/LoadingSpinner';  // ← NUOVO

const ShipTable = ({ refreshCounter }) => {
  const [ships, setShips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadShips = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getShips();
      setShips(data);
    } catch (err) {
      setError('Errore nel caricamento: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShips();
  }, [refreshCounter]);

  if (loading) {
    return <LoadingSpinner message="Caricamento navi..." />;  // ← MODIFICATO
  }

  if (error) {
    return <div className="ship-table__error">{error}</div>;
  }

  // ✅ Filtra le navi: mostra solo quelle non Departed
  const activeShips = ships.filter(ship => ship.status !== 'Departed');
  const departedShips = ships.filter(ship => ship.status === 'Departed');

  return (
    <div className="ship-table">
      <h2>Storico Navi</h2>
      
      {/* Navi Attive */}
      <div className="ship-table__section">
        <h3>🚢 Navi Attive</h3>
        {activeShips.length === 0 ? (
          <p className="ship-table__empty">Nessuna nave attiva</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Size</th>
                <th>ArrivalDay</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {activeShips.map((ship) => (
                <tr key={ship.id || ship._id}>
                  <td>{ship.name}</td>
                  <td>{ship.size || '-'}</td>
                  <td>{ship.arrivalDay ? new Date(ship.arrivalDay).toLocaleDateString() : '-'}</td>
                  <td>{ship.duration || '-'}</td>
                  <td>
                    <span className={`status-badge status-${ship.status?.toLowerCase()}`}>
                      {ship.status || '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ✅ Navi Concluse (Departed) - Mostrate come "concluse" */}
      {departedShips.length > 0 && (
        <div className="ship-table__section departed">
          <h3>✅ Navi Concluse (Departed)</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Size</th>
                <th>ArrivalDay</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {departedShips.map((ship) => (
                <tr key={ship.id || ship._id} className="departed-row">
                  <td>{ship.name}</td>
                  <td>{ship.size || '-'}</td>
                  <td>{ship.arrivalDay ? new Date(ship.arrivalDay).toLocaleDateString() : '-'}</td>
                  <td>{ship.duration || '-'}</td>
                  <td>
                    <span className="status-badge status-departed">
                      ✅ Conclusa
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ShipTable;