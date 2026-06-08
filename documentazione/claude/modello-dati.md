# BlueHarbor Terminal — Modello dati (bozza da ratificare in Sprint 0)

> Questo è il **contratto** condiviso tra Dev SQL e Dev C#: descrive tabelle, colonne, tipi,
> chiavi e relazioni. È **documentazione**, non lo script SQL (quello lo scrive Dev SQL nello
> Sprint 1, basandosi su questo file).
>
> ⚠️ È una **bozza**: va letta insieme in Sprint 0 e approvata. Le decisioni aperte sono in
> fondo. Quando il repo è pronto, questo file va in `/docs/modello-dati.md`.
>
> **Convenzioni** (decise l'8 giugno): nomi di dominio in **italiano** (`Navi`, `Banchine`,
> `Impostazioni`), valori di stato in **inglese** (`Pending/Assigned/Departed`). DB: SQL Server.

---

## 1. Visione d'insieme (le 3 tabelle e le relazioni)

```
┌─────────────────┐         ┌──────────────────────────┐
│    Banchine     │         │           Navi           │
├─────────────────┤         ├──────────────────────────┤
│ Id (PK)         │◄───────┐│ Id (PK)                  │
│ Nome            │        ││ Nome                     │
│ Dimensione      │        ││ Dimensione               │
└─────────────────┘        ││ GiornoArrivo             │
                           ││ DurataOccupazione        │
   1 Banchina ospita       ││ Stato                    │
   N Navi (nel tempo)      └┤ BanchinaId (FK, nullable)│
                            │ GiornoInizioOccupazione  │
                            │ (nullable)               │
                            │ Note (nullable)          │
                            └──────────────────────────┘

┌──────────────────────────┐
│      Impostazioni        │   tabella di sistema (chiave-valore)
├──────────────────────────┤   contiene il "giorno corrente virtuale"
│ Chiave (PK)              │
│ Valore                   │
└──────────────────────────┘
```

**Relazione:** una **Banchina** può ospitare **molte Navi** nel corso del tempo (1 → N).
Una **Nave** è collegata a **zero o una** Banchina: `BanchinaId` è vuoto (`NULL`) finché la
nave è `Pending`, e viene valorizzato quando passa ad `Assigned`.

---

## 2. Tabella `Banchine`

Le 8 banchine fisse del porto. Dati statici: si inseriscono una volta sola (seeding) e non
cambiano.

| Colonna | Tipo | Null? | Chiave | Descrizione |
|---|---|---|---|---|
| `Id` | INT (auto-incrementale) | No | **PK** | Identificativo banchina |
| `Nome` | VARCHAR(50) | No | | Etichetta leggibile (es. "Banchina M-1") |
| `Dimensione` | VARCHAR(2) | No | | Misura della banchina: `XL` / `L` / `M` / `S` |

**Valori ammessi per `Dimensione`:** `XL`, `L`, `M`, `S`
*(consigliato un vincolo CHECK nel DB che accetti solo questi 4 valori)*

**Regola di dominio:** una banchina ospita solo navi della **propria identica** dimensione.

---

## 3. Tabella `Navi`

Il cuore del sistema. Una riga per ogni nave registrata dall'Operatore.

| Colonna | Tipo | Null? | Chiave | Descrizione |
|---|---|---|---|---|
| `Id` | INT (auto-incrementale) | No | **PK** | Identificativo nave |
| `Nome` | VARCHAR(100) | No | | Nome nave, inserito dall'Operatore |
| `Dimensione` | VARCHAR(2) | No | | `XL`/`L`/`M`/`S`, **generata a caso** dal sistema |
| `GiornoArrivo` | INT | No | | Giorno virtuale di arrivo = giorno corrente + random `1..30` |
| `DurataOccupazione` | INT | No | | Giorni di occupazione banchina, random `3..15` |
| `Stato` | VARCHAR(10) | No | | `Pending` / `Assigned` / `Departed` |
| `BanchinaId` | INT | **Sì** | **FK** → `Banchine.Id` | Banchina assegnata. `NULL` finché `Pending` |
| `GiornoInizioOccupazione` | INT | **Sì** | | Giorno in cui inizia l'occupazione. `NULL` finché `Pending` |
| `Note` | VARCHAR(255) | **Sì** | | Note libere dell'Operatore (opzionale) |

