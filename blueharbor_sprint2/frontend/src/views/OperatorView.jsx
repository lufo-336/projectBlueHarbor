import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useDay } from '../context/DayContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import './OperatorView.css';

const STATUS_LABELS = { Pending: 'In attesa', Assigned: 'Assegnata', Departed: 'Partita' };

export default function OperatorView() {
  const { currentDay } = useDay();
  const { showSuccess, showError } = useToast();
  const [ships, setShips] = useState(null); // null = primo caricamento in corso
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadShips = useCallback(async () => {
    try {
      setShips(await api.getShips());
    } catch (err) {
      showError(err.message);
      setShips([]);
    }
  }, [showError]);

  // Ricarica al mount e a ogni Next Day (currentDay cambia nel DayContext).
  useEffect(() => { loadShips(); }, [loadShips, currentDay]);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const ship = await api.createShip(trimmed, notes.trim() || null);
      // Il toast mostra i dati GENERATI dal sistema: è il cuore del flusso Operatore.
      showSuccess(`${ship.name} registrata — taglia ${ship.size}, arrivo giorno ${ship.arrivalDay}, durata ${ship.duration}gg.`);
      setName('');
      setNotes('');
      await loadShips();
    } catch (err) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (ships === null) return <LoadingSpinner />;

  const count = (status) => ships.filter((s) => s.status === status).length;

  return (
    <div className="operator">
      <section className="operator__counters">
        <div className="card counter">
          <span className="counter__value mono">{count('Pending')}</span>
          <span>In attesa</span>
        </div>
        <div className="card counter">
          <span className="counter__value mono">{count('Assigned')}</span>
          <span>Assegnate</span>
        </div>
        <div className="card counter">
          <span className="counter__value mono">{count('Departed')}</span>
          <span>Partite</span>
        </div>
      </section>

      <section className="card">
        <h2>Registra nave</h2>
        <p className="operator__hint">
          Inserisci solo il nome: taglia, giorno di arrivo e durata li genera il sistema.
        </p>
        <form className="operator__form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="ship-name">Nome della nave</label>
            <input id="ship-name" value={name} onChange={(e) => setName(e.target.value)}
                   placeholder="Es. Aurora" required />
          </div>
          <div className="field">
            <label htmlFor="ship-notes">Note <span className="field__optional">(facoltative)</span></label>
            <textarea id="ship-notes" value={notes} onChange={(e) => setNotes(e.target.value)}
                      placeholder="Es. carico refrigerato, priorità alta…" rows={2} maxLength={255} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Registro…' : 'Registra'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Navi registrate</h2>
        {ships.length === 0 ? (
          <p className="operator__hint">Nessuna nave registrata: usa il form qui sopra.</p>
        ) : (
          <div className="operator__table-wrap">
            <table className="operator__table">
              <thead>
                <tr><th>Nome</th><th>Taglia</th><th>Arrivo</th><th>Durata</th><th>Stato</th><th>Banchina</th><th>Note</th></tr>
              </thead>
              <tbody>
                {ships.map((ship) => (
                  <tr key={ship.id}>
                    <td>{ship.name}</td>
                    <td><span className="badge badge-size">{ship.size}</span></td>
                    <td className="mono">g{ship.arrivalDay}</td>
                    <td className="mono">{ship.duration}gg</td>
                    <td>
                      <span className={`badge badge-${ship.status.toLowerCase()}`}>
                        {STATUS_LABELS[ship.status]}
                      </span>
                    </td>
                    <td className="mono">{ship.berthId ? `#${ship.berthId}` : '—'}</td>
                    <td className="operator__notes" title={ship.notes || ''}>{ship.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
