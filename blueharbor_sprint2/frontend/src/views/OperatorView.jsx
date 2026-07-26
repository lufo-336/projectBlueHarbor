import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api.js';
import { useDay } from '../context/DayContext.jsx';
import { useDayLabel, useDurationLabel, useT } from '../context/PrefsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { randomShipName } from '../services/shipNames.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import Modal from '../components/Modal.jsx';
import './OperatorView.css';

const PAGE_SIZE = 10;

export default function OperatorView() {
  const { currentDay } = useDay();
  const fmtDay = useDayLabel();
  const fmtDuration = useDurationLabel();
  const t = useT();
  const { showSuccess, showError } = useToast();
  const [data, setData] = useState(null); // null = primo caricamento in corso
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState(null); // id della nave in fase di annullamento
  const [highlightId, setHighlightId] = useState(null); // nave appena creata, evidenziata
  const [editing, setEditing] = useState(null); // nave in modifica (o null)
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Filtri, ricerca e paginazione (guidano la query verso il backend).
  const [statusFilter, setStatusFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');
  const [search, setSearch] = useState('');   // valore digitato (immediato)
  const [q, setQ] = useState('');              // valore applicato (debounced)
  const [page, setPage] = useState(1);
  const searchTimer = useRef(null);
  const highlightTimer = useRef(null);
  const notesRef = useRef(null);

  // Textarea che cresce da sola col contenuto (fino a un massimo, poi scorre):
  // niente maniglia di resize, si comporta come un normale blocco di testo.
  function resizeNotes(el) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

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
      showSuccess(t('operator.toastRegistered', {
        name: ship.name, size: ship.size,
        arrival: fmtDay(ship.arrivalDay), duration: fmtDuration(ship.duration),
      }));
      setName('');
      setNotes('');
      requestAnimationFrame(() => resizeNotes(notesRef.current)); // ripristina l'altezza
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
    if (!window.confirm(t('operator.confirmCancel', { name: ship.name }))) return;
    setCancellingId(ship.id);
    try {
      await api.cancelShip(ship.id);
      showSuccess(t('operator.toastCancelled', { name: ship.name }));
      // Se era l'ultima riga della pagina, torna indietro di una pagina.
      if (data.items.length === 1 && page > 1) setPage((p) => p - 1);
      else await loadShips();
    } catch (err) {
      showError(err.message);
    } finally {
      setCancellingId(null);
    }
  }

  // Modifica dei metadati (nome, note): responsabilità dell'Operatore.
  function openEdit(ship) {
    setEditing(ship);
    setEditName(ship.name);
    setEditNotes(ship.notes || '');
  }

  async function handleSaveEdit(event) {
    event.preventDefault();
    const trimmed = editName.trim();
    if (!trimmed) return;
    setSavingEdit(true);
    try {
      await api.updateShip(editing.id, trimmed, editNotes.trim() || null);
      showSuccess(t('operator.toastUpdated', { name: trimmed }));
      setEditing(null);
      await loadShips();
    } catch (err) {
      showError(err.message);
    } finally {
      setSavingEdit(false);
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
          <span>{t('operator.counters.pending')}</span>
        </div>
        <div className="card counter">
          <span className="counter__value mono">{counts.assigned}</span>
          <span>{t('operator.counters.assigned')}</span>
        </div>
        <div className="card counter">
          <span className="counter__value mono">{counts.departed}</span>
          <span>{t('operator.counters.departed')}</span>
        </div>
      </section>

      <section className="card">
        <h2>{t('operator.registerShip')}</h2>
        <p className="operator__hint">{t('operator.registerHint')}</p>
        <form className="operator__form" onSubmit={handleSubmit}>
          <div className="field operator__field-name">
            <label htmlFor="ship-name">{t('common.shipName')}</label>
            <div className="operator__name-row">
              <input id="ship-name" value={name} onChange={(e) => setName(e.target.value)}
                     placeholder={t('operator.shipNamePlaceholder')} required />
              <button type="button" className="btn btn-ghost operator__dice"
                      onClick={handleRandomName} title={t('operator.diceTitle')} aria-label={t('operator.diceAria')}>
                🎲
              </button>
            </div>
          </div>
          <div className="field operator__field-notes">
            <label htmlFor="ship-notes">{t('common.notes')} <span className="field__optional">{t('common.optional')}</span></label>
            <textarea id="ship-notes" ref={notesRef} value={notes}
                      onChange={(e) => { setNotes(e.target.value); resizeNotes(e.target); }}
                      placeholder={t('operator.notesPlaceholder')} rows={2} maxLength={2000} />
          </div>
          <button type="submit" className="btn btn-primary operator__submit" disabled={submitting}>
            {submitting ? t('operator.registering') : t('operator.register')}
          </button>
        </form>
      </section>

      <section className="card">
        <div className="operator__list-head">
          <h2>{t('operator.registeredShips')}</h2>
          <div className="operator__filters">
            <label className="field field--inline operator__search">
              <span>{t('common.search')}</span>
              <input type="search" value={search} placeholder={t('common.shipSearchPlaceholder')}
                     onChange={(e) => changeSearch(e.target.value)} />
            </label>
            <label className="field field--inline">
              <span>{t('common.status')}</span>
              <select value={statusFilter} onChange={(e) => changeStatusFilter(e.target.value)}>
                <option value="">{t('common.allMasc')}</option>
                <option value="Pending">{t('operator.counters.pending')}</option>
                <option value="Assigned">{t('operator.counters.assigned')}</option>
                <option value="Departed">{t('operator.counters.departed')}</option>
              </select>
            </label>
            <label className="field field--inline">
              <span>{t('common.size')}</span>
              <select value={sizeFilter} onChange={(e) => changeSizeFilter(e.target.value)}>
                <option value="">{t('common.allFem')}</option>
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
            {filtersActive ? t('operator.emptyFiltered') : t('operator.emptyNone')}
          </p>
        ) : (
          <>
            <div className="operator__table-wrap">
              <table className="operator__table">
                <thead>
                  <tr>
                    <th>{t('common.name')}</th><th>{t('common.size')}</th><th>{t('common.arrival')}</th>
                    <th>{t('common.duration')}</th><th>{t('common.status')}</th><th>{t('common.berth')}</th>
                    <th>{t('common.notes')}</th><th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((ship) => (
                    <tr key={ship.id} className={ship.id === highlightId ? 'is-new' : ''}>
                      <td className="operator__name-cell">{ship.name}</td>
                      <td><span className="badge badge-size">{ship.size}</span></td>
                      <td className="mono">{fmtDay(ship.arrivalDay)}</td>
                      <td>{fmtDuration(ship.duration)}</td>
                      <td>
                        <span className={`badge badge-${ship.status.toLowerCase()}`}>
                          {t(`status.${ship.status}`)}
                        </span>
                      </td>
                      <td>{ship.berthName ?? t('common.dash')}</td>
                      <td className="operator__notes" title={ship.notes || ''}>{ship.notes || t('common.dash')}</td>
                      <td>
                        <div className="operator__row-actions">
                          <button type="button" className="btn btn-ghost btn-sm"
                                  onClick={() => openEdit(ship)}>{t('common.edit')}</button>
                          {ship.status === 'Pending' && (
                            <button type="button" className="btn btn-danger btn-sm"
                                    disabled={cancellingId === ship.id}
                                    onClick={() => handleCancel(ship)}>
                              {cancellingId === ship.id ? t('operator.cancelling') : t('common.cancel')}
                            </button>
                          )}
                        </div>
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
                  {t('common.prev')}
                </button>
                <span className="operator__pager-info mono">
                  {t('operator.pagerInfo', { page, totalPages, total })}
                </span>
                <button type="button" className="btn"
                        disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  {t('common.next')}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {editing && (
        <Modal title={t('operator.editShip')} onClose={() => setEditing(null)}>
          <form className="operator__edit-form" onSubmit={handleSaveEdit}>
            <div className="field">
              <label htmlFor="edit-name">{t('common.shipName')}</label>
              <input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="edit-notes">{t('common.notes')} <span className="field__optional">{t('common.optional')}</span></label>
              <textarea id="edit-notes" value={editNotes} onChange={(e) => setEditNotes(e.target.value)}
                        rows={4} maxLength={2000} className="operator__edit-notes" />
            </div>
            <div className="operator__edit-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>{t('common.cancel')}</button>
              <button type="submit" className="btn btn-primary" disabled={savingEdit || !editName.trim()}>
                {savingEdit ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
