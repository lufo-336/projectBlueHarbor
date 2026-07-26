import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api.js';
import { computeOccupationStartDay, isCompatible } from '../services/scheduling.js';
import { useDay } from '../context/DayContext.jsx';
import { useDayLabel } from '../context/PrefsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatDuration } from '../services/time.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import Modal from '../components/Modal.jsx';
import './SchedulerView.css';

// Colonne visibili della timeline: windowStart .. windowStart+13, dove
// windowStart = currentDay + horizonOffset.
// NB: deve combaciare con repeat(14, ...) in SchedulerView.css.
const TIMELINE_DAYS = 14;
const WHEEL_STEP = 2; // giorni spostati per "scatto" di rotella

const EVENT_LABELS = { Assigned: 'Assegnata', Departed: 'Partita' };

// Limite fino a cui ha senso muovere la finestra: copre 30 giorni, tutte le
// occupazioni/manutenzioni note e gli arrivi in attesa.
function maxHorizonOffset(d) {
  let end = d.currentDay + 30;
  for (const b of d.berths) {
    for (const a of b.assignments) end = Math.max(end, a.endDay);
    for (const m of b.maintenances) end = Math.max(end, m.endDay);
  }
  for (const s of d.pendingShips) end = Math.max(end, s.arrivalDay + s.duration);
  const maxStart = Math.max(d.currentDay, end - TIMELINE_DAYS + 1);
  return maxStart - d.currentDay;
}

