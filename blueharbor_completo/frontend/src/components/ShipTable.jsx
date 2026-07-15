// ═══ SPRINT 2 (paginazione SPRINT 7, semantica SPRINT 10) ═══
// Tabella HTML vera (<table>): navigabile da screen reader, con scope
// sulle intestazioni. Lo stato è testo in un badge, mai solo colore.
export default function ShipTable({ ships, page, pageSize, totalCount, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="ship-table">
      <table>
        <caption>Navi registrate ({totalCount})</caption>
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">Size</th>
            <th scope="col">Arrivo</th>
            <th scope="col">Durata</th>
            <th scope="col">Stato</th>
            <th scope="col">Banchina</th>
          </tr>
        </thead>
        <tbody>
          {ships.map((ship) => (
            <tr key={ship.id}>
              <td>{ship.name}</td>
              <td>{ship.size}</td>
              <td>g. {ship.arrivalDay}</td>
              <td>{ship.duration} gg</td>
              <td><span className={`badge badge-${ship.status.toLowerCase()}`}>{ship.status}</span></td>
              <td>{ship.berthName ?? '—'}</td>
            </tr>
          ))}
          {ships.length === 0 && (
            <tr><td colSpan={6}>Nessuna nave registrata.</td></tr>
          )}
        </tbody>
      </table>
      <nav className="pagination" aria-label="Paginazione navi">
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}>← Precedente</button>
        <span aria-live="polite">Pagina {page} di {totalPages}</span>
        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>Successiva →</button>
      </nav>
    </div>
  );
}
