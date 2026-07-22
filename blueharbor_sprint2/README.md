# BlueHarbor Terminal

Web app per la gestione delle banchine di un terminal container (progetto
Learning by Project, ITS WSA 2025-2027). Tre ruoli:

- **Operatore** — registra le navi in arrivo (il sistema genera taglia,
  giorno di arrivo e durata della sosta; la nave nasce `Pending`). Può inserire
  una **nota** facoltativa e **annullare** una nave finché è `Pending`;
- **Scheduler** — assegna le navi alle 8 banchine fisse (1 XL, 1 L, 2 M, 4 S,
  solo taglie identiche) con **accodamento**: se la banchina è occupata, la
  nave parte dal primo slot libero. Il tempo avanza col pulsante **Next Day**
  (giorno virtuale, nessun real-time); a fine sosta la nave diventa `Departed`.
  Vede la **timeline** delle banchine e lo **storico** assegnazioni (con export CSV);
- **Admin** — ruolo di piattaforma: **gestisce gli utenti** (crea, cambia ruolo,
  reset password, attiva/disattiva), **programma le finestre di manutenzione delle
  banchine** e ha le capacità di Operatore e Scheduler.
  Nessun potere di dominio aggiuntivo (niente riassegnazioni o bypass delle regole:
  una manutenzione che incrocia navi già assegnate viene rifiutata).

## Architettura

React 19 + Vite (frontend) → ASP.NET Core Web API con EF Core (backend) →
SQL Server. Autenticazione JWT con ruoli (`Operator` / `Scheduler` / `Admin`)
applicata su tutti gli endpoint (401/403). Errori come Problem Details (RFC 7807).
`GET /api/ships` è paginato e filtrabile. Lo storico assegnazioni è una tabella
**append-only** (`AssignmentHistory`) alimentata dall'assegnazione e dal Next Day.

| Cartella | Contenuto |
|---|---|
| `BlueHarbor_QPD_WSA.Server/` | Backend: controller (ships, scheduler, history, admin, auth), servizi di dominio (`SchedulingRules`, `TimeService`), auth |
| `frontend/` | Frontend React: viste Operatore, Scheduler (timeline + assegnazione guidata + storico) e Admin |
| `database/` | Script T-SQL incrementali: `script5.sql` (base) + `script6.sql` (storico) + `script7.sql` (ruolo Admin) + `script8.sql` (manutenzioni banchina) |

## Deploy cloud (produzione)

L'app gira su **Azure Container Apps** con **Azure SQL Database** (tier Basic):

- URL pubblico: `https://app-blueharbor.politeriver-97b0d932.swedencentral.azurecontainerapps.io`
- **Deploy automatico**: a ogni merge su `main` che tocca `blueharbor_sprint2/`, la GitHub
  Action `.github/workflows/deploy.yml` costruisce l'immagine, la pubblica su GHCR
  (`ghcr.io/lufo-336/blueharbor`, taggata per SHA) e aggiorna la Container App.
- I segreti (connection string, chiave JWT) vivono come secret della Container App e
  arrivano al container via variabili d'ambiente: **non stanno né nel repo né nell'immagine**.
- Telemetria: Application Insights, attiva solo dove `APPLICATIONINSIGHTS_CONNECTION_STRING`
  è presente (in locale resta spenta).

Il compose locale (opzione A) resta il **piano B della demo**.

## Avvio — opzione A: un solo comando (Docker)

Richiede solo Docker. Da questa cartella (`blueharbor_sprint2/`):

```bash
docker compose up --build      # DB + app su http://localhost:8080
# per azzerare tutto (DB compreso):
docker compose down -v
```

L'app si **auto-inizializza** (crea lo schema e semina banchine, giorno virtuale
e utenti demo): non serve applicare a mano gli script SQL.

## Avvio — opzione B: server locali (sviluppo)

Prerequisiti: .NET SDK 10, Node.js 20+, SQL Server locale (istanza di default) con SSMS.

