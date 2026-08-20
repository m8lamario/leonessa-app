Audit funzionale del Fanta completato senza modificare il codice.

## Verifiche superate
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Route principali presenti: `/fanta`, `/fanta/team`, `/fanta/market`, `/fanta/social`, `/player/[playerId]`.
- Bottom navigation contiene Fanta.
- Team Builder valida nome, ruoli, budget, 11 giocatori e capitano; salvataggio transazionale e reward +50 LP presenti.
- Profilo giocatore, storico valori, ownership e statistiche sono implementati.
- Sandbox seed esistente e già verificato idempotente in precedenza.

## Problemi funzionali rilevati

### Critici
1. **Mercato: acquisto e vendita di fatto bloccati**
   `assertFormationValid()` verifica sempre esattamente 11 giocatori. Durante un acquisto conta 11 + nuovo giocatore, durante una vendita 11 - giocatore: entrambe le operazioni falliscono prima del salvataggio. Serve un vero flusso sostituzione oppure validazione della rosa dopo swap.

2. **Dashboard: statistiche giocatori ancora mock**
   `fanta-service.ts` usa formule deterministiche basate su indice/costo per `totalPoints`, `matchPoints`, goals e assists. La UI mostra anche il badge “Mock”. Quindi non visualizza i dati dello scoring engine.

3. **Dashboard: posizione globale inaccurata fuori dalla Top 10**
   Vengono caricati solo 10 team e, se l’utente non è tra questi, la posizione viene impostata a `rankingTeams.length + 1` (= 11), non alla reale posizione globale.

### Medi
4. **Widget discovery non corrispondenti al piano**
   “Più scelto”, “In crescita” e “MVP attuale” sono assegnati ai primi tre giocatori ordinati per `fantasyValue`, senza calcolare popolarità, trend o MVP.

5. **Social parzialmente dinamico**
   Il feed contiene solo attività esplicitamente registrate; acquisti, vendite, cambio capitano, sorpassi in classifica e record non generano automaticamente eventi. Degli achievement previsti, solo `FOUNDER` è collegato automaticamente alla creazione squadra.

6. **Leaderboard social “più acquistati” non corretta**
   Il servizio limita prima i giocatori ordinandoli per `fantasyValue`, poi conta i possessori. Non calcola i più posseduti sull’intero insieme giocatori.

7. **Sandbox attualmente non popolata downstream**
   Nel DB controllato risultano giocatori sandbox e partite sandbox, ma nessuna squadra fantasy sandbox, nessun `FantasyScore` e nessuna `FantasyPlayerStat`; quindi scoring, mercato e social non sono verificabili end-to-end con i dati attuali.

### Minori / scope esplicito
8. Analytics, push notification reali, generazione share-card immagine, badge storici (Veterano/Campione/MVP) e ranking amici non risultano implementati; alcuni erano indicati come futuri o predisposizione.

9. La dashboard mostra prossime partite senza filtro esplicito `Leonessa Cup`, quindi potrebbe includere match di altre competizioni.

L’audit è terminato con tutti i task di verifica completati. Nessun file del progetto è stato modificato durante l’audit.