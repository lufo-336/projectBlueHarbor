# BlueHarbor Terminal

BlueHarbor Terminal e' un'applicazione web interna sviluppata come progetto "Learning by
Project" del corso Web Solutions Architect (ITS ICT Piemonte, biennio 2025-2027).

## Il progetto

BlueHarbor e' una compagnia di spedizioni fittizia che gestisce un piccolo terminal container.
Oggi le operazioni del terminal sono coordinate a mano, con poca visibilita' e diverse
inefficienze. L'applicazione serve a digitalizzare tre attivita' di base: registrare le navi
in arrivo, pianificare l'uso delle banchine e coordinare il lavoro tra gli operatori.

Tutti i dati, i nomi e le regole sono fittizi e creati a scopo didattico.

## Come funziona

L'applicazione prevede due ruoli:

- Operatore: registra le navi in arrivo. Per ogni nuova nave il sistema genera automaticamente
  la dimensione, il giorno di arrivo e la durata di occupazione della banchina.
- Scheduler: assegna le navi alle banchine disponibili, rispettando la compatibilita' di
  dimensione e calcolando il primo periodo libero della banchina.

Il tempo non e' reale. L'applicazione tiene un "giorno corrente virtuale" che avanza con un
pulsante "Next Day". Quando una nave completa la sua occupazione viene segnata come partita e
libera la banchina.

Il porto ha otto banchine fisse: una XL, una L, due M e quattro S. Ogni banchina puo' ospitare
solo navi della propria dimensione.

Una nave attraversa tre stati: in attesa di assegnazione (Pending), assegnata a una banchina
(Assigned), occupazione conclusa (Departed).

## Tecnologie

- Database: SQL Server
- Backend: ASP.NET Core Web API (C#)
- Frontend: React con Vite

L'architettura e' a tre livelli: l'interfaccia React comunica con le API in C#, che a loro
volta leggono e scrivono sul database SQL Server.

## Struttura del repository

```
/BlueHarbor_QPD_WSA.Server      backend ASP.NET Core Web API (C#)
/blueharbor_qpd_wsa.client      client Vite (scaffold Visual Studio)
/frontend                       applicazione React + Vite
/database                       script SQL (schema, seeding, query)
BlueHarbor_QPD_WSA.slnx         solution Visual Studio
```

## Documentazione

Il materiale di pianificazione e' mantenuto in locale (non versionato) nella cartella
`documentazione/claude/`:

- `Guida_Gestione_Progetto_Trello.md` - metodo di lavoro, Trello e roadmap a sprint
- `modello-dati.md` - schema del database
- `accodamento-algoritmo.md` - la logica di assegnazione delle banchine, con esempi
- `blueharbor_roadmap.md` - scomposizione tecnica in tappe

## Team

Il progetto e' realizzato da un gruppo di cinque persone, con ruoli dedicati a database,
backend C#, frontend e coordinamento.

## Stato del progetto

Sprint 0 - Setup e pianificazione. Lo sviluppo del codice inizia nello Sprint 1.
