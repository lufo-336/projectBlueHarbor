# BlueHarbor — Algoritmo di accodamento delle banchine (validato a tavolino)

> Il pezzo logico più delicato del progetto (Sprint 3). Qui lo fissiamo con **esempi
> numerici** e lo confrontiamo con i test ufficiali della roadmap, **prima** di scrivere
> codice. Chi sviluppa il C# parte da qui. Identificatori in inglese, prosa in italiano.

---

## 1. Le due formule da non sbagliare mai

Tutto l'algoritmo ruota attorno a due definizioni. Il 90% dei bug nasce dallo sbagliare un
"±1 giorno" qui.

### A) Quanti giorni occupa una nave

Una nave con **inizio = S** (`OccupationStartDay`) e **durata = D** (`Duration`) occupa i giorni:

```
da S   fino a   S + D − 1     (cioè D giorni consecutivi)
```

e la banchina **torna libera dal giorno `S + D`**.

> 🔗 È coerente con la regola ufficiale del Next Day: una nave diventa `Departed` quando
> `OccupationStartDay + Duration <= currentDay`. Cioè è "ancora lì" fino a `S+D−1`
> e "andata via" da `S+D`. Le due cose **devono** combaciare.

### B) Quando due periodi si sovrappongono

Due intervalli `[a1, b1]` e `[a2, b2]` si sovrappongono **se e solo se**:

```
a1 <= b2   E   a2 <= b1
```

(se anche solo una delle due è falsa, NON si toccano)

---

## 2. La regola, in una frase

> La nave parte dal **primo giorno utile ≥ il suo `ArrivalDay`** in cui la banchina è
> **libera per tutta la sua `Duration`**.

### La ricetta passo-passo (per il dev C#)

Per assegnare una nave (`ArrivalDay = A`, `Duration = D`) a una berth:

1. Prendi tutte le ships **già `Assigned`** su quella berth e i loro intervalli
   `[Sᵢ, Sᵢ+Dᵢ−1]`. *(Le ships `Departed` non contano: occupavano giorni ormai passati. Le
   `Pending` non sono su nessuna berth.)*
