# 25-fanta-fixes.md

## Obiettivo

Risolvere tutti i problemi funzionali emersi dal `24-fanta-functional-audit.md`.

Questo piano NON introduce nuove funzionalità e NON modifica le regole di business già definite.

L'obiettivo è portare il Fanta Leonessa a uno stato in cui:

```text
Sandbox
↓
Partite simulate
↓
Scoring Engine
↓
Fantasy Player Stats
↓
Fantasy Scores
↓
Fantasy Teams
↓
Ranking
↓
Market
↓
Player Profiles
↓
Social
```

funzioni realmente end-to-end.

---

# Regole fondamentali

Durante l'implementazione:

```text
✅ Correggere i problemi identificati dall'audit
✅ Mantenere le regole definite nei piani 17-23
✅ Riutilizzare i servizi esistenti quando possibile
✅ Mantenere le operazioni critiche transazionali
✅ Verificare sempre il backend, non solamente la UI
```

Non:

```text
❌ Aggiungere nuove funzionalità
❌ Modificare arbitrariamente le regole del Fanta
❌ Creare workaround solamente lato frontend
❌ Considerare una funzionalità risolta se funziona solo visivamente
```

---

# 1. Market — Acquisto e Vendita

## Problema

`assertFormationValid()` richiede sempre esattamente 11 giocatori.

Questo rende impossibili:

```text
11 + acquisto = 12 ❌

11 - vendita = 10 ❌
```

L'acquisto e la vendita devono invece essere gestiti come una sostituzione.

---

# Soluzione

Implementare un vero flusso di sostituzione.

Esempio:

```text
Rosa attuale:

Rossi
Bianchi
Verdi
...

↓ Sostituisci Rossi

Nuovo giocatore:

Neri

↓

Rossi OUT
Neri IN

11 giocatori
```

---

# Regole

Un'operazione di mercato deve sempre terminare con:

```text
11 giocatori
```

e una formazione valida.

Verificare:

```text
1 portiere
4 difensori
3 centrocampisti
3 attaccanti
```

---

# Acquisto

L'acquisto deve:

```text
1. Verificare mercato aperto
2. Verificare autenticazione
3. Verificare proprietà della FantasyTeam
4. Verificare giocatore disponibile
5. Verificare ruolo
6. Verificare budget
7. Identificare giocatore da sostituire
8. Rimuovere il vecchio giocatore
9. Inserire il nuovo giocatore
10. Aggiornare LP
11. Aggiornare contatore cambi
12. Salvare tutto in una transazione
```

---

# Vendita

La vendita deve:

```text
1. Verificare mercato aperto
2. Verificare autenticazione
3. Verificare proprietà della FantasyTeam
4. Verificare che il giocatore appartenga alla squadra
5. Richiedere il nuovo giocatore
6. Effettuare la sostituzione
7. Accreditare il valore corretto
8. Aggiornare contatore cambi
9. Salvare tutto in una transazione
```

Non permettere di lasciare la squadra con meno di 11 giocatori.

---

# Atomicità

Acquisto/vendita devono essere atomici.

Se una delle operazioni fallisce:

```text
Nessun dato deve essere modificato.
```

---

# 2. Sandbox End-to-End

## Problema

La Sandbox contiene:

```text
Giocatori
Partite
```

ma non contiene:

```text
FantasyTeam
FantasyScore
FantasyPlayerStat
```

Questo impedisce di verificare realmente il sistema.

---

# Soluzione

Estendere il seed Sandbox.

Comando:

```bash
npm run sandbox:seed
```

deve creare almeno:

```text
20 utenti fantasy
20 FantasyTeam
11 giocatori per squadra
FantasyPlayerStat
FantasyScore
```

---

# Distribuzione

Creare squadre con strategie differenti.

Esempio:

```text
Squadra aggressiva
Squadra difensiva
Squadra equilibrata
Squadra casuale
```

Questo permette di verificare ranking e scoring in situazioni diverse.

---

