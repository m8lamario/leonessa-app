# 27-fanta-substitutes.md

## Obiettivo

Estendere il Fanta Leonessa introducendo una panchina composta da **4 riserve**.

La squadra fantasy passerà quindi da:

```text
11 giocatori
```

a:

```text
15 giocatori

11 titolari
+
4 riserve
```

Le riserve servono esclusivamente come copertura automatica nel caso in cui un titolare non partecipi alla partita.

---

# Nuova struttura

## Titolari

La formazione rimane:

```text
1 Portiere
4 Difensori
3 Centrocampisti
3 Attaccanti
```

Totale:

```text
11 titolari
```

---

# Riserve

Aggiungere:

```text
1 Portiere
1 Difensore
1 Centrocampista
1 Attaccante
```

Totale:

```text
4 riserve
```

Non introdurre una riserva FLEX nella prima versione.

---

# Rosa completa

La rosa fantasy sarà quindi:

```text
POR
├── 1 titolare
└── 1 riserva

DIF
├── 4 titolari
└── 1 riserva

CEN
├── 3 titolari
└── 1 riserva

ATT
├── 3 titolari
└── 1 riserva
```

Totale:

```text
15 giocatori
```

---

# Team Builder

Aggiornare il Team Builder esistente.

Il processo dovrà diventare:

```text
Nome squadra
↓
Portiere titolare
↓
Difensori titolari
↓
Centrocampisti titolari
↓
Attaccanti titolari
↓
Portiere riserva
↓
Difensore riserva
↓
Centrocampista riserva
↓
Attaccante riserva
↓
Capitano
↓
Riepilogo
↓
Conferma
```

---

# UI Team Builder

Distinguere chiaramente:

```text
TITOLARI
```

e:

```text
PANCHINA
```

La selezione delle riserve non deve essere confusa con quella degli 11 titolari.

Esempio:

```text
FORMAZIONE

11/11 giocatori

[Campo]

PANCHINA

POR  Rossi
DIF  Bianchi
CEN  Verdi
ATT  Neri
```

---

# Budget

Il budget LP deve comprendere anche le riserve.

Esempio:

```text
Budget:
500 LP

Titolari:
420 LP

Riserve:
65 LP

Disponibili:
15 LP
```

Non creare un budget separato per la panchina.

---

# Validazione

La squadra può essere salvata solamente se:

```text
15/15 giocatori selezionati
```

e:

```text
1 POR titolare
4 DIF titolari
3 CEN titolari
3 ATT titolari
```

e:

```text
1 POR riserva
1 DIF riserva
1 CEN riserva
1 ATT riserva
```

e:

```text
1 capitano
```

e:

```text
budget >= 0
```

---

# Vincoli

Un giocatore non può essere contemporaneamente:

```text
Titolare
+
Riserva
```

Non possono esserci duplicati nella rosa.

---

# Capitano

Il capitano deve essere necessariamente uno degli 11 titolari.

Le riserve non possono essere capitano.

---

# Database

Adattare il modello esistente per distinguere:

```text
STARTER
BENCH
```

Evitare di creare strutture duplicate se il modello attuale può essere esteso.

Esempio concettuale:

```prisma
enum FantasyPlayerStatus {
  STARTER
  BENCH
}
```

Ogni `FantasyTeamPlayer` dovrà quindi avere:

```text
fantasyTeamId
playerId
status
role
isCaptain
purchaseValue
```

Utilizzare il modello già presente nel progetto dove possibile.

---

# Ordine delle riserve

Ogni riserva resta associata al proprio ruolo:

```text
POR
DIF
CEN
ATT
```

Inoltre ogni riserva ha un `benchOrder` (0–3) modificabile a mercato aperto, utile per UI e per la `sequence` delle sostituzioni future. L'auto-substitution per ruolo continua a selezionare la riserva dello stesso ruolo (una sola per ruolo in V1).

---

# Blocco Formazione

Prima dell'inizio della giornata:

```text
Titolari + riserve
```

vengono congelati.

Durante una giornata attiva non è possibile:

```text
Cambiare titolari
Cambiare riserve
Cambiare capitano
```

---

# Sostituzione Automatica

Questa è la funzionalità principale delle riserve.

Alla fine della giornata verificare per ogni titolare se ha partecipato alla partita.

Se un titolare non ha giocato:

```text
Titolare
↓
NON HA PARTECIPATO
↓
Riserva dello stesso ruolo
↓
entra automaticamente
```

---

# Esempio

Formazione:

