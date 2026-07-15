# Piano di implementazione — evoluzioni BlueHarbor

> Piano concreto per le feature approvate. Ancorato ai nomi reali del codice in
> `blueharbor_sprint2/`. Ogni voce rispetta i paletti della consegna (vedi
> [`proposte-evoluzione.md`](proposte-evoluzione.md)). Sforzo: **S** ≈ ½ giornata · **M** ≈ 1–2
> giornate · **L** ≈ 3+ giornate. Non è impegno di sprint: è la mappa tecnica.

## Note trasversali (valgono per tutte)

- **Niente migrazioni EF:** lo schema è gestito con script SQL versionati
  (`database/script5.sql`). Ogni modifica al DB va in un **nuovo `database/script6.sql`**
  (idempotente dove possibile) **e** rispecchiata in `Models/BlueHarborContext.OnModelCreating`.
- **DTO, mai entità** nelle risposte (evita i cicli di navigazione EF → 500). Nuove risposte →
  nuovi record in `DTOs/`.
- **Ruoli:** enforcement con `[Authorize(Roles = "...")]` già in uso. Il claim `role` è già nel
  JWT (`TokenService`), quindi aggiungere ruoli non tocca l'infrastruttura di auth.
- **Regola d'oro di scopo:** nessun endpoint espone *riassegnazione*, *modifica post-assegnazione*,
  *auto-scheduling*, *KPI* o *modifica del set di banchine* — per nessun ruolo, Admin incluso.

---

## 1. Storico assegnazioni (audit trail) — M

**Obiettivo.** Registrare in modo *append-only* ogni assegnazione e ogni partenza, per
ricostruire cosa è successo. Sola lettura, nessuna riassegnazione. ✅ in scopo.

**DB (`script6.sql` + context).** Nuova tabella `AssignmentHistory`:

| Colonna | Tipo | Note |
|---|---|---|
| `Id` | int IDENTITY PK | |
| `ShipId` | int | FK logica → Ships (no cascade) |
| `ShipName` | varchar(100) | snapshot |
| `Size` | varchar(2) | snapshot |
| `BerthId` | int | FK logica → Berths |
| `BerthName` | varchar(50) | snapshot |
| `OccupationStartDay` | int | |
| `OccupationEndDay` | int | = start + duration (fine esclusa) |
| `EventType` | varchar(10) | CHECK `IN ('Assigned','Departed')` |
| `EventDay` | int | giorno virtuale dell'evento |
| `CreatedAt` | datetime2 | timestamp reale (default `SYSUTCDATETIME()`) |

Append-only: **nessun** endpoint di update/delete. Snapshot denormalizzati così lo storico resta
leggibile anche se la nave cambia.

**Backend.**
- `Models/AssignmentHistory.cs` + `DbSet<AssignmentHistory>` nel context + config in
  `OnModelCreating` (CHECK su `EventType`).
- In `ShipsController.AssignShip`: prima di `SaveChangesAsync`, aggiungere una riga
  `EventType='Assigned'` (stesso `SaveChanges` = stessa transazione, già atomico).
- In `TimeService.AdvanceDayAsync`: dentro la transazione esistente, per ogni nave che passa a
  `Departed` inserire una riga `EventType='Departed'` (`EventDay = newDay`).
- Nuovo `Controllers/HistoryController.cs` → `GET /api/history` `[Authorize(Roles="Scheduler,Admin")]`,
  filtri opzionali `?shipId=&berthId=&eventType=`, ordinato per `CreatedAt DESC`. Risposta:
  `HistoryEntryDto`.

**Frontend.** Sezione "Storico" nella `SchedulerView` (e nella vista Admin): `getHistory()` in
`services/api.js` + tabella. Sola lettura.

**Accettazione.** Assegnare una nave → 1 riga `Assigned`. Next Day che fa partire N navi → N righe
`Departed`. Nessuna operazione muta o cancella righe esistenti.

---

## 2. Paginazione e filtri su `GET /api/ships` — S/M

**Obiettivo.** Gestire l'elenco navi al crescere dei dati. ✅ in scopo (comodità REST).

**Backend.** Estendere `ShipsController.GetShips` con query param:
`?status=Pending|Assigned|Departed&size=S|M|L|XL&page=1&pageSize=20`.
- Validazione: `page ≥ 1`, `1 ≤ pageSize ≤ 100` (default 20) → altrimenti `400`.
- Risposta `PagedResult<ShipDto>`: `{ items, page, pageSize, total, totalPages }`.
- Filtri applicati con `IQueryable` prima di `Skip/Take`; ordinamento stabile per `Id`.

**Frontend.** `ShipTable`/`OperatorView`: dropdown stato+taglia e controlli pagina
(prec/succ + "pagina X di Y"). `getShips(params)` in `services/api.js`.

**Accettazione.** `?status=Pending&pageSize=5` restituisce ≤5 navi Pending + `total` corretto;
`page=0` → 400.

---