# Seed Idempotente

Eseguendo:

```bash
npm run sandbox:seed
```

più volte non devono essere creati duplicati.

Il seed deve essere:

```text
idempotente
```

---

# 3. Sandbox Matchday

Creare una simulazione completa di giornata.

Esempio:

```text
/api/dev/simulate-matchday
```

La simulazione deve:

```text
1. Selezionare partite Sandbox
2. Generare eventi
3. Aggiornare statistiche giocatori
4. Calcolare FantasyScore
5. Aggiornare FantasyTeam
6. Aggiornare ranking
7. Aggiornare valori giocatori
8. Generare eventi social
```

---

# 4. Scoring Engine Reale

## Problema

La Dashboard utilizza ancora statistiche mock.

Il sistema deve utilizzare i dati prodotti dallo scoring engine.

---

# Soluzione

Il flusso deve diventare:

```text
Match Event
↓
Scoring Engine
↓
FantasyPlayerStat
↓
FantasyScore
↓
FantasyTeam.totalPoints
```

La Dashboard non deve più calcolare:

```text
totalPoints
matchPoints
goals
assists
```

utilizzando formule mock.

Deve utilizzare i dati reali persistiti.

---

# Rimuovere

Eliminare dalla produzione:

```text
Mock points
Mock goals
Mock assists
Mock badge
```

Il badge `Mock` deve scomparire dalla UI quando vengono utilizzati dati reali.

---

# 5. Ranking Globale

## Problema

La Dashboard carica solamente 10 squadre.

Se l'utente non è nella Top 10 viene mostrato:

```text
#11
```

anche se potrebbe essere:

```text
#47
```

---

# Soluzione

Calcolare la posizione globale correttamente.

La query deve essere progettata per:

```text
Top N
+
posizione specifica dell'utente
```

senza caricare inutilmente tutto il ranking.

---

# Esempio

```text
Top 10

...

#47 Tu
```

La Top 10 rimane ottimizzata, ma la posizione dell'utente deve essere reale.

---

# 6. Discovery Widgets

## Problema

Attualmente:

```text
Più scelto
In crescita
MVP
```

vengono assegnati sulla base del `fantasyValue`.

Questo non rappresenta realmente le tre categorie.

---

# Soluzione

## Più scelto

Ordinare per:

```text
ownershipCount DESC
```

oppure calcolare il numero reale di FantasyTeam che possiedono il giocatore.

---

## In crescita

Calcolare:

```text
valore precedente
vs
valore attuale
```

e ordinare per crescita percentuale o assoluta.

Utilizzare lo storico:

```text
FantasyPlayerValueHistory
```

---

## MVP

Utilizzare il punteggio reale dell'ultima giornata.

```text
FantasyScore
```

Il giocatore con il miglior punteggio della giornata diventa MVP.

---

# 7. Social Events

## Problema

Il social funziona solamente quando un'attività viene registrata manualmente.

Non vengono generati automaticamente eventi importanti.

---

# Soluzione

Creare eventi automatici per:

```text
Acquisto giocatore

Vendita giocatore

Cambio capitano

Sorpasso in classifica

Record personale

MVP giornata

Giocatore più acquistato
```

---

# Eventi

Esempio:

```text
USER_TRANSFERRED_PLAYER
USER_CHANGED_CAPTAIN
USER_OVERTAKEN
MATCHDAY_MVP
PLAYER_MOST_SELECTED
PERSONAL_RECORD
```

---

# 8. Achievement

Collegare automaticamente gli achievement previsti.

Attualmente:

```text
FOUNDER
```

è collegato alla creazione squadra.

Verificare e predisporre gli altri achievement già definiti.

Non creare nuovi achievement.

---

# 9. Leaderboard "Più Acquistati"

## Problema

Attualmente il sistema:

```text
ordina per fantasyValue
↓
limita
↓
conta possessori
```

Questo produce risultati errati.

---

# Soluzione

Calcolare prima la popolarità su tutti i giocatori:

