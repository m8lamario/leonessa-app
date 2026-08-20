# 38-fanta-scoring-unification.md

## Obiettivo

Unificare il calcolo dei punti del Fanta Leonessa in una singola fonte di verità condivisa tra:

- Production
- Sandbox
- Fanta Control Center
- Sandbox Panel
- Value Engine

Attualmente esistono più percorsi di scoring che utilizzano logiche parzialmente duplicate.

In particolare:

```text
Production
→ scoring-sync.ts
→ regole reali

Control Center
→ sandbox-recalc-service.ts
→ regole quasi identiche

Sandbox Panel
→ sandbox-service.ts
→ formula semplificata events × 25
```

Questa situazione rende possibile ottenere risultati differenti a parità di partita ed eventi.

Il risultato finale deve essere:

```text
                 SCORING ENGINE
                       │
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
   Production       Sandbox      Control Center
        │              │              │
      ESL          Simulation       Recalc
```

Le strategie di persistenza possono invece rimanere differenti.

---

# Problema attuale

## Production

Production utilizza:

```text
ESL
↓
Match
↓
MatchEvent
↓
processMatch()
↓
FantasyScore
↓
FantasyPlayerStat
↓
FantasyTeam.totalPoints
```

Il sistema è incrementale e protetto da:

```text
FantasyProcessedMatch
```

Un match già processato non viene normalmente ricalcolato.

---

## Control Center

Il Control Center deve poter modificare gli eventi della Sandbox e ricalcolare il risultato.

Utilizza attualmente una propria implementazione delle regole.

Questo è necessario per il debugging, ma le regole non devono essere duplicate.

---

## Sandbox Panel

Attualmente:

```text
runScoringOnLatest()
```

utilizza una logica semplificata:

```text
eventi × 25
```

Questa logica non rappresenta realmente il sistema di scoring.

Non considera correttamente:

- gol
- assist
- ammonizioni
- espulsioni
- autogol
- vittoria
- pareggio
- clean sheet
- capitano

Questa implementazione deve essere eliminata.

---

# Principio architetturale

Separare:

```text
CALCOLO
```

da:

```text
PERSISTENZA
```

Il calcolo deve essere unico.

La persistenza può essere diversa.

### Scoring

Unica fonte di verità:

```text
Match
+
MatchEvent
+
Player
+
Fantasy selection
↓
Scoring Engine
↓
Player Match Score
```

### Production

```text
Player Match Score
↓
persistenza incrementale
```

### Sandbox

```text
Player Match Score
↓
rebuild / recalc
```

### Control Center

```text
Player Match Score
↓
preview / diff / persistenza Sandbox
```

---

# Single Source of Truth

Creare una singola fonte di verità per:

```text
SCORING
```

Le regole devono essere definite una sola volta.

Attualmente esistono:

```text
SCORING
SCORING_RULES
```

con valori duplicati.

Devono essere unificate.

---

# Regole di scoring

Non modificare le regole già definite.

Utilizzare esclusivamente quelle attualmente presenti nel progetto.

Le regole devono continuare a prevedere:

```text
GOAL
+100

ASSIST
+50

YELLOW
-20

RED
-50

OWN_GOAL
-70

WIN
+20

DRAW
+5

CLEAN_SHEET
+30

CAPTAIN
×1.5
```

Il valore MVP attualmente è:

```text
0
```

e non deve essere inventata una nuova regola senza una modifica esplicita al regolamento.

---

# Scoring Engine

Creare funzioni pure e riutilizzabili.

Concettualmente:

```ts
getEventPoints(event)

getMatchResultPoints(player, match)

getCleanSheetPoints(player, match)

getPlayerBasePoints(player, match)

applyCaptainMultiplier(points)

getPlayerMatchScore(player, match, selection)
```

Le funzioni devono:

- non dipendere dalla UI;
- non dipendere da API;
- non modificare direttamente il database;
- essere facilmente testabili;
- essere utilizzabili da Production e Sandbox.

---

# Event scoring

Il calcolo degli eventi deve utilizzare il tipo reale dell'evento.

Esempio:

```text
GOAL
→ +100

ASSIST
→ +50

YELLOW
→ -20

RED
→ -50

OWN_GOAL
→ -70
```

Non deve più esistere una logica generica del tipo:

```text
count(events) × 25
```

---

# Match result

Il risultato della partita deve continuare a influenzare i giocatori secondo le regole esistenti:

```text
WIN
+20

DRAW
+5

LOSS
0
```

La logica deve essere condivisa.

---

# Clean Sheet

Uniformare la fonte del ruolo utilizzato per determinare il bonus.

Attualmente esiste una differenza tra:

```text
TeamMember.fantasyRole
```

e:

```text
FantasyTeamPlayer.role
```

Prima dell'implementazione verificare quale rappresenti correttamente il ruolo con cui il giocatore viene schierato nel Fanta.

Il sistema finale deve utilizzare una sola fonte coerente.

Regola:

```text
POR / DIF
+
opponentScore === 0
↓
+30
```

---

# Capitano

Il moltiplicatore deve essere applicato nello stesso modo in tutti i percorsi:

