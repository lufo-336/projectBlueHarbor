// Canale leggero per la navigazione "apri lo Scheduler su una banchina".
// La navbar (Topbar) e le viste sono fratelli senza router: si usa un evento
// globale. Per lo Scheduler già montato lo raccoglie un listener; per l'Admin
// che arriva da un'altra tab la richiesta viene passata come prop alla
// SchedulerView (deterministico, niente stato pendente a livello di modulo).

/** La navbar chiede di aprire lo Scheduler focalizzato su una banchina. */
export function requestBerthFocus(berthId) {
  window.dispatchEvent(new CustomEvent('bh:goto-berth', { detail: { berthId } }));
}
