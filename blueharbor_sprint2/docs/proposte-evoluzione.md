# Proposte di evoluzione — BlueHarbor Terminal

> Documento di lavoro per il team. Elenca le feature candidate per i prossimi sprint,
> **filtrate contro i vincoli della consegna** (lista *"fuori scope"* + principio
> *"semplicità e coerenza preferibili alla complessità"*). Obiettivo: aggiungere valore
> **senza far crescere l'entità del progetto** oltre ciò che la consegna chiede.
>
> Legenda scopo: ✅ in scopo · ⚠️ borderline, da giustificare come assunzione · ❌ da evitare.
> Fonte di verità sul comportamento attuale: codice in `blueharbor_sprint2/` + `blueharbor-reference.html`.

## I paletti (cosa NON dobbiamo fare)

La consegna mette **esplicitamente fuori scope**:

- pianificazione **automatica** / ottimizzazione delle assegnazioni;
- calcolo di **punteggi o KPI**;
- eventi **real-time**;
- modellazione di **terminal reali** o normative;
- **modifiche o riassegnazioni** dopo l'assegnazione.

E raccomanda: *semplicità e coerenza preferibili alla complessità*; la valutazione guarda a
**correttezza, chiarezza e qualità architetturale**, non ad algoritmi avanzati o alla grafica.

Ogni proposta rispetta questi paletti — o dichiara apertamente dove li sfiora.

## Sintesi

| #  | Feature                                   | Valore          | Scopo | Sforzo | Roadmap   |
|----|-------------------------------------------|-----------------|:-----:|:------:|-----------|
| 1  | Storico assegnazioni (audit trail)        | Alto            | ✅    | M      | Sprint 8  |
| 2  | Unit test su `SchedulingRules`            | Alto            | ✅    | S      | —         |
| 3  | Validazione input + Problem Details       | Medio           | ✅    | S      | Sprint 7  |
| 4  | Paginazione/filtri su `GET /api/ships`    | Medio           | ✅    | S      | Sprint 7  |
| 5  | Campo `Notes` in creazione nave           | Basso           | ✅    | S      | —         |
| 6  | Docker + `docker-compose.yml`             | Alto (demo/arch)| ✅    | M      | Sprint 9  |
| 7  | Script di reset/seed pulito               | Medio           | ✅    | S      | —         |
| 8  | Timeline Scheduler più leggibile          | Medio           | ✅    | M      | —         |
| 9  | Accessibilità (WCAG/ARIA)                 | Medio           | ✅    | M      | Sprint 10 |
| 10 | Data reale sul giorno virtuale            | Basso           | ✅ (display) | S | —         |
| 11 | **Ruolo Admin (di piattaforma)**          | Medio-Alto      | ⚠️    | M      | —         |
| 12 | Annulla nave **solo se Pending**          | Basso           | ⚠️    | S      | —         |
| 13 | Export CSV dello storico                  | Basso           | ✅    | S      | dopo #1   |
| 14 | **Banchine in manutenzione (Admin)**      | Medio           | ⚠️    | M      | —         |

> **Stato di attuazione**
> - ✅ **#1, #3, #4, #5, #6, #8, #11, #12, #13** — implementate e mergiate con la **PR #2** (17/07).
> - ✅ **#2** unit test su `SchedulingRules` — chiusa con la **PR #3** (17/07, 20 test xUnit).
> - ✅ **#7** reset simulazione (endpoint Admin + pulsante UI, non più script) e
>   ✅ **#10** data reale accanto al giorno virtuale — chiuse col branch **rifiniture** (22/07),
>   insieme all'hashing PBKDF2 e alla timeline navigabile (fuori lista: emerse il 17/07).
> - ✅ **#14** banchine in manutenzione — implementata il 22/07 (design del 17/07).
> - ⏳ **#9** accessibilità — resta l'unica aperta (Sprint 10).

## Tier 1 — nel cuore del progetto (consigliati)

