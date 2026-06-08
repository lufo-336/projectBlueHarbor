# BlueHarbor Terminal — Guida operativa & Roadmap per Trello

> Documento per **gestire il progetto come team**, pensato per chi non ha mai usato
> Scrum/Trello. Si divide in 4 parti:
> 1. **Il metodo** — come lavoriamo insieme
> 2. **Configurare Trello** — board, liste, etichette, card
> 3. **La roadmap a sprint** — le card già pronte da copiare, con chi le fa
> 4. **Errori da non fare** — gli sbagli tipici dei principianti
>
> Parametri da decidere (segnati con ⚙️): durata sprint, scadenza finale.

---

## PARTE 1 — Il metodo (come ci organizziamo)

### 1.1 La squadra

| Persona | Ruolo | Area roadmap | Di cosa risponde |
|---|---|---|---|
| **Dev C#** | Sviluppatore backend | Area 2 | Tutto il .NET: logica, algoritmi, API, DTO, ADO.NET, Swagger |
| **Dev SQL** | Sviluppatore database | Area 1 | Schema, seeding, query, FK, transazioni |
| **Dev Frontend 1** | Sviluppatore frontend / jolly | Area 3 | App React (insieme al Frontend 2) |
| **Dev Frontend 2** | Sviluppatore frontend / jolly | Area 3 | App React (insieme al Frontend 1) |
| **Luca** | Gestione (Scrum Master + Product Owner "proxy") + QA/Architect | Area 4 | Coordinamento, backlog, integrazione, qualità, documento e pitch |

**Nota importante:** il "cliente" è la **specifica PDF**. Il *Goal* del progetto è fissato lì
e **non si può cambiare**. Luca interpreta la specifica e decide le priorità, ma nessuno
inventa funzioni nuove o ne toglie di richieste.

### 1.2 Scrum in versione "studenti", in 4 frasi

- Dividiamo il lavoro in **Sprint** brevi (⚙️ **1 settimana** ciascuno).
- Ogni sprint ha **un obiettivo concreto e dimostrabile** ("a fine sprint si vede X funzionare").
- Ci si parla **ogni giorno** per 10-15 minuti (Daily) per sbloccarsi a vicenda.
- A fine sprint si **mostra il risultato** (Review) e si **decide come migliorare** (Retrospective).

### 1.3 Le 4 cerimonie (gli appuntamenti fissi)

| Cerimonia | Quando | Durata | Chi | Cosa si fa |
|---|---|---|---|---|
| **Sprint Planning** | Inizio sprint (es. lunedì) | 30-45 min | Tutti | Si scelgono le card da fare nello sprint e si assegnano |
| **Daily Scrum** | Ogni giorno, stessa ora | 10-15 min, in piedi | Dev | Ognuno dice: *cosa ho fatto / cosa farò / dove sono bloccato*. **Niente discussioni lunghe** |
| **Sprint Review** | Fine sprint (es. venerdì) | 20-30 min | Tutti | Si mostra ciò che funziona. Luca segna fatto/non fatto |
| **Retrospective** | Fine sprint, dopo la Review | 15-20 min | Tutti | Cosa è andato bene, cosa migliorare il prossimo sprint |

> Daily anche da remoto su un canale testuale va bene, l'importante è la **costanza**.

### 1.4 Regola d'oro delle dipendenze

I lavori dipendono l'uno dall'altro in catena:

```
DB (schema)  →  Backend C# (endpoint)  →  Frontend (integrazione)
```

Per questo in ogni sprint **SQL e C# partono per primi**, il Frontend integra dopo.
Finché l'endpoint non esiste, i Frontend lavorano "a vuoto" sull'interfaccia con dati finti
(mock) e collegano le API appena pronte. → vedi i jolly nella Parte 3.

---

## PARTE 2 — Configurare Trello

> In Trello: una **Board** (lavagna) contiene **Liste** (colonne); ogni Lista contiene
> **Card** (cartoncini = i compiti). Ogni Card può avere una **Checklist** (micro-passi),
> **Etichette** (colori), **Membri** (chi la fa) e una **Scadenza**.

### 2.1 Le Liste (colonne) — crea queste, in quest'ordine

1. **📋 Backlog** — tutte le card future, ancora da fare
2. **🎯 Sprint corrente** — le card scelte per lo sprint in corso
3. **🔨 In corso** — ci sto lavorando adesso (max 1-2 a testa!)
4. **👀 Review / QA** — finito dallo sviluppatore, aspetta il controllo di Luca
5. **✅ Fatto** — verificato e chiuso
6. **🚧 Bloccati** — fermo per un impedimento (se ne parla al Daily)

