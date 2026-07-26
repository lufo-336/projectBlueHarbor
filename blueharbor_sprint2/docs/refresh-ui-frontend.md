# Refresh UI — frontend (branch `feature/refresh-ui-frontend`)

Documento di riepilogo delle migliorie apportate al frontend in questa sessione.
Il lavoro è su un **branch separato** dal `main` del gruppo, pensato per essere
rivisto e approvato via Pull Request. Nessuna regola di dominio è stata cambiata:
gli interventi riguardano UX/UI, coerenza e alcune estensioni mirate del backend.

> Consegna di riferimento: registro operativo del terminal BlueHarbor
> (ruoli Operatore/Scheduler, giorno virtuale + Next Day, banchine per taglia,
> ciclo Pending → Assigned → Departed).

---

## Generali

- **Tema chiaro/scuro** con toggle manuale in navbar e nella pagina di login,
  persistito in `localStorage`, senza flash all'avvio (`data-theme` impostato
  prima del render). Contrasti del tema scuro rivisti.
- **Formato del tempo** con toggle **Giorno/Data** (esclusivo: mostra un solo
  formato ovunque, inclusa la timeline). Convenzione unica:
  - istante → `g13` · `13 giugno` (mese esteso) · `13/6` (colonne strette timeline);
  - navbar → `Giorno 13` / `13 giugno`; durata → sempre `3 giorni`.
- **Design-system**: pelle condivisa per input/select/textarea, freccia select
  custom uguale in ogni tema, opzioni leggibili anche al buio, **scala
  tipografica** unica (`--fs-xs … --fs-xl`).
- **Navbar** ridisegnata: logo SVG + wordmark (niente più emoji ancora), identità
  = solo ruolo in italiano, controlli raggruppati, **sticky** durante lo scroll,
  e **mini-mappa banchine** al centro (8 celle per stato/taglia, tooltip, e —
  per Scheduler/Admin — cliccabili per aprire lo Scheduler sulla banchina).
- **Sfondo "mare"** in CSS puro (gradiente + onde su più livelli, tema-aware),
  senza immagini esterne.
- **Accessibilità e feedback**: anelli di focus da tastiera (`:focus-visible`),
  scrollbar tematizzate, transizioni e stati hover/selezione, animazioni di
  "flash" per confermare i salti nella timeline.
- **Ricerca per nome** delle navi (parametro backend `?q=`).

## Operatore

- Form "Registra nave": campo **note** su riga propria, **auto-espandibile**
  (niente maniglia), limite alzato a 2000 caratteri.
- Notazione arrivo/durata coerente col toggle tempo; **tasto genera-nome**;
  **nome in evidenza** in tabella + highlight della nave appena creata.
- **Ricerca per nome** con debounce; elenco navi ordinato dal **più recente**.
- **Modifica nome e note** di una nave (rientra in "l'Operatore mantiene le
  informazioni") tramite modale coerente.

## Scheduler

- **Timeline**: colonna banchine "congelata" (sticky), **slider + rotella** per
  muovere la finestra, **salto automatico** al primo slot libero reale della
  nave selezionata (tiene conto delle code), altezze di riga uniformi.
- **Tooltip** ricco sui blocchi della timeline (compare dopo ~0,6s di hover) con
  taglia, banchina, occupazione, durata, note.
- **Storico assegnazioni**: rimosso l'orologio reale (incoerente col modello
  non-real-time), "Registrato il" = giorno virtuale; nome-nave cliccabile che
  sposta la timeline.
- **Assegnazioni programmate**: card ad altezza limitata e scrollabile, ordinata
  dall'**ultima assegnata**.
- **Modifica assegnazione** prima dell'inizio occupazione: cambio **banchina**
  (con ricalcolo dello slot), **nome** e **note**, dalla card e dallo storico;
  in alternativa **annullo** (la nave torna in attesa). *Deviazione consapevole
  dalla consegna, limitata alla correzione prima dell'effetto.*
- La colonna sinistra si allinea in altezza alla timeline; lista navi in attesa
  scrollabile.

## Admin

- **Archivio navi partite** (Departed) ricercabile, come tab dedicata.
- **Manutenzioni** programmabili con **selettori data** (calendario) mappati sul
  giorno virtuale; ordinamenti dal più recente.
- Box ruolo/scelta uniformati col design-system.

## Backend (estensioni mirate)

- `GET /api/ships?q=` — ricerca per nome; ordinamento navi/manutenzioni dal più recente.
- `PUT /api/ships/{id}` — modifica nome/note (Operator, Admin).
- `POST /api/ships/{id}/unassign` — annulla un'assegnazione prima dell'inizio.
- `PUT /api/ships/{id}/assignment` — modifica banchina/nome/note dell'assegnazione.
- `GET /api/system/summary` — riepilogo terminal + stato banchine (per la navbar).
- Colonna `Notes` estesa a 2000 caratteri.

## Note operative

- **Database**: il backend usa `EnsureCreated()`, che **non migra** un DB già
  esistente. Un DB creato prima delle ultime colonne (es. `IsActive`, `Notes`
  a 2000) va **ricreato** o si adottano le migrazioni EF.
- **Autenticazione demo**: login fittizio con pulsanti di auto-compilazione,
  mantenuto di proposito per le presentazioni.
- **Internazionalizzazione (IT/EN)**: rimandata a un intervento dedicato — le
  convenzioni di testo e la scala tipografica sono già state uniformate per
  rendere la traduzione un'operazione di solo dizionario.