**Valori ammessi per `Dimensione`:** `XL`, `L`, `M`, `S`
**Valori ammessi per `Stato`:** `Pending`, `Assigned`, `Departed`
*(consigliati vincoli CHECK su entrambe le colonne)*

**Vincolo di chiave esterna:** `FK_Navi_Banchine` collega `Navi.BanchinaId` → `Banchine.Id`.
Impedisce di assegnare una nave a una banchina inesistente.

### Come cambiano i campi durante il ciclo di vita

| Stato | `BanchinaId` | `GiornoInizioOccupazione` | Quando |
|---|---|---|---|
| **Pending** | `NULL` | `NULL` | Appena creata dall'Operatore |
| **Assigned** | valorizzato | valorizzato | Quando lo Scheduler la assegna |
| **Departed** | resta valorizzato | resta valorizzato | Quando `GiornoInizio + Durata <= giornoCorrente` (al Next Day) |

> La nave `Departed` **mantiene** i dati della banchina (storico): non si azzerano, serve solo
> per ricostruire cosa è successo. Lo slot però risulta libero per le date successive.

---

## 4. Tabella `Impostazioni`

Tabella di sistema chiave-valore. Per ora contiene un solo dato: il giorno corrente virtuale.
Usare una tabella (invece di un valore "fisso" nel codice) permette che il tempo sia
**persistente** e condiviso da tutti.

| Colonna | Tipo | Null? | Chiave | Descrizione |
|---|---|---|---|---|
| `Chiave` | VARCHAR(50) | No | **PK** | Nome dell'impostazione |
| `Valore` | VARCHAR(50) | No | | Valore (testo; il giorno si converte a numero nel codice) |

**Riga iniziale (seeding):**

| Chiave | Valore |
|---|---|
| `GiornoCorrenteVirtuale` | `1` |

---

## 5. Dati iniziali (seeding) — riepilogo

Da inserire una volta sola alla creazione del DB:

**Banchine (8 righe):**

| Nome (proposta) | Dimensione |
|---|---|
| Banchina XL-1 | `XL` |
| Banchina L-1 | `L` |
| Banchina M-1 | `M` |
| Banchina M-2 | `M` |
| Banchina S-1 | `S` |
| Banchina S-2 | `S` |
| Banchina S-3 | `S` |
| Banchina S-4 | `S` |

**Impostazioni (1 riga):** `GiornoCorrenteVirtuale = 1`

**Navi:** nessuna (le crea l'Operatore durante l'uso).

---

## 6. Decisioni aperte — da chiudere insieme in Sprint 0

1. **Campo `Note`**: lo teniamo? La specifica dice che l'Operatore inserisce "nome e *note*",
   quindi è coerente averlo. → *proposta: sì, nullable.*
2. **Tracciare il giorno di creazione della nave?** La roadmap parla di ordinare le navi "per
   giorno di inserimento". Se serve, si aggiunge una colonna `GiornoCreazione INT`. → *proposta:
   per ora ordiniamo per `Id` (cresce nell'ordine di inserimento), si aggiunge solo se serve.*
3. **Nomi delle banchine**: vanno bene "Banchina XL-1" ecc., oppure preferite solo un numero?
4. **VARCHAR o NVARCHAR**: per supportare accenti/caratteri speciali nei nomi si può usare
   `NVARCHAR`. Per un progetto didattico `VARCHAR` va benissimo. → *proposta: VARCHAR, semplice.*
5. **Vincoli CHECK** su `Dimensione` e `Stato`: li mettiamo (più robusto) o li gestiamo solo
   nel codice C#? → *proposta: metterli nel DB, è una rete di sicurezza gratis.*

> Quando queste 5 voci sono decise, questo file diventa "congelato" e Dev SQL può scrivere lo
> script di creazione tabelle (Sprint 1) senza più dubbi.
