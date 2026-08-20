# 36-fanta-admin-control-center.md

## Obiettivo

Creare il **Fanta Control Center**, un'interfaccia amministrativa dedicata alla gestione e al debugging del Fanta Leonessa.

Il pannello deve permettere agli amministratori di modificare esclusivamente i dati della Sandbox e di verificare in modo trasparente il comportamento del sistema fantasy.

L'obiettivo principale è poter rispondere con certezza a questa domanda:

> "Se modifico un evento di una partita, il sistema assegna esattamente i punti che dovrebbe assegnare?"

Il pannello deve quindi permettere di seguire l'intero flusso:

```text
Partita Sandbox
↓
Eventi
↓
Scoring Engine
↓
Statistiche giocatore
↓
Fantasy Score
↓
Fantasy Team
↓
Ranking
↓
Market
↓
Social
```

---

# Principi fondamentali

Il Control Center deve essere progettato come uno strumento di debugging, non come una semplice dashboard amministrativa.

Deve privilegiare:

```text
Visibilità
Controllo
Tracciabilità
Riproducibilità
```

Ogni modifica importante deve essere comprensibile e reversibile.

---

# Sicurezza

Route principale:

```text
/admin/fanta
```

Accessibile esclusivamente agli utenti amministratori.

---

# Separazione Sandbox / Produzione

Il pannello deve operare esclusivamente sui dati Sandbox.

Mostrare sempre un indicatore evidente:

```text
🟠 SANDBOX MODE
```

Se la Sandbox non è attiva:

```text
Accesso alle operazioni di modifica disabilitato.
```

Non deve essere possibile modificare accidentalmente:

```text
Dati ESL reali
Partite reali
Fantasy Team reali
Classifiche production
```

---

# Struttura

Il Control Center deve essere organizzato in sezioni:

```text
Overview
↓
Matchdays
↓
Matches
↓
Event Editor
↓
Scoring Inspector
↓
Player Inspector
↓
Fantasy Team Inspector
↓
Market Inspector
↓
Simulation
```

---

# 1. Overview

Route:

```text
/admin/fanta
```

Mostrare una panoramica dello stato del sistema.

## Statistiche

```text
Matchday attuale

Partite Sandbox

Giocatori Sandbox

Fantasy Teams

Fantasy Scores

Fantasy Player Stats

Ultima sincronizzazione

Ultima elaborazione scoring
```

---

# System Health

Mostrare lo stato dei principali sistemi:

```text
🟢 Sandbox
🟢 Scoring Engine
🟢 Fantasy Teams
🟢 Ranking
🟢 Market
🟢 Player Profiles
🟢 Social
```

Se vengono rilevati problemi:

```text
🔴 Scoring Engine
3 anomalie rilevate
```

Cliccando sull'anomalia aprire direttamente il relativo inspector.

---

# 2. Matchday Manager

Route:

```text
/admin/fanta/matchdays
```

Mostrare tutte le giornate Sandbox.

Esempio:

```text
Giornata 1
4 partite
12 Fantasy Teams
Completata

Giornata 2
4 partite
12 Fantasy Teams
In preparazione
```

---

# Azioni

Per ogni giornata:

```text
Visualizza

Simula

Ricalcola

Reset

Chiudi giornata
```

---

# 3. Match Manager

Selezionando una giornata:

```text
/admin/fanta/matchdays/[matchdayId]
```

Mostrare le partite.

Esempio:

```text
CASTELLI 2 - 1 COPERNICO

Stato:
Completata

Eventi:
3

Fantasy Players coinvolti:
7

Fantasy Scores:
12
```

Azioni:

```text
Modifica partita
Modifica eventi
Ricalcola scoring
```

---

# 4. Event Editor

Questa è una delle sezioni principali del sistema.

Route:

```text
/admin/fanta/matches/[matchId]/events
```

Mostrare tutti gli eventi della partita.

Esempio:

```text
23' ⚽ Gol
Andrea Rossi

23' 🎯 Assist
Marco Bianchi

61' 🟨 Ammonizione
Luca Verdi
```

---

# Eventi modificabili

Supportare almeno:

```text
Gol

Assist

Ammonizione

Espulsione

Autogol
```

e tutti gli altri eventi già supportati dallo Scoring Engine.

---

# Creazione Evento

Permettere:

```text
Tipo evento

Giocatore

Minuto

Squadra

Eventuale metadata
```

Esempio:

```text
Tipo:
Gol

Giocatore:
Andrea Rossi

Minuto:
34

[Salva]
```

---

# Modifica Evento

Permettere di modificare:

```text
Tipo

Giocatore

Minuto

Metadata
```

---

# Eliminazione Evento

Prima dell'eliminazione mostrare conferma:

```text
Eliminare questo evento?

Questa operazione modificherà i punteggi fantasy dopo il ricalcolo.
```

