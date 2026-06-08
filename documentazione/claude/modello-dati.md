# BlueHarbor Terminal — Modello dati (bozza da ratificare in Sprint 0)

> Questo è il **contratto** condiviso tra Dev SQL e Dev C#: descrive tabelle, colonne, tipi,
> chiavi e relazioni. È **documentazione**, non lo script SQL (quello lo scrive Dev SQL nello
> Sprint 1, basandosi su questo file).
>
> ⚠️ È una **bozza**: va letta insieme in Sprint 0 e approvata. Le decisioni aperte sono in
> fondo. Quando il repo è pronto, questo file va in `/docs/modello-dati.md`.
>
> **Convenzione di nome:** **tutto il codice/identificatori in inglese** (tabelle, colonne,
> classi, endpoint, variabili). DB: SQL Server. La prosa di questo documento resta in italiano.

---

## 1. Visione d'insieme (le 3 tabelle e le relazioni)

```
┌─────────────────┐         ┌──────────────────────────┐
│     Berths      │         │          Ships           │
├─────────────────┤         ├──────────────────────────┤
│ Id (PK)         │◄───────┐│ Id (PK)                  │
│ Name            │        ││ Name                     │
│ Size            │        ││ Size                     │
└─────────────────┘        ││ ArrivalDay               │
                           ││ Duration                 │
   1 berth ospita          ││ Status                   │
   N ships (nel tempo)     └┤ BerthId (FK, nullable)   │
                            │ OccupationStartDay        │
                            │ (nullable)               │
                            │ Notes (nullable)         │
                            └──────────────────────────┘

┌──────────────────────────┐
│        Settings          │   tabella di sistema (chiave-valore)
├──────────────────────────┤   contiene il "giorno corrente virtuale"
│ Key (PK)                 │
│ Value                    │
└──────────────────────────┘
```

**Relazione:** una **berth** (banchina) può ospitare **molte ships** (navi) nel corso del
tempo (1 → N). Una **ship** è collegata a **zero o una** berth: `BerthId` è vuoto (`NULL`)
finché la nave è `Pending`, e viene valorizzato quando passa ad `Assigned`.

---

## 2. Tabella `Berths`

Le 8 banchine fisse del porto. Dati statici: si inseriscono una volta sola (seeding) e non
cambiano.

| Colonna | Tipo | Null? | Chiave | Descrizione |
|---|---|---|---|---|
| `Id` | INT (auto-incrementale) | No | **PK** | Identificativo banchina |
| `Name` | VARCHAR(50) | No | | Etichetta leggibile (es. "Berth M-1") |
| `Size` | VARCHAR(2) | No | | Misura della banchina: `XL` / `L` / `M` / `S` |

**Valori ammessi per `Size`:** `XL`, `L`, `M`, `S`
*(consigliato un vincolo CHECK nel DB che accetti solo questi 4 valori)*

**Regola di dominio:** una banchina ospita solo navi della **propria identica** dimensione.

---

## 3. Tabella `Ships`

Il cuore del sistema. Una riga per ogni nave registrata dall'Operatore.

| Colonna | Tipo | Null? | Chiave | Descrizione |
|---|---|---|---|---|
| `Id` | INT (auto-incrementale) | No | **PK** | Identificativo nave |
| `Name` | VARCHAR(100) | No | | Nome nave, inserito dall'Operatore |
| `Size` | VARCHAR(2) | No | | `XL`/`L`/`M`/`S`, **generata a caso** dal sistema |
| `ArrivalDay` | INT | No | | Giorno virtuale di arrivo = giorno corrente + random `1..30` |
| `Duration` | INT | No | | Giorni di occupazione banchina, random `3..15` |
| `Status` | VARCHAR(10) | No | | `Pending` / `Assigned` / `Departed` |
| `BerthId` | INT | **Sì** | **FK** → `Berths.Id` | Banchina assegnata. `NULL` finché `Pending` |
| `OccupationStartDay` | INT | **Sì** | | Giorno in cui inizia l'occupazione. `NULL` finché `Pending` |
| `Notes` | VARCHAR(255) | **Sì** | | Note libere dell'Operatore (opzionale) |

