import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api.js';
import { useDay } from '../context/DayContext.jsx';
import { useDayLabel } from '../context/PrefsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatDuration } from '../services/time.js';
import { randomShipName } from '../services/shipNames.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import './OperatorView.css';

const STATUS_LABELS = { Pending: 'In attesa', Assigned: 'Assegnata', Departed: 'Partita' };
const PAGE_SIZE = 10;

export default function OperatorView() {
  const { currentDay } = useDay();
  const fmtDay = useDayLabel();
  const { showSuccess, showError } = useToast();
  const [data, setData] = useState(null); // null = primo caricamento in corso
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState(null); // id della nave in fase di annullamento
  const [highlightId, setHighlightId] = useState(null); // nave appena creata, evidenziata

  // Filtri, ricerca e paginazione (guidano la query verso il backend).
  const [statusFilter, setStatusFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');
  const [search, setSearch] = useState('');   // valore digitato (immediato)
  const [q, setQ] = useState('');              // valore applicato (debounced)
  const [page, setPage] = useState(1);
  const searchTimer = useRef(null);
  const highlightTimer = useRef(null);

  const loadShips = useCallback(async () => {
    try {
      setData(await api.getShips({
        status: statusFilter,
        size: sizeFilter,
        q,
        page,
        pageSize: PAGE_SIZE,
      }));
    } catch (err) {
      showError(err.message);
      setData({ items: [], page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 0,
                counts: { pending: 0, assigned: 0, departed: 0 } });
    }
  }, [showError, statusFilter, sizeFilter, q, page]);

  // Ricarica al mount, quando cambiano filtri/ricerca/pagina e a ogni Next Day.
  useEffect(() => { loadShips(); }, [loadShips, currentDay]);

  // Cambiare filtro riporta sempre alla prima pagina (altrimenti si potrebbe
  // restare su una pagina che il nuovo filtro non ha).
  function changeStatusFilter(value) { setStatusFilter(value); setPage(1); }
  function changeSizeFilter(value) { setSizeFilter(value); setPage(1); }

  // Ricerca per nome con debounce: l'input è immediato, la query parte dopo
  // 300ms di pausa (niente una richiesta per tasto). Nessun useEffect dedicato.
  function changeSearch(value) {
    setSearch(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setQ(value.trim()); setPage(1); }, 300);
  }

  function handleRandomName() { setName(randomShipName()); }

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const ship = await api.createShip(trimmed, notes.trim() || null);
      // Il toast mostra i dati GENERATI dal sistema: è il cuore del flusso Operatore.
      showSuccess(`${ship.name} registrata — taglia ${ship.size}, arrivo ${fmtDay(ship.arrivalDay)}, durata ${formatDuration(ship.duration)}.`);
      setName('');
      setNotes('');
      // Evidenzia la nave appena creata (se ricade nella pagina visibile).
      setHighlightId(ship.id);
      clearTimeout(highlightTimer.current);
      highlightTimer.current = setTimeout(() => setHighlightId(null), 2600);
      await loadShips();
    } catch (err) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Annulla una nave: consentito solo finché è Pending (il backend lo impone con 409).
  async function handleCancel(ship) {
    if (!window.confirm(`Annullare la nave "${ship.name}"? L'operazione è definitiva.`)) return;
    setCancellingId(ship.id);
    try {
      await api.cancelShip(ship.id);
      showSuccess(`Nave "${ship.name}" annullata.`);
      // Se era l'ultima riga della pagina, torna indietro di una pagina.
      if (data.items.length === 1 && page > 1) setPage((p) => p - 1);
      else await loadShips();
    } catch (err) {
      showError(err.message);
    } finally {
      setCancellingId(null);
    }
  }

  if (data === null) return <LoadingSpinner />;

  const { items, total, totalPages, counts } = data;
  const filtersActive = statusFilter !== '' || sizeFilter !== '' || q !== '';

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
          <div className="field operator__field-name">
            <label htmlFor="ship-name">Nome della nave</label>
            <div className="operator__name-row">
              <input id="ship-name" value={name} onChange={(e) => setName(e.target.value)}
                     placeholder="Es. Aurora" required />
              <button type="button" className="btn btn-ghost operator__dice"
                      onClick={handleRandomName} title="Genera un nome" aria-label="Genera un nome casuale">
                🎲
              </button>
            </div>
          </div>
          <div className="field operator__field-notes">
            <label htmlFor="ship-notes">Note <span className="field__optional">(facoltative)</span></label>
            <textarea id="ship-notes" value={notes} onChange={(e) => setNotes(e.target.value)}
                      placeholder="Es. carico refrigerato, priorità alta…" rows={2} maxLength={255} />
          </div>
          <button type="submit" className="btn btn-primary operator__submit" disabled={submitting}>
            {submitting ? 'Registro…' : 'Registra'}
          </button>
        </form>
      </section>

      <section className="card">
        <div className="operator__list-head">
          <h2>Navi registrate</h2>
          <div className="operator__filters">
            <label className="field field--inline operator__search">
              <span>Cerca</span>
              <input type="search" value={search} placeholder="nome nave…"
                     onChange={(e) => changeSearch(e.target.value)} />
            </label>
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
                  <tr><th>Nome</th><th>Taglia</th><th>Arrivo</th><th>Durata</th><th>Stato</th><th>Banchina</th><th>Note</th><th>Azioni</th></tr>
                </thead>
                <tbody>
                  {items.map((ship) => (
                    <tr key={ship.id} className={ship.id === highlightId ? 'is-new' : ''}>
                      <td className="operator__name-cell">{ship.name}</td>
                      <td><span className="badge badge-size">{ship.size}</span></td>
                      <td className="mono">{fmtDay(ship.arrivalDay)}</td>
                      <td>{formatDuration(ship.duration)}</td>
                      <td>
                        <span className={`badge badge-${ship.status.toLowerCase()}`}>
                          {STATUS_LABELS[ship.status]}
                        </span>
                      </td>
                      <td>{ship.berthName ?? '—'}</td>
                      <td className="operator__notes" title={ship.notes || ''}>{ship.notes || '—'}</td>
                      <td>
                        {ship.status === 'Pending' ? (
                          <button type="button" className="btn btn-danger btn-sm"
                                  disabled={cancellingId === ship.id}
                                  onClick={() => handleCancel(ship)}>
                            {cancellingId === ship.id ? 'Annullo…' : 'Annulla'}
                          </button>
                        ) : (
                          <span className="operator__no-action">—</span>
                        )}
                      </td>
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