---

# 5. Scoring Inspector

Questa è la funzionalità più importante del Control Center.

Route:

```text
/admin/fanta/scoring/[matchId]
```

Il sistema deve mostrare esattamente come vengono calcolati i punti.

---

# Player Scoring Breakdown

Esempio:

```text
Andrea Rossi

EVENTI
────────────────────────

⚽ Gol                  +100
🎯 Assist                +50
🟨 Ammonizione            -20

────────────────────────

Punteggio base           130

Capitano                  ×1.5

────────────────────────

PUNTEGGIO FINALE         195
```

---

# Trasparenza del calcolo

Non mostrare solamente il risultato.

Il sistema deve mostrare:

```text
Evento
Regola applicata
Punti assegnati
Moltiplicatori
Punteggio finale
```

In questo modo è possibile individuare esattamente dove nasce un errore.

---

# Scoring Rules

Mostrare anche le regole utilizzate.

Esempio:

```text
Gol
+100

Assist
+50

Ammonizione
-20

Espulsione
-50
```

Le regole devono provenire dal sistema reale di scoring e non essere duplicate solamente nella UI.

---

# Ricalcolo

Pulsante:

```text
Ricalcola punteggi
```

Prima di eseguire:

```text
Mostrare quali dati verranno modificati.
```

Dopo il ricalcolo mostrare:

```text
Players aggiornati
Fantasy Scores aggiornati
Fantasy Teams aggiornati
Ranking aggiornato
```

---

# 6. Player Inspector

Route:

```text
/admin/fanta/players/[playerId]
```

Mostrare l'intero percorso del giocatore.

```text
Player
↓
Match Events
↓
Fantasy Player Stats
↓
Fantasy Scores
↓
Fantasy Value
↓
Ownership
```

---

# Informazioni

Mostrare:

```text
Nome

Scuola

Ruolo

Fantasy Value

Ownership

Gol

Assist

Presenze

Cartellini

Fantasy Points
```

---

# Storico

Mostrare:

```text
Giornata 1
+120

Giornata 2
+80

Giornata 3
+150
```

---

# Value History

Mostrare:

```text
20 LP
↓
25 LP
↓
32 LP
↓
40 LP
```

Con motivo della variazione quando disponibile.

---

# 7. Fantasy Team Inspector

Route:

```text
/admin/fanta/teams/[teamId]
```

Mostrare:

```text
Nome squadra

Utente

LP disponibili

Punti totali

Posizione

Capitano
```

---

# Rosa

Visualizzare gli 11 giocatori:

```text
POR
DIF
DIF
DIF
DIF
CEN
CEN
CEN
ATT
ATT
ATT
```

Per ogni giocatore mostrare:

```text
Punti giornata

Punti totali

Valore

Capitano
```

---

# Team Score Breakdown

Esempio:

```text
Andrea Rossi       150
Marco Bianchi       80
Luca Verdi          60
...

────────────────────

Base                640

Captain Bonus       +75

────────────────────

Totale              715
```

Questo permette di verificare il collegamento:

```text
Player Score
↓
Fantasy Team Score
```

---

# 8. Ranking Inspector

Mostrare:

```text
Posizione

Fantasy Team

Punti

Differenza dalla posizione precedente
```

Permettere di verificare immediatamente se una modifica allo scoring ha prodotto il corretto aggiornamento della classifica.

---

# 9. Market Inspector

Route:

```text
/admin/fanta/market
```

Mostrare:

```text
Giocatori

Valore attuale

Valore precedente

Variazione

Ownership
```

---

# Market Transaction Inspector

Per un utente:

```text
LP iniziali

Acquisto

Costo

Vendita

Ricavo

Cambio

LP finali
```

Esempio:

```text
100 LP

Acquisto Rossi
-40 LP

Vendita Bianchi
+35 LP

────────────────

95 LP
```

---

# 10. Simulation Center

Route:

```text
/admin/fanta/simulation
```

Permettere di simulare scenari controllati.

---

# Scenario semplice

Esempio:

```text
Gol
+
Assist
+
Ammonizione
```

Pulsante:

```text
Esegui scenario
```

---

# Scenario Capitano

Creare automaticamente:

```text
Giocatore
100 punti base
Capitano
```

e verificare:

```text
150 punti finali
```

---

# Scenario Completo

Permettere di generare:

```text
Gol

Assist

Ammonizione

Espulsione

Clean Sheet

Vittoria

Pareggio

Capitano
```

per verificare tutte le regole contemporaneamente.

---

# 11. Reset Scenario

Ogni scenario deve poter essere resettato.

Pulsante:

```text
Reset Scenario
```

Il reset deve riportare la Sandbox allo stato precedente allo scenario.

---

# 12. Replay

