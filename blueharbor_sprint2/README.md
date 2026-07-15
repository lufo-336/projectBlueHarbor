# BlueHarbor Terminal

Web app per la gestione delle banchine di un terminal container (progetto
Learning by Project, ITS WSA 2025-2027). Due ruoli:

- **Operatore** — registra le navi in arrivo (il sistema genera taglia,
  giorno di arrivo e durata della sosta; la nave nasce `Pending`);
- **Scheduler** — assegna le navi alle 8 banchine fisse (1 XL, 1 L, 2 M, 4 S,
  solo taglie identiche) con **accodamento**: se la banchina è occupata, la
  nave parte dal primo slot libero. Il tempo avanza col pulsante **Next Day**
  (giorno virtuale, nessun real-time); a fine sosta la nave diventa `Departed`.

## Architettura

React 19 + Vite (frontend) → ASP.NET Core Web API con EF Core (backend) →
SQL Server. Autenticazione JWT con ruoli (`Operator` / `Scheduler`) applicata
su tutti gli endpoint. Errori come Problem Details (RFC 7807).

| Cartella | Contenuto |
|---|---|
| `BlueHarbor_QPD_WSA.Server/` | Backend: controller, servizi di dominio (`SchedulingRules`, `TimeService`), auth |
| `frontend/` | Frontend React: viste Operatore e Scheduler (timeline + assegnazione guidata) |
| `database/` | Script T-SQL (usare il più recente, `script5.sql`) |

## Prerequisiti

- .NET SDK 10, Node.js 20+, SQL Server locale (istanza di default) con SSMS.

## Avvio in locale

1. **Database** (solo la prima volta): eseguire `database/script5.sql` in SSMS
   → crea il DB `BlueHarbor` con le 8 banchine e il giorno virtuale a 1.
   La connection string è in `BlueHarbor_QPD_WSA.Server/appsettings.json`.
2. **Backend**: `dotnet run --launch-profile https` dentro
   `BlueHarbor_QPD_WSA.Server/` → API su `https://localhost:7008`
   (in Development gli utenti demo vengono seminati in automatico).
3. **Frontend**: `npm install` e `npm run dev` dentro `frontend/` →
   `http://localhost:5173` (il proxy Vite gira `/api` sul backend).

## Utenti demo

| Ruolo | Email | Password |
|---|---|---|
| Operatore | `operator@blueharbor` | `operator123` |
| Scheduler | `scheduler@blueharbor` | `scheduler123` |

## Checklist demo (verifica end-to-end)

1. Login Operatore → registra una nave → toast con taglia/arrivo/durata generate.
2. Login Scheduler → seleziona la nave → le banchine compatibili si evidenziano
   con l'anteprima tratteggiata del primo giorno libero → "Assegna".
3. Caso di accodamento: assegna una seconda nave alla stessa banchina →
   l'anteprima (e l'assegnazione) parte DOPO la fine dell'occupazione esistente.
4. "Next Day" fino a fine sosta → la nave diventa `Departed` e libera la banchina.
5. Refresh della pagina dopo il login → si resta dentro l'app (niente flash login).

## Note tecniche per chi sviluppa

- Il contratto API è documentato in ogni controller; il frontend vi accede solo
  tramite `frontend/src/services/api.js`.
- L'algoritmo di accodamento vive in `Services/SchedulingRules.cs` (funzioni
  pure). Il frontend ne tiene una replica in `frontend/src/services/scheduling.js`
  SOLO per l'anteprima: se si cambia la regola, aggiornare entrambi
  (check di parità: `node checks/scheduling.check.mjs` da `frontend/`).
- Stack scelto a giugno 2026: il data access usa EF Core (deviazione consapevole
  dal piano ADO.NET, decisa il 2026-07-15 per non riscrivere il layer dati).
