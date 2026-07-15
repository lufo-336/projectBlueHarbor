# BlueHarbor Terminal — implementazione completa

## 1. Cos'è

Questa è l'implementazione di riferimento didattica di **BlueHarbor Terminal**: copre l'intero percorso Sprint 0-10, cioè l'MVP (registrazione navi, assegnazione a banchina con accodamento automatico, avanzamento del giorno virtuale) più tutte le estensioni viste nel corso (autenticazione a ruoli, gestione errori uniforme, paginazione, storico/audit delle assegnazioni, containerizzazione Docker, accessibilità).

Il codice è commentato riga per riga ed è scritto usando **solo le tecnologie del corso WSA**: backend ASP.NET Core con **ADO.NET puro** (niente Entity Framework Core o altri ORM), frontend React/Vite, database SQL Server con script T-SQL scritti a mano.

Documenti di riferimento:
- specifica di design: `documentazione/design/2026-07-02-blueharbor-completo-design.md`
- piano esecutivo: `documentazione/design/2026-07-02-blueharbor-completo-piano.md`
- schede sprint: `documentazione/sprint/`

**Fuori scope** (deliberatamente non implementato): nessuna riassegnazione di una nave dopo che è stata assegnata a una banchina, nessuna ottimizzazione o assegnazione automatica delle banchine, nessun calcolo di KPI.

## 2. Mappa sprint → codice

| Sprint | Cosa entra | File reali |
|---|---|---|
| 0-1 | schema+seed SQL, scheletro Web API, SystemController, Topbar+ruoli, fetch giorno | `database/01-schema.sql`, `database/02-seed.sql`, `backend/Data/Db.cs`, `backend/Controllers/SystemController.cs`, `backend/Services/SettingsService.cs`, `frontend/src/components/Topbar.jsx` |
| 2 | ShipGeneratorService, POST/GET ships, OperatorView (form+tabella) | `backend/Services/ShipGeneratorService.cs`, `backend/Controllers/ShipsController.cs`, `backend/Dtos/ShipDtos.cs`, `frontend/src/components/OperatorView.jsx`, `frontend/src/components/ShipForm.jsx`, `frontend/src/components/ShipTable.jsx` |
| 3 | BerthAssignmentService (accodamento), dashboard+assign, SchedulerView+tabellone | `backend/Services/BerthAssignmentService.cs`, `backend/Controllers/SchedulerController.cs`, `backend/Dtos/SchedulerDashboardDto.cs`, `backend/Dtos/AssignShipRequest.cs`, `frontend/src/components/SchedulerView.jsx`, `frontend/src/components/BerthBoard.jsx`, `frontend/src/components/PendingShipsList.jsx` |
| 4 | TimeService transazionale, POST next-day, refresh globale | `backend/Services/TimeService.cs`, `backend/Controllers/TimeController.cs`, `frontend/src/context/DayContext.jsx` |
| 5 | reset.sql, Swagger completo, stati caricamento/errore UI, controllo ruoli UI | `database/reset.sql`, `frontend/src/context/ToastContext.jsx`, `frontend/src/components/Toast.jsx` |
| 6 | Users seed, PBKDF2, AuthController, cookie auth, [Authorize], LoginView, AuthContext | `backend/Controllers/AuthController.cs`, `backend/Services/AuthService.cs`, `backend/Dtos/AuthDtos.cs`, `backend/Models/User.cs`, `frontend/src/components/LoginView.jsx`, `frontend/src/context/AuthContext.jsx` |
| 7 | middleware ProblemDetails, validazione DTO, paginazione ships (SQL+UI) | `backend/Middleware/ErrorHandlingMiddleware.cs`, `backend/Middleware/DomainExceptions.cs` |
| 8 | AssignmentHistory (DDL+insert transazionali), GET /api/history, tab Storico | `database/03-history.sql`, `backend/Services/HistoryService.cs`, `backend/Controllers/HistoryController.cs`, `backend/Dtos/HistoryEntryDto.cs`, `frontend/src/components/HistoryTab.jsx` |
| 9 | Dockerfile x2, docker-compose, connection string via env | `backend/Dockerfile`, `frontend/Dockerfile`, `frontend/nginx.conf`, `docker-compose.yml` |
| 10 | semantica/ARIA/contrasto/tastiera/responsive nei componenti | `frontend/src/index.css`, `frontend/src/App.css` (tutti i componenti frontend toccati) |

## 3. Avvio in sviluppo

Prerequisiti: SQL Server locale (LocalDB o istanza named), .NET 10 SDK, Node.js.

```bash
# 1. Script SQL nell'ordine (crea DB "BlueHarborCompleto" prima, o usa CREATE DATABASE nello script se presente)
sqlcmd -S localhost -i database/01-schema.sql
sqlcmd -S localhost -i database/03-history.sql
sqlcmd -S localhost -i database/02-seed.sql

# 2. Backend
cd backend
dotnet run
# ascolta su http://localhost:5200 (vedi Properties/launchSettings.json)

# 3. Frontend (altro terminale)
cd frontend
npm install
npm run dev
# Vite proxya /api verso http://localhost:5200 (vedi vite.config.js)
```

URL applicazione: quello stampato da Vite (tipicamente `http://localhost:5173`).

Credenziali demo: `operator` / `Porto2026!` (ruolo Operator), `scheduler` / `Porto2026!` (ruolo Scheduler).

Connection string di default (`backend/appsettings.json`): `Server=localhost;Database=BlueHarborCompleto;Trusted_Connection=True;TrustServerCertificate=True` — adattarla se SQL Server è altrove.

> Nota ambiente: su installazioni con **ODBC Driver 18** (`sqlcmd` recente), i comandi sopra possono fallire con un errore di catena di certificati SSL non attendibile. In quel caso aggiungere il flag `-C` (trust server certificate), es. `sqlcmd -S localhost -C -i database/01-schema.sql`.

## 4. Avvio con Docker

```bash
docker compose up --build
```

App su `http://localhost:8081`. Stesse credenziali demo.

## 5. Reset demo

```bash
sqlcmd -S localhost -i database/reset.sql
```

Svuota ships/history, riporta il giorno virtuale a 1.

> Vale la stessa nota di §3 su ODBC Driver 18: se `sqlcmd` fallisce per la catena di certificati SSL, aggiungere `-C` (es. `sqlcmd -S localhost -C -i database/reset.sql`).

## 6. Sequenza di collaudo manuale

1. Login come `operator`.
2. Registra una nave (nome a scelta) — il server genera Size/ArrivalDay/Duration casuali.
3. Logout, login come `scheduler`.
4. Assegna due navi della stessa Size alla stessa banchina, una dopo l'altra (Esempio 1 del documento di accodamento): la seconda nave viene messa in coda automaticamente — se la prima occupa fino al giorno 6, la seconda parte esattamente al **giorno 7**.
5. Premi Next Day ripetutamente fino a superare la fine occupazione di una nave (Esempio 2): con durata tale che l'occupazione termina al giorno 5, lo stato della nave diventa **Departed esattamente al giorno 5** (non prima, non dopo).
6. Vai alla tab Storico: deve mostrare sia l'evento di assegnazione (Assigned) sia l'evento di partenza (Departed) per le navi movimentate.

## 7. Convenzioni

Identificatori (classi, metodi, variabili, endpoint) in inglese; commenti e prosa in italiano.

Fuori scope: niente riassegnazione dopo l'assegnazione, niente automatismi/ottimizzazioni, niente KPI.