Aggiungere la possibilità di rieseguire uno scenario.

Esempio:

```text
Scenario #42

Gol Rossi
Assist Bianchi
Ammonizione Verdi

[Replay]
```

Questo permette di verificare la riproducibilità dello scoring.

---

# 13. Difference Viewer

Quando viene eseguito un ricalcolo mostrare:

```text
PRIMA
Rossi: 100

DOPO
Rossi: 150

Differenza:
+50
```

Per squadre:

```text
Leonessa Legends

Prima: 650
Dopo: 700

+50
```

Questo è particolarmente utile per individuare regressioni.

---

# 14. Error Detection

Il Control Center deve individuare automaticamente anomalie semplici.

Esempi:

```text
FantasyTeam con != 11 giocatori

Più di un capitano

Giocatore senza FantasyPlayerStat

FantasyScore senza FantasyTeam

Match senza eventi validi

Punteggio negativo inatteso

Ranking incoerente

LP negativi

Duplicati
```

Mostrare:

```text
🔴 3 problemi
```

e permettere di aprire il record problematico.

---

# 15. Audit Trail

Registrare le modifiche effettuate dall'amministratore.

Esempio:

```text
Mario

20/08/2026 14:32

Modificato:
Gol Rossi → Assist Rossi
```

Salvare:

```text
Admin

Azione

Record modificato

Valore precedente

Nuovo valore

Timestamp
```

---

# 16. Operazioni Distruttive

Per:

```text
Reset

Delete

Ricalcolo completo
```

richiedere conferma esplicita.

Per operazioni particolarmente rischiose:

```text
Scrivere il nome dell'operazione
```

prima di procedere.

---

# 17. Performance

Il pannello deve essere utilizzabile anche con dataset Sandbox grandi.

Utilizzare:

```text
Pagination

Filtri

Ricerca

Query mirate

Select Prisma
```

Evitare di caricare:

```text
Tutti i giocatori

Tutte le partite

Tutti gli eventi
```

con una singola query.

---

# 18. UI

Il design deve essere chiaramente differenziato dall'app utente.

Preferire:

```text
Dashboard tecnica

Tabelle compatte

Filtri

Badge di stato

Timeline eventi

Breakdown numerici
```

La priorità non è l'estetica "consumer", ma:

```text
Leggibilità
Velocità
Debug
```

---

# 19. Mobile

Il pannello può essere ottimizzato principalmente per desktop.

Su mobile deve comunque essere:

```text
Consultabile

Navigabile

Non completamente inutilizzabile
```

Non sacrificare la leggibilità delle informazioni tecniche per ottenere un layout mobile perfetto.

---

# 20. Sicurezza

Tutte le operazioni devono essere validate lato server.

Non fidarsi di:

```text
ID forniti dal client

LP inviati dal client

FantasyTeam inviato dal client

Ruolo amministratore dichiarato dal client
```

Verificare sempre:

```text
Sessione

Ruolo admin

Sandbox mode

Ownership record
```

---

# 21. Obiettivo principale: Debug Scoring Engine

Il Control Center deve permettere di rispondere rapidamente a:

```text
"Perché questo giocatore ha ottenuto questi punti?"
```

Il percorso deve essere immediatamente visibile:

```text
Evento
↓
Regola
↓
Punti
↓
Moltiplicatore
↓
Fantasy Score
↓
Fantasy Team Score
↓
Ranking
```

Se qualcosa non torna, l'amministratore deve poter individuare il punto esatto del problema senza consultare manualmente il database.

---

# 22. Criteri di completamento

Il piano è completato quando:

```text
✅ Esiste il Fanta Control Center

✅ Solo gli admin possono accedervi

✅ Opera esclusivamente sulla Sandbox

✅ È possibile modificare eventi partita

✅ È possibile aggiungere eventi

✅ È possibile eliminare eventi

✅ È possibile ricalcolare lo scoring

✅ È possibile vedere il breakdown dei punti

✅ È possibile ispezionare un giocatore

✅ È possibile ispezionare una Fantasy Team

✅ È possibile verificare il ranking

✅ È possibile verificare le transazioni LP

✅ È possibile simulare scenari

✅ È possibile resettare scenari

✅ È possibile confrontare prima/dopo

✅ Le anomalie vengono evidenziate

✅ Le modifiche admin vengono registrate
```

---

# Risultato finale

Il Fanta Control Center deve diventare lo strumento principale per verificare il funzionamento del Fanta Leonessa.

Non deve limitarsi a mostrare i dati.

Deve permettere di:

```text
MODIFICARE
      ↓
SIMULARE
      ↓
RICALCOLARE
      ↓
ISPEZIONARE
      ↓
CONFRONTARE
      ↓
INDIVIDUARE ERRORI
```

in modo completamente controllato all'interno della Sandbox.