2. Ordina questi intervalli per giorno di inizio.
3. Parti con un candidato **`S = A`** (non si può iniziare prima dell'arrivo).
4. Scorri gli intervalli in ordine: se la finestra `[S, S+D−1]` si sovrappone all'intervallo
   `[Sᵢ, Eᵢ]` (usa la formula B), **spingi il candidato subito dopo**: `S = Eᵢ + 1`.
5. Quando hai controllato tutti gli intervalli senza più sovrapposizioni, **`S` è il giorno
   di inizio**. Salvi `OccupationStartDay = S` e `Status` → `Assigned`.

> Nota sulla compatibilità: la berth deve essere della **stessa `Size`** della nave.
> Questo controllo viene **prima** dell'accodamento (se incompatibile, non si assegna affatto).

---

## 3. Esempio 1 — Accodamento (il test ufficiale della roadmap)

Berth **M-1** (`Size` = M). Due ships M assegnate in sequenza.

**Ship A** — `ArrivalDay` 2, `Duration` 5. Berth vuota.
- Candidato `S = 2`. Nessun intervallo esistente → nessuna sovrapposizione.
- **`OccupationStartDay` = 2.** Occupa i giorni `2–6` (5 giorni). Libera dal **7**.

**Ship B** — `ArrivalDay` 3, `Duration` 4. Stessa berth M-1.
- Candidato `S = 3`. Intervallo esistente di A = `[2, 6]`.
- Si sovrappone? `3 <= 6` E `2 <= 3+4−1=6` → **sì**. Spingo: `S = 6 + 1 = 7`.
- Non ci sono altri intervalli → **`OccupationStartDay` = 7.** Occupa i giorni `7–10`. Libera dall'**11**.

```
Giorno:   1   2   3   4   5   6   7   8   9  10  11
Ship A:       [===============]
              (2 ─────────── 6)
Ship B:                           [===========]
                                  (7 ──────── 10)
```

✅ **Corrisponde al test della roadmap**: "Ship A (durata 5, arriva g2) … Ship B (arriva g3)
… verificare che venga assegnata **a partire dal giorno 7**." La `Duration` di B non cambia il
risultato: conta solo che il suo arrivo (3) cade dentro l'occupazione di A, quindi slitta a 7.

---

## 4. Esempio 2 — Ciclo di vita + Next Day (l'altro test ufficiale)

**Ship** — `ArrivalDay` 2, `Duration` 3, assegnata con `OccupationStartDay` 2.
- Occupa i giorni `2–4` (cioè 2, 3, 4). Libera dal **5** (`2 + 3 = 5`).

Avanziamo il tempo con "Next Day" e guardiamo lo `Status` giorno per giorno:

| currentDay | `OccupationStartDay + Duration = 5` ≤ currentDay? | Status | Berth |
|:---:|:---:|:---:|:---:|
| 2 | 5 ≤ 2 → no | **Assigned** | occupata |
| 3 | 5 ≤ 3 → no | **Assigned** | occupata |
| 4 | 5 ≤ 4 → no | **Assigned** | occupata |
| 5 | 5 ≤ 5 → **sì** | **Departed** | **libera** |

✅ **Corrisponde al test della roadmap**: "nei giorni 2, 3 e 4 risulti `Assigned` … passi a
`Departed` esattamente all'inizio del giorno 5." E dal giorno 5 la berth è di nuovo
assegnabile.

---

## 5. Esempio 3 — Il "buco" (gap): una decisione da prendere ⚠️

Questo caso non è nei test ufficiali ma **succederà di sicuro**, perché lo Scheduler assegna
le navi nell'ordine che vuole (non per forza in ordine di arrivo). Serve una decisione.

Berth **S-1**. Già assegnate:
- **Ship X** — `OccupationStartDay` 1, `Duration` 3 → occupa `1–3`, libera dal `4`.
- **Ship Y** — `OccupationStartDay` 8, `Duration` 3 → occupa `8–10`, libera dal `11`.

Si crea un **buco libero nei giorni 4-5-6-7**. Ora arriva da assegnare:
- **Ship Z** — `ArrivalDay` 2, `Duration` 2.

```
Giorno:   1   2   3   4   5   6   7   8   9  10  11
Ship X:   [=======]
Ship Y:                           [===========]
BUCO:                 ↑   ↑   ↑   ↑
Ship Z?               ?   ?   ?   ?
```

Due comportamenti possibili:

| Strategia | Dove finisce Z | Pro / Contro |
|---|---|---|
| **A) Primo slot disponibile** (riempie il buco) | inizio **4**, occupa `4–5` | ✅ fedele a "primo slot disponibile" della specifica · richiede di scorrere i buchi |
| **B) Sempre in coda** (dopo l'ultima nave) | inizio **11**, occupa `11–12` | ➕ più semplice da codare · ➖ lascia il buco vuoto, meno fedele alla specifica |

La **ricetta del §2 implementa la strategia A** (con `S=2` → sovrappone X `[1,3]` → `S=4`;
`[4,5]` non tocca Y `[8,10]` → inizio 4).

> 📌 **Decisione per il team:** la specifica PDF dice "il giorno di inizio deve essere il
> **primo giorno libero** della banchina" e "primo slot temporale disponibile" → questo
> spinge verso la **strategia A**. La proposta è **A**. Se in classe/col docente preferite la
> semplicità, la **B** è accettabile ma va dichiarata come assunzione nel documento
> architetturale. *(La ricetta del §2 fa già A.)*

---

## 6. Casi limite da tenere a mente

1. **Berth vuota** → l'inizio è semplicemente l'`ArrivalDay` della nave (Esempio 1,
   Ship A). Non è il giorno corrente: è l'arrivo.
2. **Ship mai assegnata il cui arrivo è già passato** (sono stati premuti tanti "Next Day"
   mentre era `Pending`): l'inizio non dovrebbe essere nel passato. Guardia consigliata:
   `S = max(A, currentDay)` come punto di partenza, poi applica la ricetta. *(Da
   confermare: la specifica non lo cita esplicitamente.)*
3. **Buco troppo piccolo** per la durata: la ricetta lo salta da sola e va al buco/coda
   successiva (la formula di sovrapposizione spinge `S` oltre ogni intervallo che non ci sta).
4. **Niente assegnazione automatica**: questo algoritmo gira **solo** quando lo Scheduler
   clicca "assegna". Il Next Day NON assegna nulla (è fuori scope).

---

## 7. Pseudocodice di riferimento (non è codice C#, è la logica)

```
funzione computeStartDay(arrivalDay A, duration D, assignedShipsOnBerth):
    intervalli = [ [Sᵢ, Sᵢ + Dᵢ − 1]  per ogni ship assegnata ]
    ordina intervalli per inizio crescente

    S = A                         # (oppure max(A, currentDay), vedi caso limite 2)
    per ogni [startᵢ, endᵢ] in intervalli:
        se ( S <= endᵢ  E  startᵢ <= S + D − 1 ):   # si sovrappongono?
            S = endᵢ + 1                             # spingi subito dopo
    ritorna S
```

> Quando questo file è approvato, il dev C# lo traduce 1:1 in un metodo del servizio di
> schedulazione (Sprint 3). Il QA (Luca) usa gli Esempi 1 e 2 come test di accettazione.
