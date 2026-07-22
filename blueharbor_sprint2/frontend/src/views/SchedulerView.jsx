import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { computeOccupationStartDay, isCompatible } from '../services/scheduling.js';
import { useDay } from '../context/DayContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import './SchedulerView.css';

// Colonne visibili della timeline: windowStart .. windowStart+13, dove
// windowStart = currentDay + horizonOffset (navigazione a finestre intere).
// NB: deve combaciare con repeat(14, ...) in SchedulerView.css.
const TIMELINE_DAYS = 14;

const EVENT_LABELS = { Assigned: 'Assegnata', Departed: 'Partita' };

export default function SchedulerView() {
  const { currentDay } = useDay();
  const { showSuccess, showError } = useToast();
  const [dashboard, setDashboard] = useState(null); // null = primo caricamento
  const [selectedShipId, setSelectedShipId] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [history, setHistory] = useState(null); // storico assegnazioni (sola lettura)
  const [eventFilter, setEventFilter] = useState('');
  const [exporting, setExporting] = useState(false);
  // Finestra visibile della timeline: multipli di TIMELINE_DAYS oltre "oggi".
  const [horizonOffset, setHorizonOffset] = useState(0);

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
  // Aggiustamento durante il render (pattern React "adjusting state when a
  // prop changes"): niente effect, niente render a cascata.
  const [lastSeenDay, setLastSeenDay] = useState(currentDay);
  if (lastSeenDay !== currentDay) {
    setLastSeenDay(currentDay);
    setHorizonOffset(0);
  }

  async function handleAssign(berth, selectedShip) {
    if (!selectedShip || assigning) return;
    setAssigning(true);
    try {
      const result = await api.assignShip(selectedShip.id, berth.id);
      // Fa fede il giorno calcolato dal SERVER, non l'anteprima client.
      showSuccess(`${result.name} assegnata a ${berth.name}: occupazione dal giorno ${result.occupationStartDay}.`);
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

  const windowStart = dashboard.currentDay + horizonOffset;
  const days = Array.from({ length: TIMELINE_DAYS }, (_, i) => windowStart + i);
  const selectedShip = dashboard.pendingShips.find((s) => s.id === selectedShipId) ?? null;

  return (
    <div className="scheduler">
      {/* ---- Pannello sinistro: navi in attesa (flusso Guidato, passo 1) ---- */}
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
                  onClick={() => setSelectedShipId(ship.id === selectedShipId ? null : ship.id)}
                >
                  <span className="pending-ship__name">{ship.name}</span>
                  <span className="badge badge-size">{ship.size}</span>
                  <span className="pending-ship__meta mono">arr. g{ship.arrivalDay} · {ship.duration}gg</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {selectedShip && (
          <p className="scheduler__hint scheduler__hint--active">
            <strong>{selectedShip.name}</strong> selezionata: scegli una banchina evidenziata nella timeline.
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
            <span className="mono">g{windowStart}–g{windowStart + TIMELINE_DAYS - 1}</span>
            <button className="btn btn-sm" disabled={horizonOffset === 0}
                    onClick={() => setHorizonOffset(0)}>oggi</button>
            <button className="btn btn-sm"
                    onClick={() => setHorizonOffset((o) => o + TIMELINE_DAYS)}
                    aria-label="Finestra successiva">›</button>
          </div>
          <ul className="timeline-legend">
            <li><span className="lg lg--occupied" aria-hidden="true" />Occupazione</li>
            <li><span className="lg lg--preview" aria-hidden="true" />Anteprima accodamento</li>
            <li><span className="lg lg--today" aria-hidden="true" />Oggi</li>
          </ul>
        </div>
        <div className="timeline-scroll">
          <div className="timeline">
            {/* Intestazione coi numeri dei giorni */}
            <div className="timeline__row timeline__row--head">
              <div className="timeline__label" />
              {days.map((day, i) => (
                <div key={day} className={`timeline__head mono ${day === dashboard.currentDay ? 'is-today' : ''}`}
                     style={{ gridColumn: i + 2 }}>
                  g{day}
                  {day === dashboard.currentDay && <span className="timeline__today-tag">oggi</span>}
                </div>
              ))}
            </div>

            {dashboard.berths.map((berth) => {
              const compatible = selectedShip !== null && isCompatible(selectedShip.size, berth.size);
              const dimmed = selectedShip !== null && !compatible;
              // Anteprima di accodamento: primo giorno libero per la nave selezionata.
              const previewStart = compatible
                ? computeOccupationStartDay(
                    selectedShip.arrivalDay, selectedShip.duration, dashboard.currentDay,
                    berth.assignments.map((a) => ({ start: a.startDay, end: a.endDay })))
                : null;

              return (
                <div key={berth.id}
                     className={`timeline__row ${compatible ? 'is-compatible' : ''} ${dimmed ? 'is-dimmed' : ''}`}>
                  <div className="timeline__label">
                    <span className="timeline__berth">{berth.name}</span>
                    <span className="badge badge-size">{berth.size}</span>
                    <span className={`berth-status ${berth.isOccupiedNow ? 'is-occupied' : 'is-free'}`}>
                      <span className="berth-status__dot" aria-hidden="true" />
                      {berth.isOccupiedNow ? 'Occupata' : 'Libera'}
                    </span>
                    {compatible && (
                      <button className="btn btn-gold timeline__assign" disabled={assigning}
                              onClick={() => handleAssign(berth, selectedShip)}>
                        Assegna →
                      </button>
                    )}
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
                           title={`${a.shipName}: giorni ${a.startDay}–${a.endDay - 1}`}
                           aria-label={`${berth.name} occupata da ${a.shipName}, giorni ${a.startDay}–${a.endDay - 1}`}>
                        {a.shipName}
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
                           title={`Anteprima: dal giorno ${previewStart} per ${selectedShip.duration}gg`}>
                        dal g{previewStart}
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
                  <th>Occupazione</th><th>Giorno evento</th><th>Registrato</th>
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
                    <td className="mono">g{h.occupationStartDay}–g{h.occupationEndDay - 1}</td>
                    <td className="mono">g{h.eventDay}</td>
                    <td className="mono">{new Date(h.createdAt).toLocaleString('it-IT')}</td>
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