```text
FantasyTeamPlayer
↓
GROUP BY playerId
↓
COUNT
↓
ORDER BY COUNT DESC
```

Solo successivamente applicare:

```text
LIMIT
```

---

# 10. Player Profile

Dopo la correzione dello scoring verificare che il profilo riceva dati reali.

Testare:

```text
Gol
Assist
Presenze
Cartellini
Fantasy Points
Valore
Ownership
Storico
```

Simulare una giornata e verificare che il profilo cambi realmente.

---

# 11. Player Dashboard

Per i giocatori associati a un account:

```text
User
↓
Player
```

verificare che la dashboard mostri dati aggiornati dopo una simulazione.

Testare:

```text
Statistiche
Punti
Valore
Ownership
Ranking
```

---

# 12. Prossime Partite

## Problema

La Dashboard non applica esplicitamente il filtro:

```text
Leonessa Cup
```

---

# Soluzione

Applicare il filtro della competizione in modo esplicito.

Le partite mostrate devono appartenere esclusivamente alla:

```text
Leonessa Cup
```

---

# 13. LP Integrity

Verificare tutte le operazioni che modificano LP:

```text
Creazione squadra
Acquisto
Vendita
Cambio extra
Reward
```

Per ogni operazione verificare:

```text
Saldo precedente
Operazione
Saldo successivo
```

---

# Regola

Mai modificare solamente il valore mostrato dal client.

Il saldo deve essere verificato e aggiornato lato server.

---

# 14. Idempotenza

Testare nuovamente tutte le operazioni critiche.

In particolare:

```text
ESL sync
Matchday
Scoring
Acquisto
Vendita
Reward
Achievement
```

Eseguire la stessa operazione due volte.

Il risultato deve essere equivalente a una sola esecuzione.

---

# 15. Security

Verificare nuovamente:

```text
User A
↓
non può modificare
↓
FantasyTeam di User B
```

Testare:

```text
API
Server Actions
Route interne
Dev endpoints
```

---

# 16. Regression Test

Dopo aver applicato tutti i fix eseguire:

```bash
npm run typecheck
npm run lint
npm run build
```

Poi eseguire il flusso Sandbox completo.

---

# Test End-to-End Finale

Scenario:

```text
1. Seed Sandbox
        ↓
2. Creazione FantasyTeam
        ↓
3. Selezione capitano
        ↓
4. Simulazione giornata
        ↓
5. Calcolo punti
        ↓
6. Aggiornamento classifica
        ↓
7. Aggiornamento valori
        ↓
8. Apertura mercato
        ↓
9. Sostituzione giocatore
        ↓
10. Aggiornamento LP
        ↓
11. Aggiornamento Player Profile
        ↓
12. Generazione Social Activity
```

Tutto deve funzionare senza interventi manuali sul database.

---

# Report finale

Al termine creare:

```text
fanta-fixes-report.md
```

contenente:

```text
Fix applicati

Test eseguiti

Problemi rimasti

Eventuali limitazioni
```

---

# Criterio di completamento

Il piano è completato solamente quando:

```text
✅ Acquisto funzionante

✅ Vendita funzionante

✅ Swap funzionante

✅ Sandbox popolata end-to-end

✅ Scoring Engine collegato alla Dashboard

✅ Ranking globale corretto

✅ Discovery widgets reali

✅ Social events automatici

✅ Leaderboard corretta

✅ Player Profile aggiornati

✅ LP consistenti

✅ Operazioni idempotenti

✅ Sicurezza verificata

✅ Build production funzionante
```

Il Fanta deve poter essere eseguito interamente in Sandbox senza dipendere dalla modifica manuale dei dati ESL.
````

**Ordine di implementazione:** partirei assolutamente da **Market + Sandbox end-to-end**, poi scoring/dashboard. Finché non hai una Sandbox con `FantasyTeam → FantasyScore → FantasyPlayerStat`, non puoi verificare davvero quasi nessuna delle feature successive.