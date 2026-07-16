import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useDay } from '../context/DayContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import './OperatorView.css';

const STATUS_LABELS = { Pending: 'In attesa', Assigned: 'Assegnata', Departed: 'Partita' };
const PAGE_SIZE = 10;

export default function OperatorView() {
  const { currentDay } = useDay();
  const { showSuccess, showError } = useToast();
  const [data, setData] = useState(null); // null = primo caricamento in corso
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filtri e paginazione (guidano la query verso il backend).
  const [statusFilter, setStatusFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');
  const [page, setPage] = useState(1);

  const loadShips = useCallback(async () => {
    try {
      setData(await api.getShips({
        status: statusFilter,
        size: sizeFilter,
        page,
        pageSize: PAGE_SIZE,
      }));
    } catch (err) {
      showError(err.message);
      setData({ items: [], page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 0,
                counts: { pending: 0, assigned: 0, departed: 0 } });
    }
  }, [showError, statusFilter, sizeFilter, page]);

  // Ricarica al mount, quando cambiano filtri/pagina e a ogni Next Day.
  useEffect(() => { loadShips(); }, [loadShips, currentDay]);

  // Cambiare filtro riporta sempre alla prima pagina (altrimenti si potrebbe
  // restare su una pagina che il nuovo filtro non ha).
  function changeStatusFilter(value) { setStatusFilter(value); setPage(1); }
  function changeSizeFilter(value) { setSizeFilter(value); setPage(1); }

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

  if (data === null) return <LoadingSpinner />;

  const { items, total, totalPages, counts } = data;
  const filtersActive = statusFilter !== '' || sizeFilter !== '';

  return (
    <div className="operator">
      <section className="operator__counters">
        <div className="card counter">
          <span className="counter__value mono">{counts.pending}</span>
          <span>In attesa</span>
        </div>
        <div className="card counter">
          <span className="counter__value mono">{counts.assigned}</span>
          <span>Assegnate</span>
        </div>
        <div className="card counter">
          <span className="counter__value mono">{counts.departed}</span>
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
        <div className="operator__list-head">
          <h2>Navi registrate</h2>
          <div className="operator__filters">
            <label className="field field--inline">
              <span>Stato</span>
              <select value={statusFilter} onChange={(e) => changeStatusFilter(e.target.value)}>
                <option value="">Tutti</option>
                <option value="Pending">In attesa</option>
                <option value="Assigned">Assegnate</option>
                <option value="Departed">Partite</option>
              </select>
            </label>
            <label className="field field--inline">
              <span>Taglia</span>
              <select value={sizeFilter} onChange={(e) => changeSizeFilter(e.target.value)}>
                <option value="">Tutte</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
              </select>
            </label>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="operator__hint">
            {filtersActive
              ? 'Nessuna nave corrisponde ai filtri selezionati.'
              : 'Nessuna nave registrata: usa il form qui sopra.'}
          </p>
        ) : (
          <>
            <div className="operator__table-wrap">
              <table className="operator__table">
                <thead>
                  <tr><th>Nome</th><th>Taglia</th><th>Arrivo</th><th>Durata</th><th>Stato</th><th>Banchina</th><th>Note</th></tr>
                </thead>
                <tbody>
                  {items.map((ship) => (
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

            {totalPages > 1 && (
              <div className="operator__pager">
                <button type="button" className="btn"
                        disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  ← Precedente
                </button>
                <span className="operator__pager-info mono">
                  Pagina {page} di {totalPages} · {total} navi
                </span>
                <button type="button" className="btn"
                        disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Successiva →
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
