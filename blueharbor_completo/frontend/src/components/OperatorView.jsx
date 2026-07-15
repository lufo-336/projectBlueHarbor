// ═══ SPRINT 2 ═══
// Vista dell'Operatore: form sopra, storico sotto. refreshKey (dal Next Day)
// e page sono nelle dipendenze dell'useEffect: al cambio si ricarica.
import { useEffect, useState } from 'react';
import { getShips } from '../services/api';
import { useToast } from '../context/ToastContext';
import ShipForm from './ShipForm';
import ShipTable from './ShipTable';

const PAGE_SIZE = 10;

export default function OperatorView({ refreshKey }) {
  const [data, setData] = useState({ items: [], totalCount: 0 });
  const [page, setPage] = useState(1);
  const { showError } = useToast();

  const load = () => {
    getShips({ page, pageSize: PAGE_SIZE })
      .then(setData)
      .catch((err) => showError(err.message));
  };

  useEffect(load, [page, refreshKey]);

  return (
    <section className="operator-view" aria-label="Pannello Operatore">
      <h2>Registrazione navi</h2>
      <ShipForm onCreated={load} />
      <ShipTable ships={data.items} page={page} pageSize={PAGE_SIZE}
                 totalCount={data.totalCount} onPageChange={setPage} />
    </section>
  );
}