## 3. Campo `Notes` in creazione nave — S

**Obiettivo.** Permettere all'Operatore di inserire note (la consegna cita *"es. nome, note"*).
La colonna `Ships.Notes` **esiste già** → nessuna migrazione. ✅ in scopo.

**Backend.** `DTOs/CreateShipRequest`: aggiungere `Notes` (opzionale, `[MaxLength(255)]`). In
`ShipsController.CreateShip` valorizzare `ship.Notes = request.Notes?.Trim()`.

**Frontend.** `ShipForm`: textarea "Note" opzionale. Mostrare `Notes` in `ShipTable` (colonna o
tooltip) e nell'eventuale dettaglio.

**Accettazione.** Creando una nave con note, il valore è persistito e visibile; senza note resta
`NULL` senza errori.

---

## 4. Docker + `docker-compose.yml` — M/L

**Obiettivo.** Demo con un comando su macchina pulita. ✅ in scopo (Sprint 9), nessun cambio di
dominio.

**Approccio (semplice, 2 servizi).**
- **`db`**: `mcr.microsoft.com/mssql/server:2022`, env `MSSQL_SA_PASSWORD`, volume per i dati,
  `healthcheck` con `sqlcmd`.
- **`app`**: `Dockerfile` multi-stage nel backend:
  1. stage **node** → `npm ci && npm run build` del `frontend/`;
  2. stage **dotnet sdk** → `dotnet publish` del server;
  3. copia il `dist/` del frontend in `wwwroot/` del backend (in produzione `Program.cs` già serve
     la SPA con `UseStaticFiles` + `MapFallbackToFile`).
  - Connection string da env `ConnectionStrings__DefaultConnection` (punta al servizio `db`).
