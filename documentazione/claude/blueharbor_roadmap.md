# BlueHarbor Terminal - Piano di Sviluppo a Tappe (Roadmap)

Questo documento contiene la scomposizione dettagliata del progetto **BlueHarbor Terminal**, organizzata in 5 tappe sequenziali e suddivisa per aree tecnologiche (Database SQL, Backend C#, Frontend React, Supervisione QA/Architect) con relativi task e micro-attività atomiche.

> Convenzione: **tutto il codice/identificatori è in inglese** (tabelle, colonne, classi, endpoint, variabili). La prosa resta in italiano.

---

## 📅 TAPPA 1: Configurazione dell'Infrastruttura (Database & Setup)

### 🗄️ Area 1: Database SQL (Data Layer)
* **Task 1.1: Creazione dello Schema DDL (Data Definition Language)**
  * **Micro-Task 1.1.1:** Scrivere lo script di creazione della tabella `Berths` (Campi: `Id` INT PK, `Name` VARCHAR, `Size` VARCHAR).
  * **Micro-Task 1.1.2:** Scrivere lo script di creazione della tabella `Ships` (Campi: `Id` INT PK, `Name` VARCHAR, `Size` VARCHAR, `ArrivalDay` INT, `Duration` INT, `Status` VARCHAR, `BerthId` INT FK nullable, `OccupationStartDay` INT nullable).
  * **Micro-Task 1.1.3:** Scrivere lo script per la tabella di sistema `Settings` (Campi: `Key` VARCHAR PK, `Value` VARCHAR) per tracciare il tempo regolamentato dal progetto.
* **Task 1.2: Seeding Iniziale dei Dati**
  * **Micro-Task 1.2.1:** Creare lo script `INSERT` per inserire le 8 berths fisse tassative: 1 XL, 1 L, 2 M, 4 S.
  * **Micro-Task 1.2.2:** Creare lo script `INSERT` per impostare `CurrentVirtualDay` al valore `"1"`.

### ⚙️ Area 2: Backend C# (Application Layer)
* **Task 2.1: Setup del Progetto e Configurazione**
  * **Micro-Task 2.1.1:** Inizializzare una soluzione C# ASP.NET Core Web API svuotandola dai controller demo (es. WeatherForecast).
  * **Micro-Task 2.1.2:** Configurare la stringa di connessione SQL nel file `appsettings.json`.
  * **Micro-Task 2.1.3:** Installare i pacchetti per l'accesso ai dati (ADO.NET) tramite NuGet.
* **Task 2.2: Modellazione delle Classi Core (Entity/DTO)**
  * **Micro-Task 2.2.1:** Mappare le classi C# `Ship` e `Berth` in base allo schema SQL.
  * **Micro-Task 2.2.2:** Creare un enum C# per gli stati ammessi della nave (`ShipStatus`: `Pending`, `Assigned`, `Departed`).
* **Task 2.3: Creazione dell'Endpoint di Test Temporale**
  * **Micro-Task 2.3.1:** Sviluppare un `SystemController` con un endpoint `GET /api/system/current-day`.
  * **Micro-Task 2.3.2:** Scrivere la logica per leggere il giorno virtuale dal DB e restituirlo in formato JSON (`{ "currentDay": 1 }`).

### 💻 Area 3: Frontend React (Presentation Layer)
* **Task 3.1: Inizializzazione e Struttura**
  * **Micro-Task 3.1.1:** Creare l'app React (usando Vite) e pulire i file CSS di default.
  * **Micro-Task 3.1.2:** Organizzare le cartelle di progetto: `/components` (pulsanti, tabelle), `/views` (Operator, Scheduler), `/services` (chiamate API C#).
* **Task 3.2: Layout Globale e Gestione Stato Ruoli**
  * **Micro-Task 3.2.1:** Costruire una Topbar HTML/CSS fissa che mostrerà il "Virtual day" e un selettore (es. menu a tendina o tab) per switchare il ruolo utente simulato (Operator / Scheduler).
  * **Micro-Task 3.2.2:** Configurare uno stato React globale (o un Context) chiamato `currentRole` per condizionare la visualizzazione delle pagine in base al ruolo selezionato.
* **Task 3.3: Collegamento API Base**
  * **Micro-Task 3.3.1:** Integrare una libreria per le chiamate HTTP (es. Axios o il nativo `fetch`).
  * **Micro-Task 3.3.2:** Sviluppare una funzione che all'avvio dell'app interroghi l'endpoint C# per stampare a schermo il giorno corrente virtuale reale preso dal database.

### 📐 Area 4: Supervisione e Allineamento (Architect / QA)
* **Task 4.1: Validazione dei Requisiti**
  * **Micro-Task 4.1.1:** Verificare che i vincoli sulle `Size` delle berths inserite nel DB rispecchino al millimetro le specifiche assegnate.
  * **Micro-Task 4.1.2:** Eseguire il primo test End-to-End: verificare che modificando a mano il giorno nel database, l'interfaccia React mostri il giorno aggiornato dopo un refresh della pagina.

---

## 📅 TAPPA 2: Sviluppo del Flusso "Operator" (Inserimento Ships)

### 🗄️ Area 1: Database SQL (Data Layer)
* **Task 1.1: Scrittura delle Query di Persistenza**
  * **Micro-Task 1.1.1:** Preparare la query SQL di `INSERT INTO Ships` prestando attenzione ai campi calcolati (`BerthId` e `OccupationStartDay` dovranno essere passati come `NULL`).
  * **Micro-Task 1.1.2:** Preparare la query SQL di `SELECT` per recuperare tutte le ships registrate nel sistema, ordinate per `Id` o per giorno di inserimento, per popolare la vista dell'operatore.

### ⚙️ Area 2: Backend C# (Application Layer)
* **Task 2.1: Logica di Generazione Casuale (Domain Logic)**
  * **Micro-Task 2.1.1:** Creare una classe di utilità o un servizio (es. `ShipGeneratorService`) che utilizzi la classe `Random` di C#.
  * **Micro-Task 2.1.2:** Implementare l'assegnazione casuale della `Size` estraendo un valore dall'enum delle dimensioni (`S`, `M`, `L`, `XL`).
  * **Micro-Task 2.1.3:** Implementare il calcolo di `ArrivalDay` recuperando il giorno virtuale corrente dal DB e sommandoci un intero random compreso tra `1` e `30`.
  * **Micro-Task 2.1.4:** Implementare il calcolo di `Duration` generando un intero random compreso tra `3` e `15` giorni.
* **Task 2.2: Implementazione degli Endpoint del Controller**
  * **Micro-Task 2.2.1:** Creare il metodo `POST /api/ships` all'interno di `ShipsController`. Il metodo deve accettare un DTO leggero contenente solo il `Name` della ship.
  * **Micro-Task 2.2.2:** Integrare la logica di generazione casuale nel flusso della POST, impostare lo `Status` della ship su `ShipStatus.Pending` e salvare il record sul DB.
  * **Micro-Task 2.2.3:** Creare il metodo `GET /api/ships` per restituire l'elenco completo delle ships utili al pannello dell'operatore.

### 💻 Area 3: Frontend React (Presentation Layer)
* **Task 3.1: Creazione della Vista Operator**
  * **Micro-Task 3.1.1:** Sviluppare il componente `OperatorView.jsx` che si attiverà solo quando lo stato del ruolo globale corrisponde a "Operator".
  * **Micro-Task 3.1.2:** Strutturare il layout della pagina in due sezioni: in alto il modulo di inserimento, in basso lo storico delle ships.
* **Task 3.2: Sviluppo del Form di Registrazione**
  * **Micro-Task 3.2.1:** Creare un form HTML controllato in React con un unico input di testo per il `Name` della ship e un pulsante "Register".
  * **Micro-Task 3.2.2:** Gestire l'evento di `onSubmit` del form per effettuare la chiamata `POST` verso l'endpoint C#, disabilitando il bottone durante il caricamento per evitare inserimenti duplicati.
* **Task 3.3: Tabella di Riepilogo (Ships Registrate)**
  * **Micro-Task 3.3.1:** Creare un componente tabella per mostrare le proprietà delle ships (`Name`, `Size`, `ArrivalDay`, `Duration`, `Status`).
  * **Micro-Task 3.3.2:** Implementare un `useEffect` che recuperi i dati tramite `GET /api/ships` al caricamento della pagina e aggiorni la tabella ogni volta che una nuova ship viene registrata con successo.

### 📐 Area 4: Supervisione e Allineamento (Architect / QA)
* **Task 4.1: Verifica delle Regole di Generazione**
  * **Micro-Task 4.1.1:** Effettuare test di inserimento multipli (es. inserire 20 ships di fila) e verificare tramite query SQL che i valori di `Size`, `ArrivalDay` e `Duration` rispettino perfettamente i range previsti (nessun arrivo oltre i 30 giorni dal corrente, nessuna durata inferiore a 3 o superiore a 15).
  * **Micro-Task 4.1.2:** Assicurarsi che le ships appena create abbiano tassativamente lo `Status` impostato su `Pending` e i campi relativi alla berth vuoti.

---

## 📅 TAPPA 3: Sviluppo Core - Lato "Scheduler" e Berths

### 🗄️ Area 1: Database SQL (Data Layer)
* **Task 1.1: Query di Lettura per lo Scheduler**
  * **Micro-Task 1.1.1:** Scrivere la query per selezionare solo le ships con `Status` `Pending` (le uniche assegnabili).
  * **Micro-Task 1.1.2:** Scrivere la query per estrarre la lista delle berths con l'elenco delle relative ships già pianificate (`Status` `Assigned`), ordinato per `OccupationStartDay`. Questo serve per ricostruire la timeline.
* **Task 1.2: Query di Aggiornamento Pianificazione**
  * **Micro-Task 1.2.1:** Preparare la query di `UPDATE` sulla tabella `Ships` per impostare `BerthId`, `OccupationStartDay` e cambiare lo `Status` in `Assigned`.

### ⚙️ Area 2: Backend C# (Application Layer)
* **Task 2.1: Logica di Validazione e Calcolo Slot (Business Logic)**
  * **Micro-Task 2.1.1:** Implementare un controllo rigoroso in C# che verifichi la compatibilità dimensionale: una ship può essere assegnata solo a una berth della sua identica `Size` (es. ship M solo su berth M).
  * **Micro-Task 2.1.2:** Sviluppare l'algoritmo di accodamento temporale: se lo Scheduler sceglie una berth, il sistema controlla le ships già assegnate a quella berth. Se il periodo richiesto dalla nuova ship (a partire dal suo `ArrivalDay` per la sua `Duration`) si sovrappone a pianificazioni esistenti, la ship viene pianificata nel primo giorno utile in cui la berth torna libera.
* **Task 2.2: Implementazione degli Endpoint per lo Scheduler**
  * **Micro-Task 2.2.1:** Creare l'endpoint `GET /api/scheduling/dashboard` che restituisce in un unico JSON le ships pendenti e la situazione attuale delle berths.
  * **Micro-Task 2.2.2:** Creare l'endpoint `POST /api/scheduling/assign` che riceve un DTO con `ShipId` e `BerthId`, esegue i calcoli dello slot temporale e aggiorna il database.

### 💻 Area 3: Frontend React (Presentation Layer)
* **Task 3.1: Creazione della Vista Scheduler**
  * **Micro-Task 3.1.1:** Sviluppare il componente `SchedulerView.jsx` (attivo solo quando il ruolo selezionato è "Scheduler").
  * **Micro-Task 3.1.2:** Creare una colonna laterale che mostri la lista delle ships "Pending" con i loro dettagli (`Size`, `ArrivalDay`, `Duration`).
* **Task 3.2: Sviluppo del Tabellone / Timeline delle Berths**
  * **Micro-Task 3.2.1:** Progettare una griglia visiva (usando HTML e CSS Grid/Flexbox) che rappresenti le 8 berths fisse del porto.
  * **Micro-Task 3.2.2:** Mostrare all'interno di ogni berth i "blocchi" di occupazione delle ships già assegnate, indicando visivamente i giorni in cui la berth è occupata.
* **Task 3.3: Azione di Assegnazione**
  * **Micro-Task 3.3.1:** Implementare un sistema di interazione semplice (es. menu a tendina accanto a ogni ship pending con la lista delle berths compatibili, oppure selezione combinata ship -> berth).
  * **Micro-Task 3.3.2:** Gestire l'invio dei dati al backend tramite fetch/axios alla POST e aggiornare istantaneamente l'interfaccia (rimuovendo la ship dalle pendenti e inserendola nel tabellone della berth).

### 📐 Area 4: Supervisione e Allineamento (Architect / QA)
* **Task 4.1: Verifica dei Vincoli dello Scheduler**
  * **Micro-Task 4.1.1:** Testare lo scenario di sovrapposizione: se la Ship A (`Duration` 5, `ArrivalDay` 2) viene assegnata alla Berth 1, e successivamente la Ship B (stessa `Size`, `ArrivalDay` 3) viene assegnata alla stessa berth, verificare che C# assegni la Ship B a partire dal giorno 7.
  * **Micro-Task 4.1.2:** Verificare che il frontend disabiliti o segnali chiaramente l'errore se si tenta di assegnare una ship a una berth di `Size` non compatibile.

---

## 📅 TAPPA 4: Integrazione e Logica "Next Day"

### 🗄️ Area 1: Database SQL (Data Layer)
* **Task 1.1: Query del Cambio Giornaliero**
  * **Micro-Task 1.1.1:** Scrivere lo script SQL per incrementare il valore di `CurrentVirtualDay` nella tabella `Settings`.
  * **Micro-Task 1.1.2:** Scrivere la query di aggiornamento di massa per le ships: cambiare lo `Status` in `Departed` per tutte le ships in stato `Assigned` il cui ciclo di occupazione è terminato rispetto al nuovo giorno corrente (Formula: `OccupationStartDay + Duration <= @newCurrentDay`).

### ⚙️ Area 2: Backend C# (Application Layer)
* **Task 2.1: Implementazione del Servizio Temporale (Time Engine)**
  * **Micro-Task 2.1.1:** Creare un metodo nel servizio (es. `TimeService.AdvanceDayAsync()`) che apra una transazione sul database.
  * **Micro-Task 2.1.2:** Eseguire all'interno della transazione l'incremento del giorno e il rilascio delle ships. Se una delle due operazioni fallisce, eseguire il rollback.
  * **Micro-Task 2.1.3:** Assicurarsi che la logica rispetti il vincolo di *Out of Scope*: il codice C# deve solo aggiornare gli stati passati, senza tentare di fare schedulazioni o allocazioni automatiche per il futuro.
* **Task 2.2: Endpoint Controller**
  * **Micro-Task 2.2.1:** Creare l'endpoint `POST /api/time/next-day` nel `SystemController`.
  * **Micro-Task 2.2.2:** Configurare la risposta dell'endpoint in modo che restituisca il nuovo `currentDay` e una conferma dell'avvenuto aggiornamento.

### 💻 Area 3: Frontend React (Presentation Layer)
* **Task 3.1: Integrazione del Pulsante "Next Day"**
  * **Micro-Task 3.1.1:** Inserire nella Topbar un pulsante ben visibile "Next Day" associato a un'icona temporale.
  * **Micro-Task 3.1.2:** Collegare al click del pulsante la chiamata Axios/Fetch verso `POST /api/time/next-day`.
* **Task 3.2: Gestione del Refresh Globale dello Stato**
  * **Micro-Task 3.2.1:** Sviluppare una funzione di callback globale (o un trigger nel Context) che, al successo della POST del Next Day, forzi il ri-puntamento (re-fetch) di tutti i dati attivi: il nuovo `currentDay` nella Topbar, la lista ships dell'Operator e la timeline dello Scheduler.
  * **Micro-Task 3.2.2:** Assicurarsi che le ships appena passate nello `Status` `Departed` vengano rimosse dalle liste di pianificazione attiva dello Scheduler o mostrate visivamente come "Concluse/Storiche".

### 📐 Area 4: Supervisione e Allineamento (Architect / QA)
* **Task 4.1: Test di Tenuta del Flusso Temporale**
  * **Micro-Task 4.1.1:** Effettuare un test con uno scenario specifico: inserire una ship che arriva il giorno 2 con `Duration` 3 giorni. Assegnarla. Cliccare "Next Day" ripetutamente e verificare che nei giorni 2, 3 e 4 risulti in stato `Assigned` occupando la berth, e che passi a `Departed` esattamente all'inizio del giorno 5.
  * **Micro-Task 4.1.2:** Verificare che le ships in stato `Departed` liberino effettivamente lo slot sulla berth per i giorni successivi, permettendo allo Scheduler di assegnare nuove ships su quella stessa berth per date future.

---

## 📅 TAPPA 5: Rifinitura, Documentazione e Consegna

### 🗄️ Area 1: Database SQL (Data Layer)
* **Task 1.1: Tracciabilità e Vincoli di Integrità**
  * **Micro-Task 1.1.1:** Verificare che tutti i vincoli di chiave esterna (`FK_Ships_Berths`) siano attivi e impediscano la cancellazione accidentale di berths occupate.
  * **Micro-Task 1.1.2:** Preparare uno script SQL di "Reset" veloce (`TRUNCATE` / `DELETE` delle ships e ripristino di `CurrentVirtualDay` a 1) per poter ripulire il database prima della presentazione davanti ai docenti/valutatori.

### ⚙️ Area 2: Backend C# (Application Layer)
* **Task 2.1: Gestione delle Eccezioni e Validazione**
  * **Micro-Task 2.1.1:** Aggiungere blocchi `try-catch` nei controller C# per intercettare eventuali errori imprevisti e restituire codici di stato HTTP corretti (es. `400 Bad Request` se si tenta di forzare l'assegnazione di una ship XL su una berth S).
  * **Micro-Task 2.1.2:** Centralizzare o ripulire i log di console in C# per facilitare la lettura dei flussi durante l'ispezione del codice.
* **Task 2.2: Autodocumentazione delle API**
  * **Micro-Task 2.2.1:** Verificare che Swagger (OpenAPI) sia configurato correttamente nel file `Program.cs`.
  * **Micro-Task 2.2.2:** Controllare che tutti gli endpoint (`/api/ships`, `/api/scheduling`, `/api/time`) siano visibili e testabili direttamente dalla pagina di Swagger.

### 💻 Area 3: Frontend React (Presentation Layer)
* **Task 3.1: Feedback Utente e Stati di Errore**
  * **Micro-Task 3.1.1:** Implementare messaggi di avviso puliti (es. alert HTML o scritte di errore rosse) se una chiamata API fallisce o se un'operazione non è consentita.
  * **Micro-Task 3.1.2:** Assicurarsi che i pulsanti di azione (come "Register" o "Assign") mostrino uno stato disabilitato o un indicatore di caricamento durante l'attesa della risposta dal server C#.
* **Task 3.2: Controllo Rigido dei Ruoli**
  * **Micro-Task 3.2.1:** Verificare che, cambiando il ruolo nella Topbar, l'interfaccia escluda tassativamente le azioni non permesse (l'Operator non deve vedere i controlli dello Scheduler; lo Scheduler non deve poter creare ships).

### 📐 Area 4: Deliverable e Qualità (Architect / QA)
* **Task 4.1: Code Review di Conformità (Verifica dei Vincoli)**
  * **Micro-Task 4.1.1:** Verificare l'assenza totale di funzionalità *Out of Scope*: accertarsi che non siano stati scritti algoritmi di ottimizzazione automatica e che non sia possibile modificare o riassegnare una ship dopo che è stata pianificata.
* **Task 4.2: Redazione del Documento Architetturale**
  * **Micro-Task 4.2.1:** Redigere la sezione "Architettura complessiva", descrivendo l'approccio 3-Tier scelto (React, C# Web API, SQL Database).
  * **Micro-Task 4.2.2:** Elencare i componenti principali (Controller, Servizi di logica random, Context di React) e le loro responsabilità.
  * **Micro-Task 4.2.3:** Inserire il modello dati ad alto livello (lo schema delle tabelle SQL definito nella Tappa 1).
  * **Micro-Task 4.2.4:** Documentare le decisioni progettuali chiave e i compromessi accettati (es. la scelta di gestire il tempo virtuale come un intero incrementale per escludere la complessità di ore/minuti).