export default function SchedulerView() {
  const { currentDay } = useDay();
  const fmtDay = useDayLabel();
  const { showSuccess, showError } = useToast();
  const [dashboard, setDashboard] = useState(null); // null = primo caricamento
  const [selectedShipId, setSelectedShipId] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [unassigningId, setUnassigningId] = useState(null); // nave in fase di annullo assegnazione
  const [editingAssignment, setEditingAssignment] = useState(null); // assegnazione in modifica
  const [assignForm, setAssignForm] = useState({ berthId: '', name: '', notes: '' });
  const [savingAssign, setSavingAssign] = useState(false);
  const [tip, setTip] = useState(null); // tooltip timeline (compare con delay)
  const [flashShipId, setFlashShipId] = useState(null); // nave evidenziata dopo il salto
  const tipTimer = useRef(null);
  const flashTimer = useRef(null);
  const [history, setHistory] = useState(null); // storico assegnazioni (sola lettura)
  const [eventFilter, setEventFilter] = useState('');
  const [exporting, setExporting] = useState(false);
  // Finestra visibile della timeline: scostamento in giorni oltre "oggi".
  const [horizonOffset, setHorizonOffset] = useState(0);

  // Ref-specchio di dashboard e offset: servono al gestore rotella (nativo,
  // non-passivo) per leggere lo stato aggiornato senza closure stantie.
  // Aggiornati in effect (non durante il render).
  const dashboardRef = useRef(dashboard);
  const offsetRef = useRef(horizonOffset);
  const timelineRef = useRef(null);
  useEffect(() => { dashboardRef.current = dashboard; }, [dashboard]);
  useEffect(() => { offsetRef.current = horizonOffset; }, [horizonOffset]);

  const loadDashboard = useCallback(async () => {
    try {
      setDashboard(await api.getSchedulerDashboard());
    } catch (err) {
      showError(err.message);
    }
  }, [showError]);

  const loadHistory = useCallback(async () => {
    try {
      setHistory(await api.getHistory({ eventType: eventFilter }));
    } catch (err) {
      showError(err.message);
      setHistory([]);
    }
  }, [showError, eventFilter]);

  // Ricarica al mount, a ogni Next Day (nuove partenze) e dopo un'assegnazione.
  useEffect(() => { loadDashboard(); }, [loadDashboard, currentDay]);
  useEffect(() => { loadHistory(); }, [loadHistory, currentDay]);

  // Al cambio del giorno reale (Next Day) la finestra torna su "oggi".
  const [lastSeenDay, setLastSeenDay] = useState(currentDay);
  if (lastSeenDay !== currentDay) {
    setLastSeenDay(currentDay);
    setHorizonOffset(0);
  }

  // Rotella del mouse sulla timeline = spostamento della finestra nel tempo.
  // Listener nativo non-passivo (React rende onWheel passivo: non potrebbe
  // chiamare preventDefault). Ai bordi lascia scorrere la pagina.
  const ready = dashboard !== null;
  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return undefined;
    function onWheel(e) {
      if (!e.deltaY) return;
      const d = dashboardRef.current;
      if (!d) return;
      const max = maxHorizonOffset(d);
      const forward = e.deltaY > 0;
      const o = offsetRef.current;
      if ((forward && o >= max) || (!forward && o <= 0)) return; // bordo: scorre la pagina
      e.preventDefault();
      const next = Math.min(Math.max(0, o + (forward ? WHEEL_STEP : -WHEEL_STEP)), max);
      setHorizonOffset(next);
    }
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [ready]);

  // Porta la finestra sul giorno in cui la nave verrebbe REALMENTE collocata:
  // il primo slot libero sulla banchina compatibile più disponibile (tiene conto
  // delle code/accavallamenti), non il semplice giorno d'arrivo. Un giorno di
  // contesto prima.
  function offsetForArrival(d, ship) {
    let placement = Math.max(d.currentDay, ship.arrivalDay);
    let earliest = Infinity;
    for (const b of d.berths) {
      if (!isCompatible(ship.size, b.size)) continue;
      const occ = [
        ...b.assignments.map((a) => ({ start: a.startDay, end: a.endDay })),
        ...b.maintenances.map((m) => ({ start: m.startDay, end: m.endDay })),
      ];
      earliest = Math.min(earliest, computeOccupationStartDay(ship.arrivalDay, ship.duration, d.currentDay, occ));
    }
    if (Number.isFinite(earliest)) placement = earliest;
    const start = Math.max(d.currentDay, placement - 1);
    return Math.min(Math.max(0, start - d.currentDay), maxHorizonOffset(d));
  }

  function selectShip(ship) {
    const nextId = ship.id === selectedShipId ? null : ship.id;
    setSelectedShipId(nextId);
    if (nextId !== null) setHorizonOffset(offsetForArrival(dashboard, ship));
  }

  async function handleAssign(berth, selectedShip) {
    if (!selectedShip || assigning) return;
    setAssigning(true);
    try {
      const result = await api.assignShip(selectedShip.id, berth.id);
      // Fa fede il giorno calcolato dal SERVER, non l'anteprima client.
      showSuccess(`${result.name} assegnata a ${berth.name}: occupazione dal ${fmtDay(result.occupationStartDay)}.`);
      setSelectedShipId(null);
      await Promise.all([loadDashboard(), loadHistory()]);
    } catch (err) {
      showError(err.message);
    } finally {
      setAssigning(false);
    }
  }

  // Annulla un'assegnazione finché l'occupazione non è iniziata (torna Pending).
  async function handleUnassign(a) {
    if (!window.confirm(`Annullare l'assegnazione di "${a.shipName}"? La nave tornerà in attesa.`)) return;
    setUnassigningId(a.shipId);
    try {
      await api.unassignShip(a.shipId);
      showSuccess(`Assegnazione di "${a.shipName}" annullata: la nave torna in attesa.`);
      setSelectedShipId(null);
      await Promise.all([loadDashboard(), loadHistory()]);
    } catch (err) {
      showError(err.message);
    } finally {
      setUnassigningId(null);
    }
  }

  // Apre il modale di modifica di un'assegnazione (banchina + nome + note).
  function openAssignmentEdit(a) {
    setEditingAssignment(a);
    setAssignForm({ berthId: String(a.berthId), name: a.shipName, notes: a.notes || '' });
  }

  async function handleSaveAssignment(event) {
    event.preventDefault();
    const name = assignForm.name.trim();
    if (!name) return;
    setSavingAssign(true);
    try {
      const r = await api.editAssignment(
        editingAssignment.shipId, Number(assignForm.berthId), name, assignForm.notes.trim() || null);
      showSuccess(`Assegnazione di "${r.name}" aggiornata: occupazione dal ${fmtDay(r.occupationStartDay)}.`);
      setEditingAssignment(null);
      await Promise.all([loadDashboard(), loadHistory()]);
    } catch (err) {
      showError(err.message);
    } finally {
      setSavingAssign(false);
    }
  }

  // Tooltip ricco sulla timeline: compare dopo un breve delay di hover.
  function showTipFor(event, content) {
    clearTimeout(tipTimer.current);
    const r = event.currentTarget.getBoundingClientRect();
    const anchor = { x: r.left + r.width / 2, y: r.bottom + 6 };
    tipTimer.current = setTimeout(() => setTip({ ...anchor, ...content }), 550);
  }
  function hideTip() { clearTimeout(tipTimer.current); setTip(null); }

  // Evidenzia (lampeggio) una nave dopo che la timeline ci è saltata sopra.
  function flashShip(shipId) {
    setFlashShipId(shipId);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashShipId(null), 1300);
  }

  // Esporta lo storico (con i filtri attivi) come CSV scaricabile.
  async function handleExport() {
    setExporting(true);
    try {
      const blob = await api.exportHistoryCsv({ eventType: eventFilter });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'storico.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      showError(err.message);
    } finally {
      setExporting(false);
    }
  }

  if (dashboard === null) return <LoadingSpinner />;

  const maxOffset = maxHorizonOffset(dashboard);
  const windowStart = dashboard.currentDay + horizonOffset;
  const days = Array.from({ length: TIMELINE_DAYS }, (_, i) => windowStart + i);
  const selectedShip = dashboard.pendingShips.find((s) => s.id === selectedShipId) ?? null;
  // Sposta la finestra della timeline così che `day` sia visibile (un giorno di contesto prima).
  const jumpToDay = (day) => {
    const start = Math.max(dashboard.currentDay, day - 1);
    setHorizonOffset(Math.min(Math.max(0, start - dashboard.currentDay), maxOffset));
  };
  const jumpAndFlash = (day, shipId) => { jumpToDay(day); flashShip(shipId); };
  // Assegnazioni non ancora iniziate: modificabili. Ordine = ultima assegnata
  // per prima (AssignSeq desc), non per data.
  const upcomingAssignments = dashboard.berths
    .flatMap((b) => b.assignments
      .filter((a) => a.startDay > dashboard.currentDay)
      .map((a) => ({ ...a, berthId: b.id, berthName: b.name, berthSize: b.size })))
    .sort((x, y) => y.assignSeq - x.assignSeq);
  const editableByShip = new Map(upcomingAssignments.map((a) => [a.shipId, a]));

  return (
    <div className="scheduler">
      {/* ---- Pannello sinistro: navi in attesa (flusso guidato, passo 1) ---- */}
      <aside className="card scheduler__pending">
        <h2>Navi in attesa</h2>
        {dashboard.pendingShips.length === 0 ? (
          <p className="scheduler__hint scheduler__empty">Nessuna nave in attesa.<br />L'Operatore può registrarne di nuove.</p>
        ) : (
          <ul className="pending-list scheduler__pending-list">
            {dashboard.pendingShips.map((ship) => (
              <li key={ship.id}>
                <button
                  className={`pending-ship ${ship.id === selectedShipId ? 'is-selected' : ''}`}
                  onClick={() => selectShip(ship)}
                >
                  <span className="pending-ship__name">{ship.name}</span>
                  <span className="badge badge-size">{ship.size}</span>
                  <span className="pending-ship__meta mono">arr. {fmtDay(ship.arrivalDay)} · {formatDuration(ship.duration)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {selectedShip && (
          <p className="scheduler__hint scheduler__hint--active">
            <strong>{selectedShip.name}</strong> selezionata: scegli una banchina evidenziata nella timeline.
            <button type="button" className="btn btn-ghost btn-sm scheduler__goto"
                    onClick={() => setHorizonOffset(offsetForArrival(dashboard, selectedShip))}>
              ↦ vai all'arrivo ({fmtDay(selectedShip.arrivalDay)})
            </button>
          </p>
        )}

        {upcomingAssignments.length > 0 && (
          <div className="scheduler__upcoming">
            <h3>Assegnazioni programmate</h3>
            <p className="scheduler__hint">Modificabili finché l'occupazione non è iniziata.</p>
            <ul className="pending-list scheduler__upcoming-list">
              {upcomingAssignments.map((a) => (
                <li key={a.shipId} className="upcoming-item">
                  <button type="button" className="upcoming-item__info"
                          onClick={() => jumpAndFlash(a.startDay, a.shipId)} title="Mostra nella timeline">
                    <span className="pending-ship__name">{a.shipName}</span>
                    <span className="upcoming-item__meta mono">{a.berthName} · dal {fmtDay(a.startDay)}</span>
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm"
                          onClick={() => openAssignmentEdit(a)}>Modifica</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      {/* ---- Timeline: banchine per riga, giorni per colonna (passo 2) ---- */}
      <section className="card scheduler__timeline">
        <div className="scheduler__timeline-head">
          <h2>Timeline banchine</h2>
          <div className="timeline-nav">
            <button className="btn btn-sm" disabled={horizonOffset === 0}
                    onClick={() => setHorizonOffset((o) => Math.max(0, o - TIMELINE_DAYS))}
                    aria-label="Finestra precedente">‹</button>
            <input type="range" className="timeline-slider"
                   min={0} max={maxOffset} value={Math.min(horizonOffset, maxOffset)}
                   disabled={maxOffset === 0}
                   onChange={(e) => setHorizonOffset(Number(e.target.value))}
                   aria-label="Sposta la finestra temporale" />
            <button className="btn btn-sm" disabled={horizonOffset >= maxOffset}
                    onClick={() => setHorizonOffset((o) => Math.min(maxOffset, o + TIMELINE_DAYS))}
                    aria-label="Finestra successiva">›</button>
            <span className="mono timeline-nav__range">{fmtDay(windowStart)}–{fmtDay(windowStart + TIMELINE_DAYS - 1)}</span>
            <button className="btn btn-sm" disabled={horizonOffset === 0}
                    onClick={() => setHorizonOffset(0)}>oggi</button>
          </div>
          <ul className="timeline-legend">
            <li><span className="lg lg--occupied" aria-hidden="true" />Occupazione</li>
            <li><span className="lg lg--maintenance" aria-hidden="true" />Manutenzione</li>
            <li><span className="lg lg--preview" aria-hidden="true" />Anteprima accodamento</li>
            <li><span className="lg lg--today" aria-hidden="true" />Oggi</li>
          </ul>
        </div>
        <div className="timeline-scroll" ref={timelineRef}>
          <div className="timeline">
            {/* Intestazione coi numeri dei giorni */}
            <div className="timeline__row timeline__row--head">
              <div className="timeline__label" />
              {days.map((day, i) => (
                <div key={day} className={`timeline__head mono ${day === dashboard.currentDay ? 'is-today' : ''}`}
                     style={{ gridColumn: i + 2 }}>
                  {fmtDay(day, { compact: true })}
                  {day === dashboard.currentDay && <span className="timeline__today-tag">oggi</span>}
                </div>
              ))}
            </div>

            {dashboard.berths.map((berth) => {
              const compatible = selectedShip !== null && isCompatible(selectedShip.size, berth.size);
              const dimmed = selectedShip !== null && !compatible;
              // Anteprima di accodamento: primo giorno libero per la nave selezionata.
              // Le manutenzioni bloccano come le occupazioni: stessa lista, come fa il server.
              const previewStart = compatible
                ? computeOccupationStartDay(
                    selectedShip.arrivalDay, selectedShip.duration, dashboard.currentDay,
                    [
                      ...berth.assignments.map((a) => ({ start: a.startDay, end: a.endDay })),
                      ...berth.maintenances.map((m) => ({ start: m.startDay, end: m.endDay })),
                    ])
                : null;

              return (
                <div key={berth.id}
                     className={`timeline__row ${compatible ? 'is-compatible' : ''} ${dimmed ? 'is-dimmed' : ''}`}>
                  <div className="timeline__label">
                    <div className="timeline__label-main">
                      <span className="timeline__berth">{berth.name}</span>
                      <span className="badge badge-size">{berth.size}</span>
                    </div>
                    <div className="timeline__label-sub">
                      {(() => {
                        // Tre stati, distinti dalla FORMA del pallino prima che dal colore:
                        // disco = occupata, anello = libera, quadrato = in manutenzione.
                        const state = berth.isUnderMaintenanceNow ? 'maintenance'
                                    : berth.isOccupiedNow ? 'occupied' : 'free';
                        const label = state === 'maintenance' ? 'In manutenzione'
                                    : state === 'occupied' ? 'Occupata' : 'Libera';
                        return (
                          <span className={`berth-status is-${state}`}>
                            <span className="berth-status__dot" aria-hidden="true" />
                            {label}
                          </span>
                        );
                      })()}
                      {compatible && (
                        <button className="btn btn-gold btn-sm timeline__assign" disabled={assigning}
                                onClick={() => handleAssign(berth, selectedShip)}>
                          Assegna →
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Celle di sfondo, una per giorno */}
                  {days.map((day, i) => (
                    <div key={day} className={`timeline__cell ${day === dashboard.currentDay ? 'is-today' : ''}`}
                         style={{ gridColumn: i + 2 }} />
                  ))}

                  {/* Occupazioni reali: blocchi pieni. gridColumn è POSIZIONAMENTO
                      calcolato dai dati (giorni -> colonne), non stile. */}
                  {berth.assignments.map((a) => {
                    const start = Math.max(a.startDay, windowStart);
                    const end = Math.min(a.endDay, windowStart + TIMELINE_DAYS);
                    if (end <= start) return null; // fuori dalla finestra visibile
                    return (
                      <div key={a.shipId}
                           className={`timeline__block ${a.shipId === flashShipId ? 'is-flash' : ''}`}
                           style={{ gridColumn: `${start - windowStart + 2} / ${end - windowStart + 2}` }}
                           aria-label={`${berth.name} occupata da ${a.shipName}, ${fmtDay(a.startDay)}–${fmtDay(a.endDay - 1)}`}
                           onMouseEnter={(e) => showTipFor(e, {
                             title: a.shipName,
                             rows: [
                               ['Taglia', a.size],
                               ['Banchina', berth.name],
                               ['Occupazione', `${fmtDay(a.startDay)}–${fmtDay(a.endDay - 1)}`],
                               ['Durata', formatDuration(a.endDay - a.startDay)],
                             ],
                             notes: a.notes,
                           })}
                           onMouseLeave={hideTip}>
                        {a.shipName}
                      </div>
                    );
                  })}

                  {/* Manutenzioni: stessa semantica [start,end) delle occupazioni, ma
                      tratteggio + etichetta esplicita, così si distinguono anche senza colore. */}
                  {berth.maintenances.map((m) => {
                    const start = Math.max(m.startDay, windowStart);
                    const end = Math.min(m.endDay, windowStart + TIMELINE_DAYS);
                    if (end <= start) return null; // fuori dalla finestra visibile
                    return (
                      <div key={`m${m.id}`} className="timeline__block timeline__block--maintenance"
                           style={{ gridColumn: `${start - windowStart + 2} / ${end - windowStart + 2}` }}
                           title={`Manutenzione: ${fmtDay(m.startDay)}–${fmtDay(m.endDay - 1)}`}
                           aria-label={`${berth.name} in manutenzione, ${fmtDay(m.startDay)}–${fmtDay(m.endDay - 1)}`}>
                        Manutenzione
                      </div>
                    );
                  })}

                  {/* Anteprima per la nave selezionata: blocco tratteggiato */}
                  {previewStart !== null && (() => {
                    const previewEnd = previewStart + selectedShip.duration;
                    const start = Math.max(previewStart, windowStart);
                    const end = Math.min(previewEnd, windowStart + TIMELINE_DAYS);
                    if (end <= start) return null; // coda oltre la finestra visibile
                    return (
                      <div className="timeline__block timeline__block--preview"
                           style={{ gridColumn: `${start - windowStart + 2} / ${end - windowStart + 2}` }}
                           title={`Anteprima: dal ${fmtDay(previewStart)} per ${formatDuration(selectedShip.duration)}`}>
                        dal {fmtDay(previewStart)}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---- Storico assegnazioni (#1): sola lettura, append-only lato backend ---- */}
      <section className="card scheduler__history">
        <div className="scheduler__history-head">
          <h2>Storico assegnazioni</h2>
          <div className="scheduler__history-tools">
            <label className="field field--inline">
              <span>Evento</span>
              <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
                <option value="">Tutti</option>
                <option value="Assigned">Assegnazioni</option>
                <option value="Departed">Partenze</option>
              </select>
            </label>
            <button type="button" className="btn btn-ghost btn-sm"
                    disabled={exporting || !history || history.length === 0}
                    onClick={handleExport}>
              {exporting ? 'Esporto…' : 'Esporta CSV'}
            </button>
          </div>
        </div>

        {history === null ? (
          <p className="scheduler__hint">Caricamento storico…</p>
        ) : history.length === 0 ? (
          <p className="scheduler__hint">
            {eventFilter ? 'Nessun evento di questo tipo.' : 'Nessun evento registrato finora.'}
          </p>
        ) : (
          <div className="scheduler__history-wrap">
            <table className="scheduler__history-table">
              <thead>
                <tr>
                  <th>Evento</th><th>Nave</th><th>Taglia</th><th>Banchina</th>
                  <th>Occupazione</th><th>Registrato il</th><th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td>
                      <span className={`badge badge-${h.eventType.toLowerCase()}`}>
                        {EVENT_LABELS[h.eventType]}
                      </span>
                    </td>
                    <td>
                      <button type="button" className="linklike"
                              onClick={() => jumpAndFlash(h.occupationStartDay, h.shipId)}
                              title="Mostra nella timeline">{h.shipName}</button>
                    </td>
                    <td><span className="badge badge-size">{h.size}</span></td>
                    <td>{h.berthName}</td>
                    <td className="mono">{fmtDay(h.occupationStartDay)}–{fmtDay(h.occupationEndDay - 1)}</td>
                    <td className="mono">{fmtDay(h.eventDay)}</td>
                    <td>
                      {editableByShip.has(h.shipId) ? (
                        <button type="button" className="btn btn-ghost btn-sm"
                                onClick={() => openAssignmentEdit(editableByShip.get(h.shipId))}>Modifica</button>
                      ) : <span className="scheduler__hint">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {tip && (
        <div className="tl-tip" role="tooltip" style={{ left: `${tip.x}px`, top: `${tip.y}px` }}>
          <strong>{tip.title}</strong>
          {tip.rows.map(([k, v]) => (
            <span key={k} className="tl-tip__row">{k} <b>{v}</b></span>
          ))}
          {tip.notes && <span className="tl-tip__notes">{tip.notes}</span>}
        </div>
      )}

      {editingAssignment && (
        <Modal title="Modifica assegnazione" onClose={() => setEditingAssignment(null)}>
          <form className="assign-edit-form" onSubmit={handleSaveAssignment}>
            <div className="field">
              <label htmlFor="ae-name">Nome nave</label>
              <input id="ae-name" value={assignForm.name}
                     onChange={(e) => setAssignForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="field">
              <label htmlFor="ae-berth">Banchina (taglia {editingAssignment.size})</label>
              <select id="ae-berth" value={assignForm.berthId}
                      onChange={(e) => setAssignForm((f) => ({ ...f, berthId: e.target.value }))}>
                {dashboard.berths.filter((b) => b.size === editingAssignment.size).map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="ae-notes">Note <span className="field__optional">(es. perché questa banchina)</span></label>
              <textarea id="ae-notes" value={assignForm.notes}
                        onChange={(e) => setAssignForm((f) => ({ ...f, notes: e.target.value }))}
                        rows={3} maxLength={2000} />
            </div>
            <div className="assign-edit-actions">
              <button type="button" className="btn btn-danger"
                      onClick={() => { const a = editingAssignment; setEditingAssignment(null); handleUnassign(a); }}>
                Riporta in attesa
              </button>
              <span className="assign-edit-spacer" />
              <button type="button" className="btn btn-ghost" onClick={() => setEditingAssignment(null)}>Annulla</button>
              <button type="submit" className="btn btn-primary" disabled={savingAssign || !assignForm.name.trim()}>
                {savingAssign ? 'Salvo…' : 'Salva'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
