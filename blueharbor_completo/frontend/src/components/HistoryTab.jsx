// ═══ SPRINT 8 ═══
// Storico in sola lettura, filtrabile per banchina. Nessuna azione di
// modifica: la riassegnazione resta fuori scope.
import { useEffect, useState } from 'react';
import { getHistory } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function HistoryTab({ berths }) {
  const [entries, setEntries] = useState([]);
  const [berthFilter, setBerthFilter] = useState('');
  const { showError } = useToast();

  useEffect(() => {
    getHistory({ berthId: berthFilter })
      .then(setEntries)
      .catch((err) => showError(err.message));
  }, [berthFilter]);

  return (
    <section aria-label="Storico assegnazioni">
      <h3>Storico assegnazioni</h3>
      <label htmlFor="history-berth">Filtra per banchina</label>
      <select id="history-berth" value={berthFilter}
              onChange={(e) => setBerthFilter(e.target.value)}>
        <option value="">Tutte</option>
        {berths.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
      <table>
        <caption>Eventi registrati ({entries.length})</caption>
        <thead>
          <tr>
            <th scope="col">Evento</th>
            <th scope="col">Nave</th>
            <th scope="col">Banchina</th>
            <th scope="col">Giorni</th>
            <th scope="col">Registrato</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td><span className={`badge badge-${entry.eventType.toLowerCase()}`}>{entry.eventType}</span></td>
              <td>{entry.shipName}</td>
              <td>{entry.berthName}</td>
              <td>{entry.occupationStartDay}–{entry.occupationEndDay}</td>
              <td>{new Date(entry.recordedAt).toLocaleString('it-IT')}</td>
            </tr>
          ))}
          {entries.length === 0 && <tr><td colSpan={5}>Nessun evento.</td></tr>}
        </tbody>
      </table>
    </section>
  );
}
