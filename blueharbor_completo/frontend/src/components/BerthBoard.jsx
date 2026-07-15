// ═══ SPRINT 3 ═══
// Il tabellone delle 8 banchine: per ognuna i blocchi di occupazione
// (nave + intervallo di giorni). Griglia responsive (Sprint 10).
export default function BerthBoard({ berths, currentDay }) {
  return (
    <section aria-label="Tabellone banchine">
      <h3>Banchine — giorno corrente: {currentDay}</h3>
      <div className="berth-board">
        {berths.map((berth) => (
          <article key={berth.id} className="berth-card">
            <h4>{berth.name} <span className="berth-size">[{berth.size}]</span></h4>
            {berth.occupations.length === 0
              ? <p className="berth-free">Libera</p>
              : (
                <ul className="berth-occupations">
                  {berth.occupations.map((occ) => (
                    <li key={occ.shipId}>
                      <strong>{occ.shipName}</strong>: giorni {occ.startDay}–{occ.endDay}
                    </li>
                  ))}
                </ul>
              )}
          </article>
        ))}
      </div>
    </section>
  );
}
