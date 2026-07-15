// ═══ SPRINT 3 (storico SPRINT 8) ═══
// Vista dello Scheduler: tab "Pianificazione" (pending + tabellone) e
// tab "Storico". Le tab sono button veri con aria-pressed.
import { useEffect, useState } from 'react';
import { getDashboard } from '../services/api';
import { useToast } from '../context/ToastContext';
import PendingShipsList from './PendingShipsList';
import BerthBoard from './BerthBoard';
import HistoryTab from './HistoryTab';

export default function SchedulerView({ refreshKey }) {
  const [dashboard, setDashboard] = useState(null);
  const [tab, setTab] = useState('board'); // 'board' | 'history'
  const { showError } = useToast();

  const load = () => {
    getDashboard()
      .then(setDashboard)
      .catch((err) => showError(err.message));
  };

  useEffect(load, [refreshKey]);

  if (!dashboard) return <p role="status">Caricamento dashboard…</p>;

  return (
    <section className="scheduler-view" aria-label="Pannello Scheduler">
      <h2>Pannello Scheduler</h2>
      <div className="tab-bar">
        <button onClick={() => setTab('board')} aria-pressed={tab === 'board'}>Pianificazione</button>
        <button onClick={() => setTab('history')} aria-pressed={tab === 'history'}>Storico</button>
      </div>
      {tab === 'board' ? (
        <div className="scheduler-columns">
          <PendingShipsList pendingShips={dashboard.pendingShips}
                            berths={dashboard.berths} onAssigned={load} />
          <BerthBoard berths={dashboard.berths} currentDay={dashboard.currentDay} />
        </div>
      ) : (
        <HistoryTab berths={dashboard.berths} />
      )}
    </section>
  );
}