> Il flusso di una card: **Backlog → Sprint corrente → In corso → Review/QA → Fatto**.

### 2.2 Le Etichette (colori) — una per area + una per i blocchi

- 🟩 **C#** (backend)
- 🟦 **SQL** (database)
- 🟨 **Frontend**
- 🟪 **Gestione / QA**
- 🟥 **BLOCCO** (impedimento da risolvere)

### 2.3 Il formato di ogni Card (template — usatelo sempre)

```
TITOLO:        verbo + cosa     (es. "Creare tabella Navi")
ETICHETTA:     l'area (colore)
MEMBRO:        la persona assegnata
SCADENZA:      fine dello sprint
DESCRIZIONE:   1-2 righe: cosa fa e perché serve
CHECKLIST:     i micro-passi (le sotto-attività)
```

### 2.4 Definition of Done (DoD) — quando una card è DAVVERO "Fatta"

Incollate questa checklist (o teniamola come regola condivisa) in ogni card "tecnica".
Una card va in **✅ Fatto** solo se:

- [ ] Il codice/lo script fa quello che dice il titolo
- [ ] È stato provato almeno una volta e funziona
- [ ] È stato caricato su Git (commit + push)
- [ ] Non rompe le parti già fatte dagli altri
- [ ] Luca (QA) ha dato l'ok in Review

### 2.5 Regole d'oro per i principianti

- **Una card = un compito piccolo** (mezza giornata circa). Se è troppo grande, spezzala.
- **Massimo 1-2 card "In corso" a testa.** Finisci prima di iniziare altro.
- **Se sei bloccato, sposta la card in 🚧 e mettilo nel Daily.** Non restare fermo in silenzio.
- **Aggiorna Trello in tempo reale**, non a fine giornata. La board deve dire la verità.

---

## PARTE 3 — La roadmap a sprint (le card da copiare)

> Legenda: ogni **▸ card** è un cartoncino Trello. I trattini sotto sono la **checklist**.
> Tra `[ ]` chi la fa.

---

### 🛠️ SPRINT 0 — Setup & Allineamento *(prima di scrivere qualsiasi codice)*
**Obiettivo:** tutti hanno gli strumenti installati, il repo esiste, ci siamo accordati sui nomi.

▸ **[Tutti] Installare gli strumenti di sviluppo**
- Visual Studio + .NET SDK
- Node.js (per React/Vite)
- SQL Server + SSMS (SQL Server Management Studio)
- Git + account GitHub

▸ **[Luca] Creare il repository su GitHub e invitare il team**
- Creare repo, aggiungere i 4 collaboratori
- Cartelle base: `/backend`, `/frontend`, `/database`, `/docs`
- File `README.md` con nome progetto e come avviarlo (si riempie strada facendo)

▸ **[Luca] Creare e configurare la board Trello** (come da Parte 2)

