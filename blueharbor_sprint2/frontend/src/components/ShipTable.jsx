// components/ShipTable.jsx
import React, { useState, useEffect } from 'react';
import { getShips } from '../services/api';

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
    return <div className="ship-table__loading">Caricamento navi...</div>;
  }

  if (error) {
    return <div className="ship-table__error">{error}</div>;
  }

  return (
    <div className="ship-table">
      <h2>Storico Navi</h2>
      {ships.length === 0 ? (
        <p className="ship-table__empty">Nessuna nave registrata</p>
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
            {ships.map((ship) => (
              <tr key={ship.id || ship._id}>
                <td>{ship.name}</td>
                <td>{ship.size || '-'}</td>
                <td>{ship.arrivalDay ? new Date(ship.arrivalDay).toLocaleDateString() : '-'}</td>
                <td>{ship.duration || '-'}</td>
                <td>{ship.status || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ShipTable;