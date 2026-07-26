import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api.js';
import { useDay } from '../context/DayContext.jsx';
import { useDayLabel, useDurationLabel, useT } from '../context/PrefsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';
import './ShipArchive.css';

const PAGE_SIZE = 12;

// Archivio (sola lettura) delle navi che hanno concluso l'occupazione (Departed).
// Riusa GET /api/ships con status=Departed + ricerca per nome.
export default function ShipArchive() {
  const { currentDay } = useDay();
  const fmtDay = useDayLabel();
  const fmtDuration = useDurationLabel();
  const t = useT();
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
          <h2>{t('archive.title')}</h2>
          <p className="ship-archive__hint">{t('archive.hint')}</p>
        </div>
        <label className="field field--inline">
          <span>{t('common.search')}</span>
          <input type="search" value={search} placeholder={t('common.shipSearchPlaceholder')}
                 onChange={(e) => changeSearch(e.target.value)} />
        </label>
      </div>

      {items.length === 0 ? (
        <p className="ship-archive__hint">
          {q ? t('archive.emptySearch') : t('archive.emptyNone')}
        </p>
      ) : (
        <>
          <div className="ship-archive__wrap">
            <table className="ship-archive__table">
              <thead>
                <tr>
                  <th>{t('common.name')}</th><th>{t('common.size')}</th><th>{t('common.arrival')}</th>
                  <th>{t('common.duration')}</th><th>{t('common.berth')}</th><th>{t('common.occupation')}</th>
                  <th>{t('common.notes')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id}>
                    <td className="ship-archive__name">{s.name}</td>
                    <td><span className="badge badge-size">{s.size}</span></td>
                    <td className="mono">{fmtDay(s.arrivalDay)}</td>
                    <td>{fmtDuration(s.duration)}</td>
                    <td>{s.berthName ?? t('common.dash')}</td>
                    <td className="mono">
                      {s.occupationStartDay != null
                        ? `${fmtDay(s.occupationStartDay)}–${fmtDay(s.occupationStartDay + s.duration - 1)}`
                        : t('common.dash')}
                    </td>
                    <td className="ship-archive__notes" title={s.notes || ''}>{s.notes || t('common.dash')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="ship-archive__pager">
              <button type="button" className="btn"
                      disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                {t('common.prev')}
              </button>
              <span className="ship-archive__pager-info mono">
                {t('archive.pagerInfo', { page, totalPages, total })}
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
  );
}