```text
base points
× 1.5
```

Il risultato deve essere arrotondato secondo il comportamento attualmente utilizzato.

Evitare di duplicare:

```text
1.5
```

in più punti del codice.

Definire una costante condivisa:

```ts
CAPTAIN_MULTIPLIER
```

---

# FantasyPlayerStat

`FantasyPlayerStat` deve rappresentare le statistiche reali ottenute dai giocatori.

Devono essere aggiornati correttamente:

```text
matches
goals
assists
yellowCards
redCards
ownGoals
totalPoints
```

Le statistiche devono derivare dagli eventi reali e dal risultato della partita.

La Sandbox non deve più aggiornare queste statistiche utilizzando:

```text
events × 25
```

---

# FantasyScore

Uniformare il significato di `FantasyScore`.

Un record deve rappresentare il punteggio fantasy della squadra per una specifica giornata.

Production continuerà a utilizzare il proprio meccanismo di aggregazione per giornata.

Il Control Center non deve più creare artificialmente:

```text
round = 99999999
```

come rappresentazione definitiva del punteggio.

Per il debug può essere mantenuto un meccanismo di snapshot temporaneo solamente se necessario, ma non deve essere confuso con il normale storico delle giornate.

La Sandbox deve utilizzare matchday coerenti con la simulazione.

---

# Production

Non modificare il comportamento incrementale.

Production deve continuare a utilizzare:

```text
FantasyProcessedMatch
```

per garantire:

```text
idempotenza
```

Flusso:

```text
ESL sync
↓
Match FINISHED
↓
FantasyProcessedMatch check
↓
Scoring Engine
↓
persistenza
```

La modifica riguarda esclusivamente la fonte del calcolo dei punti.

---

# Sandbox Recalculate

Il Control Center deve poter continuare a fare:

```text
edit evento
↓
recalculate
```

Il recalculate può continuare ad utilizzare un modello rebuild.

Esempio:

```text
DELETE / rebuild
↓
leggi Match + MatchEvent
↓
Scoring Engine
↓
ricostruisci FantasyPlayerStat
↓
ricostruisci FantasyScore
↓
ricalcola FantasyTeam.totalPoints
```

Il punto fondamentale è che il calcolo venga effettuato dal medesimo Scoring Engine della Production.

---

# Sandbox Simulation

Sostituire:

```text
runScoringOnLatest()
```

quando utilizza:

```text
events × 25
```

con il vero Scoring Engine.

Flusso:

```text
Generazione partita Sandbox
↓
Generazione eventi Sandbox
↓
Scoring Engine
↓
FantasyPlayerStat
↓
FantasyScore
↓
FantasyTeam
```

La simulazione può continuare a generare casualmente:

- partite;
- eventi;
- risultati;

ma il risultato degli eventi deve essere calcolato dalle regole reali.

---

# Sandbox Scope

La Sandbox deve continuare ad essere completamente isolata.

Utilizzare:

```text
leonessa-cup-sandbox
```

e gli eventuali filtri già definiti per:

```text
sandbox-user-*
```

Non modificare dati Production.

Il gate:

```text
APP_SANDBOX_MODE=true
```

deve continuare ad essere obbligatorio per le funzionalità Sandbox/Admin previste.

---

# Control Center

Il Control Center deve continuare a permettere:

```text
selezione partita
↓
modifica evento
↓
recalculate
↓
visualizzazione differenza
```

Lo Scoring Inspector deve mostrare il risultato prodotto dal vero Scoring Engine.

Esempio:

```text
Andrea Rossi

GOAL
+100

ASSIST
+50

WIN
+20

CLEAN SHEET
+30

Base
200

Capitano
×1.5

Finale
300
```

I valori devono derivare dal motore reale, non da una seconda implementazione UI.

---

# Value Engine

Il Value Engine non deve diventare un secondo Scoring Engine.

Il flusso deve essere:

```text
Match
↓
Scoring Engine
↓
FantasyPlayerStat / punti giornata
↓
Fine giornata
↓
Value Engine
↓
variazione LP
```

Il Value Engine deve utilizzare i risultati prodotti dallo scoring.

Non deve ricostruire autonomamente:

```text
gol
assist
win
clean sheet
```

---

# Market Value

Il comportamento già definito deve rimanere invariato:

```text
Durante la giornata
↓
punteggi aggiornati

Fine giornata
↓
calcolo valore mercato

Nuovo valore
↓
FantasyPlayerValueHistory
```

Non modificare il valore del giocatore ad ogni singolo evento.

---

# Test automatici

Introdurre una suite di test per lo Scoring Engine.

## Eventi singoli

Testare:

```text
GOAL → +100
ASSIST → +50
YELLOW → -20
RED → -50
OWN_GOAL → -70
```

## Risultati

```text
WIN → +20
DRAW → +5
LOSS → 0
```

## Clean Sheet

Testare:

```text
POR + clean sheet → +30
DIF + clean sheet → +30
CEN + clean sheet → 0
ATT + clean sheet → 0
```

## Capitano

Testare:

```text
100 × 1.5 = 150
```

e verificare l'arrotondamento previsto.

---

# Test combinati

Creare test per combinazioni reali.

Esempio:

```text
Goal
+
Assist
+
Win
+
Clean Sheet
```

Calcolare il risultato atteso utilizzando le regole ufficiali.

Testare inoltre:

```text
Goal + Yellow
Goal + Red
Assist + Win
Goal + Captain
```

---

# Test Production vs Sandbox

Creare test che utilizzino lo stesso:

```text
Match
MatchEvent
Player
Fantasy selection
```

e verifichino che:

```text
Production scoring result
===
Sandbox scoring result
```

A parità di input.

Questo è uno degli obiettivi principali del piano.

---

# Test Control Center

Scenario:

```text
Match
↓
Goal Rossi
↓
recalculate
```

Verificare:

```text
Rossi +100
```

Poi:

```text
aggiungi Assist
↓
recalculate
```

Verificare:

```text
Rossi +150
```

Poi:

```text
rimuovi Goal
↓
recalculate
```

Verificare:

```text
Rossi +50
```

Questo deve dimostrare che il Control Center effettua realmente il rebuild degli eventi.

---

# Test capitano

Scenario:

```text
Rossi
Goal
Captain
```

Verificare:

```text
100 × 1.5
```

Poi rimuovere il capitano:

```text
100
```

---

# Test Clean Sheet

Creare una partita:

```text
Home 1
Away 0
```

Verificare:

```text
POR/DIF
+30
```

Poi:

```text
Home 1
Away 1
```

Verificare:

```text
nessun clean sheet
```

---

# Test Sandbox Simulation

Utilizzare:

```text
/api/dev/simulate-matchday
```

e verificare che i punteggi risultanti utilizzino le stesse regole del Production Scoring Engine.

In particolare verificare che:

```text
GOAL ≠ 25
```

ma:

```text
GOAL = +100
```

---

# Test Value Engine

Scenario:

```text
Partita
↓
Eventi
↓
Scoring
↓
Fine giornata
↓
Value Engine
```

Verificare che:

```text
FantasyPlayerStat
↓
Value Engine
↓
FantasyPlayerValueHistory
```

utilizzi il punteggio corretto.

Non modificare le regole di variazione del valore.

---

# Idempotenza

Production:

```text
processMatch()
↓
prima esecuzione
→ processato

seconda esecuzione
→ nessun doppio incremento
```

Verificare che l'introduzione del nuovo Scoring Engine non rompa:

```text
FantasyProcessedMatch
```

---

# Recalculate Idempotente

Sandbox:

```text
recalculate
↓
punteggio corretto

recalculate di nuovo
↓
stesso punteggio
```

Non devono comparire duplicazioni.

---

# Compatibilità

La modifica non deve rompere:

```text
Team Builder
Dashboard
Market
Player Profiles
Social
Control Center
Sandbox
Ranking
Value Engine
```

---

# Criteri di completamento

Il piano è completato quando:

```text
✅ Esiste una sola fonte di verità per le regole di scoring

✅ Production utilizza il nuovo Scoring Engine

✅ Control Center utilizza il nuovo Scoring Engine

✅ Sandbox Simulation utilizza il nuovo Scoring Engine

✅ Non esiste più la formula events × 25

✅ Eventi tipizzati producono i punti corretti

✅ Win/Draw producono i punti corretti

✅ Clean Sheet è coerente in tutti i percorsi

✅ Capitano è coerente in tutti i percorsi

✅ FantasyPlayerStat è coerente

✅ FantasyScore è coerente

✅ Production mantiene l'idempotenza

✅ Sandbox mantiene il rebuild

✅ Control Center continua a supportare il reprocess

✅ Value Engine utilizza i risultati dello scoring

✅ Market Value continua ad aggiornarsi a fine giornata

✅ Esistono test automatici dello Scoring Engine

✅ Esistono test Production vs Sandbox

✅ Esistono test Control Center

✅ Esistono test Value Engine

✅ Tutti i test passano

✅ Typecheck passa

✅ Lint passa

✅ Build passa
```

---

# Risultato finale

Dopo questo piano il Fanta avrà una separazione chiara:

```text
                  MATCH + EVENTS
                        │
                        ↓
                ┌───────────────┐
                │ SCORING ENGINE│
                └───────┬───────┘
                        │
          ┌─────────────┼─────────────┐
          ↓             ↓             ↓
      Production      Sandbox      Inspector
          │             │             │
       Persist        Rebuild       Preview
          │             │             │
          └─────────────┼─────────────┘
                        ↓
                FantasyPlayerStat
                        ↓
                   Fine giornata
                        ↓
                   Value Engine
                        ↓
                Market Value / LP
```

La regola fondamentale è:

> **Un solo motore decide quanti punti vale una prestazione. I diversi ambienti decidono solamente come e quando quei risultati vengono persistiti.**

Questo piano deve essere completato **prima di implementare il sistema delle 4 riserve**, perché le riserve introdurranno un ulteriore livello nel percorso di scoring e conviene avere il motore già consolidato.