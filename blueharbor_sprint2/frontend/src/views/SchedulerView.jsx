import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api.js';
import { computeOccupationStartDay, isCompatible } from '../services/scheduling.js';
import { useDay } from '../context/DayContext.jsx';
import { useDayLabel } from '../context/PrefsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatDuration } from '../services/time.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
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

  return (
    <div className="scheduler">
      {/* ---- Pannello sinistro: navi in attesa (flusso guidato, passo 1) ---- */}
      <aside className="card scheduler__pending">
        <h2>Navi in attesa</h2>
        {dashboard.pendingShips.length === 0 ? (
          <p className="scheduler__hint">Nessuna nave in attesa. L'Operatore può registrarne di nuove.</p>
        ) : (
          <ul className="pending-list">
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
                      <div key={a.shipId} className="timeline__block"
                           style={{ gridColumn: `${start - windowStart + 2} / ${end - windowStart + 2}` }}
                           title={`${a.shipName}: ${fmtDay(a.startDay)}–${fmtDay(a.endDay - 1)}`}
                           aria-label={`${berth.name} occupata da ${a.shipName}, ${fmtDay(a.startDay)}–${fmtDay(a.endDay - 1)}`}>
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
                  <th>Occupazione</th><th>Registrato il</th>
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
                    <td>{h.shipName}</td>
                    <td><span className="badge badge-size">{h.size}</span></td>
                    <td>{h.berthName}</td>
                    <td className="mono">{fmtDay(h.occupationStartDay)}–{fmtDay(h.occupationEndDay - 1)}</td>
                    <td className="mono">{fmtDay(h.eventDay)}</td>
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
