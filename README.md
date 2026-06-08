# BlueHarbor Terminal 🚢

Progetto **Learning by Project** — ITS ICT Piemonte, corso *Web Solutions Architect* (2025-2027).

Semplice piattaforma web interna per gestire un piccolo terminal container fittizio:
registrazione navi, pianificazione delle banchine e coordinamento del lavoro tra operatori.
Tutti i dati e le regole sono **fittizi e a scopo didattico**.

---

## Cosa fa l'applicazione

- **Operatore**: registra le navi in arrivo (il sistema genera a caso dimensione, giorno di
  arrivo e durata di occupazione). La nave nasce in stato `Pending`.
- **Scheduler**: assegna le navi alle **8 banchine fisse** (1 XL, 1 L, 2 M, 4 S), rispettando
  la compatibilità di dimensione e calcolando il primo slot temporale libero (accodamento).
- **Tempo virtuale**: niente real-time. Un pulsante **"Next Day"** avanza il giorno; le navi
  che hanno finito l'occupazione passano a `Departed` e liberano la banchina.

Ciclo di vita di una nave: `Pending → Assigned → Departed`.

## Stack tecnologico

| Livello | Tecnologia |
|---|---|
| Database | SQL Server (T-SQL, ADO.NET) |
| Backend | ASP.NET Core Web API (C#) |
| Frontend | React + Vite |

Architettura **3-tier**: React → C# Web API → SQL Server.

## Struttura del repository

```
/backend         → applicazione ASP.NET Core Web API (C#)   [in arrivo]
/frontend        → applicazione React + Vite                [in arrivo]
/database        → script SQL (schema, seeding, query)      [in arrivo]
/docs            → documentazione architetturale            [in arrivo]
/documentazione  → materiale di progetto e pianificazione
```

## 📋 Documentazione di pianificazione

Tutto il materiale per gestire il progetto è in `documentazione/claude/`:

- **[Guida_Gestione_Progetto_Trello.md](documentazione/claude/Guida_Gestione_Progetto_Trello.md)**
  — metodo Scrum, configurazione Trello e roadmap a sprint (per lezioni da 4h)
- **[modello-dati.md](documentazione/claude/modello-dati.md)** — schema del database (contratto
  condiviso tra Dev SQL e Dev C#)
- **[accodamento-algoritmo.md](documentazione/claude/accodamento-algoritmo.md)** — la logica di
  assegnazione delle banchine, validata con esempi numerici
- **[blueharbor_roadmap.md](documentazione/claude/blueharbor_roadmap.md)** — scomposizione
  tecnica in 5 tappe

## 👥 Team e ruoli

| Ruolo | Responsabilità |
|---|---|
| Dev C# | Backend .NET: logica, algoritmi, API |
| Dev SQL | Database: schema, query, transazioni |
| Dev Frontend ×2 | App React |
| Gestione (Luca) | Coordinamento, QA, integrazione, documentazione |

## Stato del progetto

🟡 **Sprint 0 — Setup & pianificazione.** Lo sviluppo del codice inizia nello Sprint 1.
