Questo file spiega in che modo Visual Studio ha creato il progetto.

Per generare questo progetto sono stati usati gli strumenti seguenti:
- create-vite

Per generare questo progetto sono stati eseguiti i passaggi seguenti:
- Creare un progetto react con create-vite: `npm init --yes vite@latest blueharbor_qpd_wsa.client -- --template=react-ts  --no-rolldown --no-immediate`.
- Aggiornare `vite.config.ts` per configurare il proxy e i certificati.
- Aggiungere `@type/node` per la digitazione di `vite.config.js`.
- Aggiornare il componente `App` per recuperare e visualizzare le informazioni meteo.
- Creare il file di progetto (`blueharbor_qpd_wsa.client.esproj`).
- Creare `launch.json` per abilitare il debug.
- Aggiungi progetto alla soluzione.
- Aggiornare l'endpoint proxy come endpoint del server back-end.
- Aggiungere il progetto all'elenco dei progetti di avvio.
- Scrivere questo file.