Colpiscono i criteri che la consegna valuta esplicitamente, senza toccare il dominio.

- **1. Storico assegnazioni** — tabella `AssignmentHistory` *append-only*, scritta nella
  **stessa transazione** di assegnazione e di partenza; endpoint `GET /api/history` sola lettura.
  In scopo: registra ciò che è successo, **non** abilita riassegnazioni. Ottimo esercizio di
  transazionalità e design dei dati.
- **2. Unit test su `SchedulingRules`** — è una **funzione pura**: il candidato ideale, oggi
  senza test. Dimostra la correttezza dell'algoritmo che è il cuore del progetto. Miglior
  rapporto valore/sforzo.
- **3. Validazione input + Problem Details coerenti** — Data Annotations sui DTO, `400`
  uniformi. Robustezza; completa lo Sprint 7 già previsto.
- **4. Paginazione/filtri su `GET /api/ships`** (`?status=Pending&page=1&pageSize=20`) — utile
  al crescere delle navi; buon esercizio REST.
- **5. Campo `Notes` in creazione** — la colonna `Ships.Notes` **esiste già** ma l'UI raccoglie
  solo il nome; la consegna cita *"es. nome della nave, note"*. Chiusura di conformità da 30 minuti.

## Tier 2 — contorno utile (non toccano il dominio)