- **Init schema/seed:** poiché usiamo script SQL (non migrazioni EF), serve un passo che applichi
  `script5.sql`/`script6.sql` dopo che `db` è healthy → job `init` con `mssql-tools` (`sqlcmd -i`)
  oppure entrypoint del backend che lo esegue una volta. **Da decidere** (raccomando job `init`
  separato, così l'app resta pulita).

**Accettazione.** `docker compose up` su macchina senza SQL/.NET/Node porta a login funzionante su
una porta pubblicata; `docker compose down -v` azzera tutto.

**Rischi.** Password SA in env (solo dev); tempo di warm-up di SQL Server (gestito da healthcheck).

---

## 5. Timeline Scheduler più leggibile — M (solo frontend)

**Obiettivo.** Rendere immediato *"quali banchine sono occupate/libere e quando"* — requisito
esplicito della consegna. ✅ in scopo (chiarezza funzionale, non estetica).

**Backend.** Nessuna modifica: `GET /api/scheduler/dashboard` restituisce già, per banchina,
`assignments` con `StartDay`/`EndDay` e `isOccupiedNow`.

**Frontend.** Potenziare la "Timeline banchine" esistente:
- barre di occupazione che coprono `[StartDay, EndDay)` sulla riga della banchina;
- colonna del giorno corrente evidenziata; orizzonte di ~14 giorni da `currentDay`;
- hover sulla barra → nome nave + finestra; stato libero/occupato distinguibile anche senza colore
  (utile per #8 accessibilità).

**Accettazione.** Due navi accodate sulla stessa banchina appaiono come due barre consecutive non
sovrapposte; il "oggi" è sempre visibile.

---

## 6. Annullare una nave — **solo se `Pending`** — S

**Obiettivo.** Rimuovere una nave registrata per errore, prima di qualsiasi assegnazione.
⚠️ borderline: la consegna vieta modifiche *dopo l'assegnazione*, non prima → **assunzione da
dichiarare**.

**Backend.** `DELETE /api/ships/{id}` `[Authorize(Roles="Operator,Admin")]`:
- se `ship.Status != Pending` → `409 Conflict` ("annullabile solo in stato Pending");
- se Pending → **hard delete** (la nave non è mai entrata nel ciclo della banchina, così il
  modello a 3 stati Pending/Assigned/Departed resta intatto — niente stato "Cancelled").

**Frontend.** Pulsante "Annulla" solo sulle righe Pending in `ShipTable`/`OperatorView`, con
conferma; poi refresh.

**Accettazione.** Delete di una Pending → 204/200 e sparisce; delete di una Assigned/Departed →
409 e resta.

---

## 7. Export CSV dello storico — S (dipende da #1)

**Obiettivo.** Scaricare lo storico per analisi offline. ✅ sola lettura.

**Backend.** `GET /api/history/export` `[Authorize(Roles="Scheduler,Admin")]` → `text/csv` con
header `Content-Disposition: attachment; filename="storico.csv"`. Stessa query di #1 (stessi
filtri). Escaping CSV corretto (virgolette/virgole).

**Frontend.** Pulsante "Esporta CSV" nella sezione Storico → download.

**Accettazione.** Il CSV ha intestazione + una riga per evento, apribile in Excel; rispetta i
filtri attivi.

---

## 8. Ruolo **Admin** (di piattaforma) — M

**Definizione (come concordato).** L'Admin ha potere **sulla web app, non sul dominio**: gestisce
gli **accessi/utenti** e può fare **tutto ciò che Operatore e Scheduler possono fare**. NON ottiene
poteri di dominio vietati (nessuna riassegnazione, nessun bypass delle regole, nessuna modifica del
set di banchine): quelle azioni non esistono per nessuno. ⚠️ deviazione lecita — *assunzione
giustificata* (ruolo di piattaforma, ortogonale ai due ruoli operativi).

**DB (`script6.sql` + context).**
- Aggiornare il CHECK `CK_Users_Role` da `IN ('Scheduler','Operator')` a
  `IN ('Scheduler','Operator','Admin')`.
- (Opzionale, per la disattivazione) aggiungere `Users.IsActive BIT NOT NULL DEFAULT 1`; il login
  rifiuta gli utenti disattivati.
- Seed di un admin iniziale: aggiungere `admin@blueharbor` al blocco seed di `Program.cs`
  (`PasswordHasher.Hash("admin123")`, ruolo `Admin`); per i DB già popolati, INSERT in `script6.sql`.

**Backend.**
- **Unione capacità** (Admin fa da Operatore *e* Scheduler): estendere gli attributi esistenti
  - `GET /api/ships`, `POST /api/ships`, `DELETE /api/ships/{id}` → `Roles="Operator,Admin"`
  - `POST /api/ships/{id}/assign`, `GET /api/scheduler/dashboard` → `Roles="Scheduler,Admin"`
  - `GET /api/history` (#1) → `Roles="Scheduler,Admin"`
  - `POST /api/time/next-day`, `GET /api/system/current-day` → restano `[Authorize]` (ogni ruolo).
- **Gestione accessi** — nuovo `Controllers/AdminController.cs` `[Authorize(Roles="Admin")]`:
  | Metodo | Percorso | Cosa fa |
  |---|---|---|
  | GET | `/api/admin/users` | elenco utenti (senza hash) |
  | POST | `/api/admin/users` | crea utente (username, ruolo, password iniziale → `PasswordHasher.Hash`) |
  | PUT | `/api/admin/users/{id}` | cambia ruolo / (dis)attiva / reset password |
  | DELETE | `/api/admin/users/{id}` | disattiva (preferibile) o elimina |
  - **Guardrail:** vietare l'auto-lockout e la rimozione/declassamento **dell'ultimo Admin attivo**
    (409). Validare ruolo ∈ {Operator, Scheduler, Admin} e username univoco (già UNIQUE).
- Sicurezza: stesso hashing didattico SHA-256 (la mancanza di salt resta la semplificazione nota).

**Frontend.**
- Vista **Admin** con: (a) **Gestione utenti** (tabella + crea/modifica ruolo/disattiva/reset), e
  (b) accesso alle **viste Operatore e Scheduler** (uno switcher, dato che l'Admin può operare in
  entrambe). Il routing è già per-ruolo (nessun react-router): aggiungere il ramo Admin.
- `services/api.js`: metodi `admin*`. `RoleContext` gestisce già il ruolo dal login.
- Credenziali demo da aggiungere alla cheat sheet: `admin@blueharbor` / `admin123`.

**Accettazione.**
- Admin fa login e riesce a: registrare una nave (come Operatore), assegnarla (come Scheduler),
  creare un nuovo utente Scheduler.
- Un Operatore che chiama `/api/admin/users` → `403`.
- Tentare di declassare l'unico Admin → `409`.
- Admin **non** ha alcun endpoint per riassegnare o modificare una nave già assegnata.

---

## Ordine consigliato

Quick win prima, poi le fondamenta, infine ciò che tocca l'auth e il packaging:

1. **#3 Notes** (S) — isolata.
2. **#2 Paginazione/filtri** (S/M) — isolata.
3. **#6 Annulla se Pending** (S) — isolata.
4. **#1 Storico assegnazioni** (M) — fondamenta per #7.
5. **#7 Export CSV** (S) — dopo #1.
6. **#5 Timeline Scheduler** (M) — solo frontend.
7. **#8 Admin** (M) — tocca i ruoli di più controller: farlo a base stabile.
8. **#4 Docker** (M/L) — packaging finale.

## Checklist trasversale per ogni feature

- [ ] Modifica DB in `script6.sql` **e** in `BlueHarborContext` (se applicabile).
- [ ] Endpoint restituisce **DTO**, non entità; errori come Problem Details.
- [ ] `[Authorize(Roles=...)]` corretto (Admin incluso dove serve).
- [ ] Aggiornare `blueharbor-reference.html` (tabella API, modello dati, sprint).
- [ ] Aggiornare la board Trello.
- [ ] Verifica dal vivo del flusso (non solo build).

---

*Documento di piano — accompagna [`proposte-evoluzione.md`](proposte-evoluzione.md).*