▸ **[Dev SQL + Dev C#] Accordo sui nomi e i tipi** *(la card più importante di Sprint 0)*
- Decidere convenzione: nomi dominio in **italiano** (`Navi`, `Banchine`, `Impostazioni`), stati in **inglese** (`Pending/Assigned/Departed`)
- Concordare nomi esatti delle colonne e i tipi (es. `Id INT`, `Nome VARCHAR`, ...)
- Scriverli nel file `/docs/modello-dati.md` → fonte di verità per tutti

▸ **[Tutti] Sprint Planning dello Sprint 1**

---

### 📅 SPRINT 1 — Infrastruttura: DB + scheletro app + "giorno corrente"
**Obiettivo dimostrabile:** apro l'app e vedo a schermo il **Giorno Virtuale** letto dal database.
*(È una "fetta verticale": un pezzettino di tutti e 3 i livelli che funziona end-to-end.)*

**Database — 🟦 Dev SQL**
▸ **[SQL] Creare lo schema delle tabelle**
- Tabella `Banchine` (`Id`, `Nome`, `Dimensione`)
- Tabella `Navi` (`Id`, `Nome`, `Dimensione`, `GiornoArrivo`, `DurataOccupazione`, `Stato`, `BanchinaId` FK nullable, `GiornoInizioOccupazione` nullable)
- Tabella `Impostazioni` (`Chiave`, `Valore`) per il giorno corrente
▸ **[SQL] Inserire i dati iniziali (seeding)**
- 8 banchine: 1 XL, 1 L, 2 M, 4 S
- Giorno corrente virtuale = `1`

**Backend — 🟩 Dev C#**
▸ **[C#] Creare il progetto ASP.NET Core Web API**
- Nuova soluzione, togliere i controller demo (WeatherForecast)
- Connection string SQL Server in `appsettings.json`
- Predisporre l'accesso dati con ADO.NET
▸ **[C#] Creare le classi del modello**
- Classi `Nave` e `Banchina` (secondo `/docs/modello-dati.md`)
- Enum `StatoNave` = `Pending`, `Assigned`, `Departed`
▸ **[C#] Endpoint giorno corrente**
- `GET /api/sistema/giorno-corrente` legge il valore dal DB e lo restituisce in JSON

**Frontend — 🟨 Dev Frontend 1 + 2**
▸ **[FE1] Creare l'app React con Vite** e pulire i file di default
▸ **[FE1] Organizzare le cartelle**: `/components`, `/views`, `/services`
▸ **[FE2] Topbar fissa**
- Mostra il "Giorno Virtuale Corrente"
- Selettore ruolo (Operatore / Scheduler)
- Stato globale `currentRole` (Context React)
▸ **[FE2] Collegamento API di base**
- Funzione che all'avvio chiama l'endpoint del giorno corrente e lo stampa in Topbar

**QA — 🟪 Luca**
▸ **[Luca] Test end-to-end Sprint 1**
- Cambio il giorno a mano nel DB → dopo refresh il frontend mostra il nuovo giorno
- Verifico che le 8 banchine nel DB siano esatte (1 XL, 1 L, 2 M, 4 S)

---

### 📅 SPRINT 2 — Flusso Operatore (registrare le navi)
**Obiettivo dimostrabile:** l'Operatore scrive un nome, crea una nave, e la vede comparire in tabella.

**Database — 🟦 Dev SQL**
▸ **[SQL] Query di persistenza navi**
- `INSERT` nave (con `BanchinaId` e `GiornoInizioOccupazione` = `NULL`)
- `SELECT` elenco navi (ordinato per Id o giorno di inserimento)

**Backend — 🟩 Dev C#**
▸ **[C#] Servizio di generazione casuale (`ShipGeneratorService`)**
- Dimensione casuale tra `S/M/L/XL`
- Giorno di arrivo = giorno corrente + random `1..30`
- Durata occupazione = random `3..15`
▸ **[C#] Endpoint creazione nave**
- `POST /api/navi` (riceve solo il nome) → genera valori, stato `Pending`, salva
▸ **[C#] Endpoint lista navi**
- `GET /api/navi` → elenco completo

**Frontend — 🟨 Dev Frontend 1 + 2**
▸ **[FE1] Vista Operatore (`OperatorView`)** — visibile solo se ruolo = Operatore; layout in 2 sezioni (form sopra, storico sotto)
▸ **[FE1] Form registrazione nave** — input "Nome", pulsante "Registra", bottone disabilitato durante il caricamento
▸ **[FE2] Tabella navi registrate** — colonne: Nome, Dimensione, Giorno Arrivo, Durata, Stato
▸ **[FE2] Aggiornamento automatico** — `useEffect` carica le navi all'apertura e dopo ogni inserimento

**QA — 🟪 Luca**
▸ **[Luca] Test regole di generazione**
- Inserisco 20 navi → controllo via SQL: arrivo mai oltre 30 gg, durata sempre 3-15, tutte `Pending`, banchina vuota

---

### 📅 SPRINT 3 — Flusso Scheduler (assegnare le banchine) ⭐ *il cuore del progetto*
**Obiettivo dimostrabile:** lo Scheduler assegna una nave `Pending` a una banchina compatibile,
e il sistema calcola da solo il primo giorno libero (accodamento).

> ⚠️ **Prima di iniziare le card C# di questo sprint**, fate un mini-incontro per validare a
> tavolino l'**algoritmo di accodamento** con un esempio numerico (vedi Parte 4). È il punto
> più delicato di tutto il progetto.

**Database — 🟦 Dev SQL**
▸ **[SQL] Query di lettura per lo Scheduler**
- Navi in stato `Pending`
- Banchine con le loro navi `Assigned`, ordinate per `GiornoInizioOccupazione`
▸ **[SQL] Query di assegnazione**
- `UPDATE` nave: imposta `BanchinaId`, `GiornoInizioOccupazione`, stato → `Assigned`

**Backend — 🟩 Dev C#**
▸ **[C#] Validazione compatibilità dimensione** — una nave va solo su banchina della sua stessa dimensione
▸ **[C#] Algoritmo di accodamento (primo slot libero)** — calcola il primo giorno in cui la banchina è libera per l'intera durata della nave
▸ **[C#] Endpoint dashboard scheduler** — `GET /api/schedulazione/dashboard` (navi pendenti + stato banchine)
▸ **[C#] Endpoint assegnazione** — `POST /api/schedulazione/assegna` (riceve NaveId + BanchinaId, calcola lo slot, salva)

**Frontend — 🟨 Dev Frontend 1 + 2**
▸ **[FE1] Vista Scheduler (`SchedulerView`)** — visibile solo se ruolo = Scheduler
▸ **[FE1] Lista navi Pending** — con dimensione, giorno arrivo, durata
▸ **[FE2] Tabellone delle 8 banchine** — griglia (CSS Grid/Flex) con i "blocchi" di occupazione delle navi assegnate
▸ **[FE2] Azione di assegnazione** — menu con le sole banchine compatibili, invio alla POST, aggiornamento immediato

**QA — 🟪 Luca**
▸ **[Luca] Test sovrapposizione e vincoli**
- Nave A (arriva g2, durata 5) su Banchina 1, poi Nave B (stessa misura, arriva g3) sulla stessa → B deve iniziare al **giorno 7**
- Tentativo di assegnare una nave a banchina di misura diversa → bloccato/segnalato

---

### 📅 SPRINT 4 — Next Day (il motore del tempo)
**Obiettivo dimostrabile:** premo "Next Day", il giorno avanza, le navi che hanno finito vanno in `Departed` e liberano la banchina.

**Database — 🟦 Dev SQL**
▸ **[SQL] Query del cambio giornaliero**
- `UPDATE` incremento del giorno corrente in `Impostazioni`
- `UPDATE` di massa: navi `Assigned` → `Departed` se `GiornoInizioOccupazione + Durata <= nuovoGiorno`

**Backend — 🟩 Dev C#**
▸ **[C#] Servizio tempo (`TimeService.AdvanceDay`)** — in **transazione**: incrementa il giorno + rilascia le navi; se una fallisce → rollback. Niente assegnazioni automatiche (è fuori scope!)
▸ **[C#] Endpoint Next Day** — `POST /api/tempo/next-day` → restituisce il nuovo giorno

**Frontend — 🟨 Dev Frontend 1 + 2**
▸ **[FE1] Pulsante "Avanza Giorno"** in Topbar, collegato alla POST
▸ **[FE2] Refresh globale** — al successo aggiorna giorno, lista navi Operatore e timeline Scheduler; le navi `Departed` spariscono dalle liste attive (o mostrate come "concluse")

**QA — 🟪 Luca**
▸ **[Luca] Test tenuta temporale**
- Nave arriva g2, durata 3, assegnata → resta `Assigned` nei giorni 2-3-4, passa a `Departed` al **giorno 5**
- Verifico che la banchina liberata sia di nuovo assegnabile per date successive

---

### 📅 SPRINT 5 — Rifinitura, documentazione, consegna
**Obiettivo dimostrabile:** app robusta a prova di errore + documento architetturale + presentazione pronta.

**Database — 🟦 Dev SQL**
▸ **[SQL] Vincoli di integrità** — FK `FK_Navi_Banchine` attiva
▸ **[SQL] Script di RESET demo** — pulisce le navi e riporta il giorno a 1 (per la presentazione)

**Backend — 🟩 Dev C#**
▸ **[C#] Gestione errori** — try-catch nei controller, status code corretti (es. `400` se assegnazione incompatibile)
▸ **[C#] Pulizia log + Swagger** — log leggibili; verificare che Swagger mostri tutti gli endpoint testabili

**Frontend — 🟨 Dev Frontend 1 + 2**
▸ **[FE1] Messaggi di errore e stati di caricamento** — avvisi puliti se una chiamata fallisce; pulsanti disabilitati durante l'attesa
▸ **[FE2] Controllo rigido dei ruoli** — l'Operatore non vede i comandi dello Scheduler e viceversa

**Gestione / QA — 🟪 Luca + Tutti**
▸ **[Luca] Code review di conformità** — verificare che NON ci siano funzioni fuori scope (no ottimizzazioni automatiche, no riassegnazioni dopo l'assegnazione)
▸ **[Tutti] Documento architetturale** (`/docs`) — architettura 3-tier, componenti e responsabilità, modello dati, decisioni e compromessi
▸ **[Tutti] Preparare la presentazione/pitch** + prova generale della demo usando lo script di RESET

---

## PARTE 4 — Errori da non fare (anti-pattern dei principianti)

1. **Partire a scrivere codice senza accordarsi sui nomi.** → Sprint 0 esiste apposta. Il file `modello-dati.md` è sacro.
2. **Card troppo grandi** ("fai il backend"). → Spezzale in compiti da mezza giornata.
3. **Frontend fermo ad aspettare il backend.** → I jolly costruiscono l'interfaccia con dati finti e collegano le API dopo.
4. **Validare l'algoritmo di accodamento direttamente nel codice.** → Prima a tavolino con un esempio numerico (lo Sprint 3 lo richiede esplicitamente).
5. **Aggiungere "feature carine" non richieste.** → Tutto ciò che non è nella specifica è fuori scope e fa perdere punti. Semplicità > complessità.
6. **Non aggiornare Trello.** → Se la board non dice la verità, il Daily è inutile.
7. **Saltare la Retrospective.** → 15 minuti che migliorano lo sprint dopo.

---

## 📆 Calendario per LEZIONI (il monte ore reale)

Il modulo **Learning by Project** dà **42 ore**, in **lezioni da 4 ore** (≈ 10 lezioni + un
margine di 2h). La cadenza Scrum si aggancia alle **lezioni**: 1 lezione ≈ 1 sprint.
Consegna/presentazione finale ≈ **terza settimana di luglio**.

> **Dove siamo adesso:** ~ora 6-10 → siamo in **Lezione 2-3**, in fase di **Sprint 0** (questa
> pianificazione È il lavoro dello Sprint 0).

| Lezione | Ore (cum.) | Sprint / Focus | Obiettivo dimostrabile |
|---|---|---|---|
| **Lez. 1** | 1–4 | Teoria Agile/Scrum + presentazione progetto | *(già svolta)* |
| **Lez. 2** ⬅️ *qui* | 5–8 | **Sprint 0 — Kickoff & Setup** | Decisioni chiuse, strumenti installati, repo + Trello pronti |
| **Lez. 3** | 9–12 | **Sprint 1 — Infrastruttura** | Si vede il "Giorno Virtuale" letto dal DB, end-to-end |
| **Lez. 4** | 13–16 | **Sprint 2 — Operatore** | L'Operatore registra navi e le vede in tabella |
| **Lez. 5** | 17–20 | **Sprint 3a — Scheduler (logica)** | Query Pending/banchine + algoritmo di accodamento |
| **Lez. 6** | 21–24 | **Sprint 3b — Scheduler (UI)** ⭐ | Tabellone banchine + azione di assegnazione |
| **Lez. 7** | 25–28 | **Sprint 4 — Next Day** | Avanzamento tempo, navi in Departed, banchine liberate |
| **Lez. 8** | 29–32 | **Sprint 5 — Rifinitura** | Gestione errori, controllo ruoli, robustezza |
| **Lez. 9** | 33–36 | **Documento + prove demo** | Documento architetturale + buffer per imprevisti |
| **Lez. 10** | 37–40 | **Presentazione / pitch** | Demo finale davanti ai docenti |
| *(margine)* | 41–42 | Riserva | Imprevisti |

> Lo "Scheduler" (il cuore) si prende **2 lezioni** (5 e 6) perché è il pezzo più rischioso.
> La Lezione 9 fa anche da cuscinetto: se Sprint 3 sfora, si recupera lì.

### ⏱️ Come usare le 4 ore di lezione (importante!)

4 ore a settimana **non bastano** a scrivere tutto il codice di uno sprint. La lezione serve
da **punto di sincronizzazione**, il grosso dello sviluppo si fa **tra una lezione e l'altra**:

- **Inizio lezione (~30 min):** Sprint Review dello sprint precedente + Sprint Planning del nuovo (si scelgono le card)
- **Durante (~3 ore):** lavoro a coppie, integrazione dei pezzi, Daily veloce, Luca sblocca i problemi
- **Fine lezione (~30 min):** si verifica l'incremento + mini-retrospettiva
- **Tra le lezioni (a casa):** ognuno completa le proprie card; Daily "asincrono" sulla chat del team

### ⚙️ Da fissare ancora in classe
- Frequenza reale delle lezioni (settimanale?) e mappatura lezione → data di calendario
- Quanto lavoro "a casa" tra una lezione e l'altra è realistico per il team
- Canale per il Daily asincrono (Slack / Discord / WhatsApp)