- **6. Docker + `docker-compose.yml`** — demo con un comando su macchina pulita (SQL Server in
  container, connection string da variabile d'ambiente). Zero cambi di dominio, alto ritorno
  architetturale. Sprint 9.
- **7. Script di reset/seed pulito** — un *"torna a giorno 1 con poche navi"*. Bisogno reale:
  in sviluppo il DB accumula navi di test e un giorno virtuale sempre più alto.
- **8. Timeline Scheduler più leggibile** — barre di occupazione multi-giorno, hover con
  dettagli. Serve **direttamente** il requisito *"lo Scheduler deve identificare facilmente
  banchine occupate/libere"*. È chiarezza funzionale, non estetica.
- **9. Accessibilità** — tastiera, `aria-*`, contrasto WCAG AA. Buona pratica, in scopo. Sprint 10.
- **10. Data reale sul giorno virtuale** — ancora `Day1Date` in `Settings`; il giorno N si
  mostra come `Day1Date + (N-1)`. Rende tangibile il tempo **restando a giorni interi** (niente
  ore/minuti): è **solo presentazione**. Verificare prima se il `DayContext` attuale non lo
  copra già in parte.

## 11. Ruolo Admin — sì, ma come ruolo *di piattaforma*

La consegna definisce **due ruoli operativi** (Operatore, Scheduler) e *"ogni utente un solo
ruolo"*. Un Admin è una **deviazione**, ma è ammessa: la consegna dice che *"le assunzioni sono
ammesse se opportunamente giustificate"*. La chiave è **cosa può fare**: dev'essere un ruolo di
**amministrazione della piattaforma**, ortogonale al dominio — non un superuser che scavalca le
regole.

**L'Admin PUÒ (in scopo, amministrazione della piattaforma):**

- **Gestione utenti** — crea / elenca / disattiva account Operatore e Scheduler, assegna il
  ruolo. *(Risolve il nodo aperto "chi seeda gli utenti" e sostituisce gli utenti hardcoded
  seminati all'avvio.)*
- **Gestione della simulazione** — reset dello scenario per una demo pulita (svuota le navi,
  riporta `CurrentVirtualDay = 1`); eventualmente "vai a giorno N". *(Copre il bisogno reale
  dello script di reset, #7, dandogli una UI protetta.)*
- **Supervisione in sola lettura** — vede tutte le navi (ogni stato), tutte le banchine e lo
  storico assegnazioni (#1).

**L'Admin NON PUÒ (o violerebbe la consegna):**

- ❌ riassegnare o modificare navi già assegnate — vietato a **chiunque**, Admin incluso;
- ❌ assegnare navi al posto dello Scheduler — si terrebbe pulita la separazione dei ruoli;
- ❌ cambiare il **set fisso** di banchine (1 XL · 1 L · 2 M · 4 S) — è un vincolo di dominio;
- ❌ introdurre auto-scheduling, KPI o real-time.

**Giustificazione (da mettere nel documento architetturale):** l'Admin è un ruolo *di
piattaforma* (utenti + ambiente), distinto dai due ruoli *operativi* del dominio; il principio
"ogni utente un solo ruolo" resta valido; nessuna delle sue capacità tocca le regole di
assegnazione o il modello temporale.

**Impatto tecnico (piccolo, estende un pattern già presente):**

- **DB:** aggiornare il CHECK `CK_Users_Role` da `IN ('Scheduler','Operator')` a includere
  `'Admin'` (in `BlueHarborContext.OnModelCreating` + script SQL).
- **Backend:** nuovi endpoint sotto `[Authorize(Roles = "Admin")]` (es. `POST/GET /api/admin/users`,
  `POST /api/admin/simulation/reset`). Il pattern `[Authorize(Roles=...)]` è **già** in uso.
- **Auth:** il JWT porta già il claim `role` → funziona senza modifiche all'infrastruttura.
- **Frontend:** una terza vista selezionata per ruolo (non serve un router: la vista cambia già
  in base al ruolo).

**Verdetto:** utile soprattutto per **gestione utenti** e **reset demo**; deviazione lecita se
documentata. Tier 2, sforzo medio.

## Tier 3 — borderline (si può, con paletti espliciti)

- **12. Annullare una nave *solo se Pending*** — cancellare una nave registrata per errore,
  **mai** dopo l'assegnazione. La consegna vieta le modifiche *dopo l'assegnazione*, non prima:
  da dichiarare come assunzione esplicita.
- **13. Export CSV dello storico** — sola lettura, innocuo; ma solo **dopo** aver realizzato
  l'audit trail (#1).
- **14. Banchine in manutenzione** — l'Admin dichiara finestre `[inizio, fine)` in cui una banchina
  non è utilizzabile; le navi assegnate **dopo** si accodano oltre, usando l'algoritmo esistente.
  **Paletti rispettati:** nessuna nave già assegnata viene mai spostata (conflitto → `409`); il
  **set** di banchine non cambia (restano 8: 1 XL · 1 L · 2 M · 4 S), cambia la **disponibilità**;
  nessuna pianificazione automatica (i giorni li sceglie l'Admin), nessun KPI, nessun real-time.
  Da dichiarare come assunzione, come per #11 e #12.

## Da evitare — snaturano il progetto

- ❌ **Assegnazione automatica / ottimizzazione** delle banchine — è *letteralmente* la prima
  voce del "fuori scope".
- ❌ **KPI, punteggi, metriche di efficienza** — fuori scope esplicito.
- ❌ **Real-time / WebSocket / notifiche push** — il modello è "Next Day", non real-time.
- ❌ **Modifica/riassegnazione dopo l'assegnazione** — vietato dalla consegna.
- ❌ **Modellare un terminal reale** (gru, cargo, più taglie per banchina, normative).

## Priorità consigliata

Per massimizzare il ritorno sui criteri di valutazione (*correttezza, chiarezza, qualità
architetturale*) senza far crescere lo scope:

1. **Storico assegnazioni (#1)** — ritorno architetturale più alto.
2. **Unit test su `SchedulingRules` (#2)** — correttezza sull'algoritmo centrale.
3. **Docker-compose (#6)** — qualità architetturale + demo a prova di macchina pulita.

Quick win da mezz'ora ciascuno: **campo Notes (#5)** e **script di reset (#7)**.

Il **ruolo Admin (#11)** è l'aggiunta "di piattaforma" più interessante se volete una gestione
utenti reale al posto del seed hardcoded: tenetelo nel perimetro descritto sopra.

---

*Documento di proposta — non è impegno di sprint. Aggiornare la board Trello di conseguenza.*