```text
ATT

Rossi — titolare
Bianchi — riserva
```

Rossi non scende in campo.

Il sistema applica:

```text
Rossi
↓
OUT

Bianchi
↓
IN
```

Bianchi riceve il punteggio fantasy.

---

# Se il titolare gioca

Se il titolare ha partecipato alla partita:

```text
Nessuna sostituzione
```

La riserva rimane in panchina.

---

# Se la riserva non gioca

Se anche la riserva non partecipa:

```text
Nessuna sostituzione
```

Non effettuare ulteriori sostituzioni.

---

# Punteggio Riserva

Una riserva che non entra:

```text
0 punti nella giornata
```

Una riserva che entra:

```text
riceve il normale punteggio fantasy
```

Non applicare penalità.

---

# Capitano Non Disponibile

Se il capitano non gioca:

```text
Il bonus capitano NON viene trasferito automaticamente
```

La riserva entra normalmente se appartiene allo stesso ruolo, ma non diventa capitano.

Il bonus capitano viene quindi perso.

---

# Scoring Engine

Aggiornare il flusso:

```text
Match
↓
Partecipazione giocatori
↓
Identificazione titolari assenti
↓
Sostituzioni automatiche
↓
Formazione effettiva
↓
Scoring
↓
Fantasy Score
```

La sostituzione deve avvenire prima del calcolo definitivo del punteggio della squadra.

---

# Storico

È importante distinguere:

```text
Formazione originale
```

da:

```text
Formazione effettiva della giornata
```

Esempio:

```text
Giornata 3

Titolare:
Rossi

Rossi non ha giocato

Sostituito da:
Bianchi
```

Questo deve essere tracciabile.

---

# Fantasy Score

Il punteggio della squadra deve utilizzare il giocatore effettivamente entrato.

Esempio:

```text
Rossi
non gioca
→ 0

Bianchi
entra dalla panchina
→ +80
```

La squadra riceve:

```text
+80
```

---

# Market

Le riserve fanno parte della rosa e quindi:

```text
possono essere vendute
possono essere acquistate
```

nel rispetto delle regole del mercato.

Ogni operazione deve comunque terminare con:

```text
11 titolari
+
4 riserve
```

---

# Modifica Formazione

Quando il mercato è aperto permettere di:

```text
Sostituire titolare

Sostituire riserva

Promuovere una riserva a titolare

Spostare un titolare in panchina
```

sempre rispettando:

```text
1 POR + 4 DIF + 3 CEN + 3 ATT
```

per i titolari e:

```text
1 POR + 1 DIF + 1 CEN + 1 ATT
```

per le riserve.

---

# Dashboard

Aggiornare la visualizzazione della squadra.

Mostrare:

```text
FORMAZIONE

11 Titolari
```

e:

```text
PANCHINA

4 Riserve
```

Le riserve devono essere visibili ma meno prominenti rispetto ai titolari.

---

# Player Profile

Quando un giocatore appartiene a una Fantasy Team:

distinguere:

```text
Titolare
```

da:

```text
Riserva
```

Non considerare automaticamente una riserva come titolare nelle statistiche di ownership della formazione.

---

# Ownership

Distinguere eventualmente:

```text
Posseduto
```

da:

```text
Schierato
```

Esempio:

```text
Posseduto da 120 utenti
Schierato da 84
```

La distinzione deve essere utilizzabile dalle funzionalità future.

---

# Sandbox

Aggiornare il seed Sandbox.

Ogni Fantasy Team deve avere:

```text
15 giocatori
```

con:

```text
11 titolari
4 riserve
```

Creare scenari specifici:

```text
Scenario 1:
Tutti i titolari giocano

Scenario 2:
Un titolare non gioca

Scenario 3:
Titolare + relativa riserva non giocano

Scenario 4:
Capitano non gioca

Scenario 5:
Più titolari non giocano
```

---

# Control Center

Aggiornare il Fanta Control Center per visualizzare:

```text
Titolari
Riserve
```

e permettere di simulare:

```text
Giocatore convocato

Giocatore non convocato

Giocatore non entrato
```

---

# Debug Sostituzioni

Lo Scoring Inspector deve mostrare:

```text
Rossi
Titolare
Non ha giocato

↓

Bianchi
Riserva
Entrato automaticamente
```

e successivamente:

```text
Bianchi
Punteggio:
+80
```

Questo permette di verificare che la sostituzione sia realmente avvenuta.

---

# Test End-to-End

Scenario:

```text
Rosa da 15 giocatori
↓
11 titolari + 4 riserve
↓
Rossi titolare non gioca
↓
Bianchi riserva
↓
Bianchi entra automaticamente
↓
Bianchi ottiene 100 punti
↓
Fantasy Team riceve 100 punti
↓
Ranking aggiornato
```

Verificare inoltre:

```text
Capitano assente
→ nessun bonus capitano

Riserva assente
→ nessuna sostituzione

Titolare presente
→ riserva non utilizzata
```

---

# Performance

La sostituzione deve essere calcolata server-side.

Non affidarsi al client per decidere:

```text
chi entra
```

Il client deve solamente visualizzare il risultato.

---

# Idempotenza

La stessa giornata non deve generare due sostituzioni.

Esempio:

```text
Prima elaborazione:

Rossi → Bianchi

Seconda elaborazione:

NESSUNA nuova sostituzione
```

Lo stato deve essere persistito.

---

# Criteri di completamento

Il piano è completato quando:

```text
✅ La rosa contiene 15 giocatori

✅ Esistono 11 titolari

✅ Esistono 4 riserve

✅ Le riserve sono una per ruolo

✅ Il budget include le riserve

✅ Il Team Builder supporta le riserve

✅ Il mercato supporta le riserve

✅ La formazione viene congelata prima della giornata

✅ Le sostituzioni sono automatiche

✅ Una riserva entra solo se il titolare non gioca

✅ La riserva deve essere dello stesso ruolo

✅ Il capitano non trasferisce il bonus

✅ Il punteggio viene calcolato sul giocatore effettivamente entrato

✅ Il Control Center mostra titolari, riserve e sostituzioni registrate (senza inventare assenze finché non c’è un provider)

✅ Il sistema registra le sostituzioni

✅ La Sandbox permette di testare tutti gli scenari

✅ Il sistema è idempotente
```

---

# Risultato finale

Il Fanta Leonessa passa da:

```text
11 giocatori fissi
```

a:

```text
15 giocatori

11 TITOLARI
+
4 RISERVE
```

mantenendo comunque una logica semplice.

La panchina non deve trasformare il Fanta in un gestionale complesso: deve principalmente proteggere l'utente dall'assenza di un giocatore e aggiungere una piccola componente strategica nella costruzione della rosa.

---

# Decisioni applicative (2026-08-20)

Queste decisioni integrano e precisano il piano. In caso di conflitto prevalgono su sezioni precedenti.

## 1. Partecipazione

- Non introdurre un sistema manuale per registrare chi ha giocato.
- Non usare il criterio `nessun MatchEvent = non ha giocato`.
- Implementare le 4 riserve, `STARTER`/`BENCH`, ordine panchina e gestione formazione.
- L'auto-substitution deve essere **predisposta** (resolver + persistenza `FantasySubstitution`) ma deve ricevere un segnale di partecipazione da un provider esterno.
- Se il provider non è disponibile (`null`), **nessuna** sostituzione automatica viene applicata: si calcolano solo i titolari.
- Quando in futuro ESL (o altra fonte) fornirà dati affidabili, basterà collegare il provider senza rifare il sistema.

## 2. Persistenza

Modello dedicato:

```prisma
model FantasySubstitution {
  fantasyTeamId
  matchId
  playerOutId
  playerInId
  reason
  sequence
}
```

- La formazione originale resta su `FantasyTeamPlayer` (`STARTER`/`BENCH`).
- Le sostituzioni rappresentano le variazioni effettive per match.
- Idempotenza: la stessa sostituzione non deve essere creata due volte per la stessa squadra/match/playerOut.

## 3. Blocco formazione

- Usare il lock mercato già esistente (chiusura 30 minuti prima del kickoff).
- Non creare un secondo sistema di lock.
- A mercato chiuso sono bloccati: buy/sell, cambio titolare↔riserva, ordine riserve, capitano.

## 4. Modifica formazione

A mercato aperto, senza consumare un trasferimento di mercato, l'utente può:

- spostare giocatori tra titolari e riserve;
- modificare l'ordine delle 4 riserve;

sempre mantenendo `11 STARTER + 4 BENCH` e i limiti per ruolo.

## 5. Posseduto vs schierato

Fuori scope in questa fase. Nessuna distinzione aggiuntiva oltre a `FantasyTeamPlayer` e `STARTER`/`BENCH`.

## 6. Control Center

- Mostrare titolari, riserve e sostituzioni registrate.
- Non simulare assenze inventando partecipazione finché non esiste un provider.
- L'inspector deve poter mostrare le sostituzioni effettive quando presenti.
