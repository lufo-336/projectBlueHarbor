import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api.js';
import { useDay } from '../context/DayContext.jsx';
import { useDayLabel } from '../context/PrefsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatDuration } from '../services/time.js';
import LoadingSpinner from './LoadingSpinner.jsx';
import './ShipArchive.css';

const PAGE_SIZE = 12;

// Archivio (sola lettura) delle navi che hanno concluso l'occupazione (Departed).
// Riusa GET /api/ships con status=Departed + ricerca per nome.
export default function ShipArchive() {
  const { currentDay } = useDay();
  const fmtDay = useDayLabel();
  const { showError } = useToast();
  const [data, setData] = useState(null); // null = primo caricamento
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const searchTimer = useRef(null);

  const load = useCallback(async () => {
    try {
      setData(await api.getShips({ status: 'Departed', q, page, pageSize: PAGE_SIZE }));
    } catch (err) {
      showError(err.message);
      setData({ items: [], total: 0, totalPages: 0 });
    }
  }, [showError, q, page]);

  // Ricarica al mount, quando cambia la ricerca/pagina e a ogni Next Day
  // (Next Day può far "partire" nuove navi).
  useEffect(() => { load(); }, [load, currentDay]);

  function changeSearch(value) {
    setSearch(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setQ(value.trim()); setPage(1); }, 300);
  }

  if (data === null) return <LoadingSpinner />;
  const { items, total, totalPages } = data;

  return (
    <section className="card ship-archive">
      <div className="ship-archive__head">
        <div>
          <h2>Archivio navi partite</h2>
          <p className="ship-archive__hint">
            Navi che hanno completato l'occupazione (stato Partita). Sola lettura.
          </p>
        </div>
        <label className="field field--inline">
          <span>Cerca</span>
          <input type="search" value={search} placeholder="nome nave…"
                 onChange={(e) => changeSearch(e.target.value)} />
        </label>
      </div>

      {items.length === 0 ? (
        <p className="ship-archive__hint">
          {q ? 'Nessuna nave partita corrisponde alla ricerca.' : 'Nessuna nave partita finora.'}
        </p>
      ) : (
        <>
          <div className="ship-archive__wrap">
            <table className="ship-archive__table">
              <thead>
                <tr><th>Nome</th><th>Taglia</th><th>Arrivo</th><th>Durata</th><th>Banchina</th><th>Occupazione</th><th>Note</th></tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id}>
                    <td className="ship-archive__name">{s.name}</td>
                    <td><span className="badge badge-size">{s.size}</span></td>
                    <td className="mono">{fmtDay(s.arrivalDay)}</td>
                    <td>{formatDuration(s.duration)}</td>
                    <td>{s.berthName ?? '—'}</td>
                    <td className="mono">
                      {s.occupationStartDay != null
                        ? `${fmtDay(s.occupationStartDay)}–${fmtDay(s.occupationStartDay + s.duration - 1)}`
                        : '—'}
                    </td>
                    <td className="ship-archive__notes" title={s.notes || ''}>{s.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="ship-archive__pager">
              <button type="button" className="btn"
                      disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                ← Precedente
              </button>
              <span className="ship-archive__pager-info mono">
                Pagina {page} di {totalPages} · {total} navi partite
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
  );
}