1. **Database** (solo la prima volta): eseguire in SSMS `database/script5.sql`
   (crea il DB `BlueHarbor` con le 8 banchine e il giorno virtuale a 1) e poi
   gli incrementali `database/script6.sql`, `database/script7.sql` e `database/script8.sql`.
   La connection string è in `BlueHarbor_QPD_WSA.Server/appsettings.json`.
2. **Backend**: `dotnet run --launch-profile https` dentro
   `BlueHarbor_QPD_WSA.Server/` → API su `https://localhost:7008`
   (all'avvio lo schema/seed mancante viene comunque completato in automatico).
3. **Frontend**: `npm install` e `npm run dev` dentro `frontend/` →
   `http://localhost:5173` (il proxy Vite gira `/api` sul backend).

## Utenti demo

| Ruolo | Email | Password |
|---|---|---|
| Operatore | `operator@blueharbor` | `operator123` |
| Scheduler | `scheduler@blueharbor` | `scheduler123` |
| Admin | `admin@blueharbor` | `admin123` |

## Checklist demo (verifica end-to-end)

1. Login Operatore → registra una nave (con nota facoltativa) → toast con
   taglia/arrivo/durata generate. Filtra/pagina l'elenco navi; annulla una nave `Pending`.
2. Login Scheduler → seleziona la nave → le banchine compatibili si evidenziano
   con l'anteprima tratteggiata del primo giorno libero → "Assegna". La timeline
   mostra occupazioni, colonna "oggi" e stato libero/occupato di ogni banchina.
   La timeline mostra **14 giorni** alla volta ma è **navigabile a finestre**
   (frecce `‹`/`›`, pulsante "oggi"): una nave con arrivo lontano (fino a **+30**)
   si vede spostandosi sulla finestra successiva. Il giorno proposto
   dall'anteprima non cambia spostando la finestra.
3. Caso di accodamento: assegna una seconda nave alla stessa banchina →
   l'anteprima (e l'assegnazione) parte DOPO la fine dell'occupazione esistente.
4. "Next Day" fino a fine sosta → la nave diventa `Departed` e libera la banchina.
   La sezione **Storico** registra assegnazioni e partenze (esportabili in CSV).
5. Login Admin → crea un utente, cambia ruolo, disattiva/riattiva; passa alle
   viste Operatore/Scheduler dallo switcher.
6. Refresh della pagina dopo il login → si resta dentro l'app (niente flash login).
7. **Reset simulazione** (Admin, tab "Gestione utenti"): riporta l'ambiente a
   giorno 1 senza navi né storico — banchine e utenti restano intatti. Utile per
   ripartire puliti prima o dopo una demo.
8. Login Admin → tab **Manutenzioni** → programma una finestra su una banchina libera nei
   prossimi giorni. Login Scheduler → la timeline mostra il blocco "Manutenzione"; assegnando una
   nave a quella banchina, l'occupazione parte **dopo** la finestra. Prova a programmare una
   manutenzione dove c'è già una nave assegnata: viene **rifiutata** — le navi assegnate non si
   spostano mai.

## Note tecniche per chi sviluppa

- Il contratto API è documentato in ogni controller; il frontend vi accede solo
  tramite `frontend/src/services/api.js`.
- **Test**: `dotnet test` (da `blueharbor_sprint2/`) esegue i 26 unit test xUnit
  (algoritmo di accodamento + password hashing). Fa parte della verifica standard
  prima di ogni commit.
- L'algoritmo di accodamento vive in `Services/SchedulingRules.cs` (funzioni
  pure). Il frontend ne tiene una replica in `frontend/src/services/scheduling.js`
  SOLO per l'anteprima: se si cambia la regola, aggiornare entrambi
  (check di parità: `node checks/scheduling.check.mjs` da `frontend/`).
- Lo schema è gestito con script SQL versionati; il modello EF
  (`Models/BlueHarborContext.OnModelCreating`) deve restare allineato. All'avvio
  l'app chiama `EnsureCreated()` (utile nel container; no-op su un DB esistente).
- Stack scelto a giugno 2026: il data access usa EF Core (deviazione consapevole
  dal piano ADO.NET, decisa il 2026-07-15 per non riscrivere il layer dati).