**Valori ammessi per `Size`:** `XL`, `L`, `M`, `S`
**Valori ammessi per `Status`:** `Pending`, `Assigned`, `Departed`
*(consigliati vincoli CHECK su entrambe le colonne)*

**Vincolo di chiave esterna:** `FK_Ships_Berths` collega `Ships.BerthId` → `Berths.Id`.
Impedisce di assegnare una nave a una banchina inesistente.

### Come cambiano i campi durante il ciclo di vita

| Status | `BerthId` | `OccupationStartDay` | Quando |
|---|---|---|---|
| **Pending** | `NULL` | `NULL` | Appena creata dall'Operatore |
| **Assigned** | valorizzato | valorizzato | Quando lo Scheduler la assegna |
| **Departed** | resta valorizzato | resta valorizzato | Quando `OccupationStartDay + Duration <= currentDay` (al Next Day) |

> La nave `Departed` **mantiene** i dati della banchina (storico): non si azzerano, serve solo
> per ricostruire cosa è successo. Lo slot però risulta libero per le date successive.

---

## 4. Tabella `Settings`

Tabella di sistema chiave-valore. Per ora contiene un solo dato: il giorno corrente virtuale.
Usare una tabella (invece di un valore "fisso" nel codice) permette che il tempo sia
**persistente** e condiviso da tutti.

| Colonna | Tipo | Null? | Chiave | Descrizione |
|---|---|---|---|---|
| `Key` | VARCHAR(50) | No | **PK** | Nome dell'impostazione |
| `Value` | VARCHAR(50) | No | | Valore (testo; il giorno si converte a numero nel codice) |

**Riga iniziale (seeding):**

| Key | Value |
|---|---|
| `CurrentVirtualDay` | `1` |

---

## 5. Dati iniziali (seeding) — riepilogo

Da inserire una volta sola alla creazione del DB:

**Berths (8 righe):**

| Name (proposta) | Size |
|---|---|
| Berth XL-1 | `XL` |
| Berth L-1 | `L` |
| Berth M-1 | `M` |
| Berth M-2 | `M` |
| Berth S-1 | `S` |
| Berth S-2 | `S` |
| Berth S-3 | `S` |
| Berth S-4 | `S` |

**Settings (1 riga):** `CurrentVirtualDay = 1`

**Ships:** nessuna (le crea l'Operatore durante l'uso).

---

## 6. Decisioni aperte — da chiudere insieme in Sprint 0

1. **Campo `Notes`**: lo teniamo? La specifica dice che l'Operatore inserisce "nome e *note*",
   quindi è coerente averlo. → *proposta: sì, nullable.*
2. **Tracciare il giorno di creazione della nave?** La roadmap parla di ordinare le navi "per
   giorno di inserimento". Se serve, si aggiunge una colonna `CreationDay INT`. → *proposta:
   per ora ordiniamo per `Id` (cresce nell'ordine di inserimento), si aggiunge solo se serve.*
3. **Nomi delle berths**: vanno bene "Berth XL-1" ecc., oppure preferite solo un numero?
4. **VARCHAR o NVARCHAR**: per supportare accenti/caratteri speciali nei nomi si può usare
   `NVARCHAR`. Per un progetto didattico `VARCHAR` va benissimo. → *proposta: VARCHAR, semplice.*
5. **Vincoli CHECK** su `Size` e `Status`: li mettiamo (più robusto) o li gestiamo solo
   nel codice C#? → *proposta: metterli nel DB, è una rete di sicurezza gratis.*

> Quando queste 5 voci sono decise, questo file diventa "congelato" e Dev SQL può scrivere lo
> script di creazione tabelle (Sprint 1) senza più dubbi.
