// ═══ SPRINT 3 ═══
// Navi in attesa + azione di assegnazione: per ogni nave un menu con le SOLE
// banchine compatibili (stessa Size) e il pulsante Assegna.
import { useState } from 'react';
import { assignShip } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function PendingShipsList({ pendingShips, berths, onAssigned }) {
  const { showSuccess, showError } = useToast();
  // Banchina selezionata per ogni nave: { [shipId]: berthId }
  const [selection, setSelection] = useState({});
  const [assigningId, setAssigningId] = useState(null);

  const handleAssign = async (ship) => {
    const berthId = Number(selection[ship.id]);
    if (!berthId) return;
    setAssigningId(ship.id);
    try {
      const updated = await assignShip(ship.id, berthId);
      // Il server ha calcolato l'accodamento: comunichiamo il giorno REALE.
      showSuccess(`"${updated.name}" assegnata: inizio giorno ${updated.occupationStartDay}`);
      onAssigned();
    } catch (err) {
      showError(err.message); // es. 409 "Size incompatibile..."
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <section aria-label="Navi in attesa">
      <h3>In attesa ({pendingShips.length})</h3>
      <ul className="pending-list">
        {pendingShips.map((ship) => {
          // Filtro di compatibilità FATTO ANCHE QUI (oltre che sul server):
          // l'interfaccia non deve nemmeno proporre scelte invalide (Sprint 5).
          const compatible = berths.filter((b) => b.size === ship.size);
          return (
            <li key={ship.id} className="pending-item">
              <span>
                <strong>{ship.name}</strong> — {ship.size}, arrivo g.{ship.arrivalDay}, {ship.duration} gg
              </span>
              <label htmlFor={`berth-${ship.id}`} className="visually-hidden">
                Banchina per {ship.name}
              </label>
              <select id={`berth-${ship.id}`} value={selection[ship.id] ?? ''}
                      onChange={(e) => setSelection({ ...selection, [ship.id]: e.target.value })}>
                <option value="">Scegli banchina…</option>
                {compatible.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <button onClick={() => handleAssign(ship)}
                      disabled={!selection[ship.id] || assigningId === ship.id}>
                {assigningId === ship.id ? 'Assegnazione…' : 'Assegna'}
              </button>
            </li>
          );
        })}
        {pendingShips.length === 0 && <li>Nessuna nave in attesa.</li>}
      </ul>
    </section>
  );
}
