import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { computeOccupationStartDay, isCompatible } from '../services/scheduling.js';
import { useDay } from '../context/DayContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import './SchedulerView.css';

// Colonne visibili della timeline: currentDay .. currentDay+13.
// NB: deve combaciare con repeat(14, ...) in SchedulerView.css.
const TIMELINE_DAYS = 14;

export default function SchedulerView() {
  const { currentDay } = useDay();
  const { showSuccess, showError } = useToast();
  const [dashboard, setDashboard] = useState(null); // null = primo caricamento
  const [selectedShipId, setSelectedShipId] = useState(null);
  const [assigning, setAssigning] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      setDashboard(await api.getSchedulerDashboard());
    } catch (err) {
      showError(err.message);
    }
  }, [showError]);

  // Ricarica al mount e a ogni Next Day.
  useEffect(() => { loadDashboard(); }, [loadDashboard, currentDay]);

  async function handleAssign(berth, selectedShip) {
    if (!selectedShip || assigning) return;
    setAssigning(true);
    try {
      const result = await api.assignShip(selectedShip.id, berth.id);
      // Fa fede il giorno calcolato dal SERVER, non l'anteprima client.
      showSuccess(`${result.name} assegnata a ${berth.name}: occupazione dal giorno ${result.startDay}.`);
      setSelectedShipId(null);
      await loadDashboard();
    } catch (err) {
      showError(err.message);
    } finally {
      setAssigning(false);
    }
  }

  if (dashboard === null) return <LoadingSpinner />;

  const day0 = dashboard.currentDay;
  const days = Array.from({ length: TIMELINE_DAYS }, (_, i) => day0 + i);
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
        <h2>Timeline banchine</h2>
        <div className="timeline-scroll">
          <div className="timeline">
            {/* Intestazione coi numeri dei giorni */}
            <div className="timeline__row timeline__row--head">
              <div className="timeline__label" />
              {days.map((day, i) => (
                <div key={day} className={`timeline__head mono ${i === 0 ? 'is-today' : ''}`}
                     style={{ gridColumn: i + 2 }}>
                  g{day}
                </div>
              ))}
            </div>

            {dashboard.berths.map((berth) => {
              const compatible = selectedShip !== null && isCompatible(selectedShip.size, berth.size);
              const dimmed = selectedShip !== null && !compatible;
              // Anteprima di accodamento: primo giorno libero per la nave selezionata.
              const previewStart = compatible
                ? computeOccupationStartDay(
                    selectedShip.arrivalDay, selectedShip.duration, day0,
                    berth.assignments.map((a) => ({ start: a.startDay, end: a.endDay })))
                : null;

              return (
                <div key={berth.id}
                     className={`timeline__row ${compatible ? 'is-compatible' : ''} ${dimmed ? 'is-dimmed' : ''}`}>
                  <div className="timeline__label">
                    <span className="timeline__berth">{berth.name}</span>
                    <span className="badge badge-size">{berth.size}</span>
                    {compatible && (
                      <button className="btn btn-gold timeline__assign" disabled={assigning}
                              onClick={() => handleAssign(berth, selectedShip)}>
                        Assegna →
                      </button>
                    )}
                  </div>

                  {/* Celle di sfondo, una per giorno */}
                  {days.map((day, i) => (
                    <div key={day} className={`timeline__cell ${i === 0 ? 'is-today' : ''}`}
                         style={{ gridColumn: i + 2 }} />
                  ))}

                  {/* Occupazioni reali: blocchi pieni. gridColumn è POSIZIONAMENTO
                      calcolato dai dati (giorni -> colonne), non stile. */}
                  {berth.assignments.map((a) => {
                    const start = Math.max(a.startDay, day0);
                    const end = Math.min(a.endDay, day0 + TIMELINE_DAYS);
                    if (end <= start) return null; // fuori dalla finestra visibile
                    return (
                      <div key={a.shipId} className="timeline__block"
                           style={{ gridColumn: `${start - day0 + 2} / ${end - day0 + 2}` }}
                           title={`${a.shipName}: giorni ${a.startDay}–${a.endDay - 1}`}>
                        {a.shipName}
                      </div>
                    );
                  })}

                  {/* Anteprima per la nave selezionata: blocco tratteggiato */}
                  {previewStart !== null && (() => {
                    const previewEnd = previewStart + selectedShip.duration;
                    const start = Math.max(previewStart, day0);
                    const end = Math.min(previewEnd, day0 + TIMELINE_DAYS);
                    if (end <= start) return null; // coda oltre la finestra visibile
                    return (
                      <div className="timeline__block timeline__block--preview"
                           style={{ gridColumn: `${start - day0 + 2} / ${end - day0 + 2}` }}
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
    </div>
  );
}
