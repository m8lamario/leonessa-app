# 28-fanta-scoring-engine.md

## Obiettivo

Creare il motore di calcolo del Fanta Leonessa.

Questo sistema dovrà:

- sincronizzare automaticamente i risultati dalla piattaforma ESL
- assegnare punti fantasy ai giocatori
- aggiornare i punteggi delle squadre fantasy
- aggiornare le classifiche globali
- preparare i dati per il mercato dinamico

Tutto il sistema deve essere completamente automatico.

---

# Obiettivi del piano

Implementare:

```text
✅ Sincronizzazione ESL
✅ Raccolta risultati
✅ Calcolo punteggi fantasy
✅ Aggiornamento squadre fantasy
✅ Aggiornamento classifica
✅ Storico giornate
✅ Aggiornamento statistiche giocatori
```

Non implementare:

```text
❌ Mercato
❌ Aggiornamento prezzi
❌ Scambi
❌ Social
```

---

# Fonte Dati Ufficiale

Utilizzare:

```text
https://api.estudentsleague.com/matches/?format=json
```

Fonte unica e ufficiale.

Tutti i dati fantasy derivano esclusivamente da ESL.

---

# Filtro Competizione

Il sistema deve ignorare tutte le altre competizioni.

Considerare esclusivamente:

```text
Leonessa Cup
```

Tutte le partite non appartenenti alla Leonessa Cup devono essere scartate.

---

# Sistema di Sincronizzazione

Creare:

```text
Fantasy Sync Service
```

Posizione:

```text
src/features/fanta/server/scoring-sync.ts
```

---

# Frequenza Aggiornamento

Alla partenza dell'app:

```text
1 sincronizzazione immediata
```

Successivamente:

```text
ogni 30 minuti
```

Cron consigliata:

```text
*/30 * * * *
```

---

# Flusso di Elaborazione

```text
ESL
↓
Recupero partite Leonessa Cup
↓
Recupero eventi partita
↓
Calcolo punteggi fantasy
↓
Aggiornamento giocatori
↓
Aggiornamento squadre fantasy
↓
Aggiornamento classifica
↓
Aggiornamento statistiche mercato
```

---

# Nuovi Modelli Prisma

## FantasyMatchday

Rappresenta una giornata fantasy.

```prisma
model FantasyMatchday {
  id          String   @id @default(cuid())

  round       Int

  startedAt   DateTime?
  completedAt DateTime?

  createdAt   DateTime @default(now())
}
```

---

## FantasyScore

Storico punteggi.

```prisma
model FantasyScore {
  id             String @id @default(cuid())

  fantasyTeamId  String

  matchdayId     String

  points         Int

  createdAt      DateTime @default(now())
}
```

---

## FantasyPlayerStat

Statistiche fantasy aggregate.

```prisma
model FantasyPlayerStat {
  id           String @id @default(cuid())

  playerId     String @unique

  goals        Int @default(0)
  assists      Int @default(0)

  yellowCards  Int @default(0)
  redCards     Int @default(0)

  matches      Int @default(0)

  totalPoints  Int @default(0)

  updatedAt    DateTime @updatedAt
}
```

---

# Regole Punteggio V1

## Bonus

```text
Gol             +100
Assist          +50
Vittoria        +20
Pareggio        +5
Clean Sheet     +30
```

---

## Malus

```text
Ammonizione     -20
Espulsione      -50
Autogol         -70
```

---

# Clean Sheet

Applicabile solamente a:

```text
Portieri
Difensori
```

Condizione:

```text
0 gol subiti dalla squadra
```

---

# Capitano

Applicare:

```text
x1.5
```

sui punti finali del giocatore.

Esempio:

```text
100 punti

↓

150 punti
```

---

# Calcolo Squadra Fantasy

Per ogni squadra:

```text
Somma punti degli 11 titolari
```

Successivamente:

```text
Applicazione bonus capitano
```

Risultato:

```text
Punteggio giornata
```

---

# Aggiornamento Totale

Aggiornare:

```text
FantasyTeam.totalPoints
```

aggiungendo:

```text
Punti giornata
```

---

# Classifica Globale

Ordinare:

```text
FantasyTeam.totalPoints DESC
```

Generare:

```text
Ranking fantasy globale
```

---

# Storico Giornate

Salvare sempre:

```text
Punteggio giornata
```

Non ricalcolare ogni volta.

Questo permette:

```text
Storico
Grafici
Analisi
```

future.

---

# Prevenzione Duplicati

Ogni partita ESL deve essere elaborata una sola volta.

Creare:

```prisma
model FantasyProcessedMatch {
  id        String @id @default(cuid())

  matchId   String @unique

  syncedAt  DateTime @default(now())
}
```

---

# Gestione Errori

Se ESL non risponde:

```text
Mantenere ultimo stato valido
```

Non azzerare dati.

---

# Logging

Registrare:

```text
Partite elaborate
Eventi elaborati
Punti assegnati
Errori sincronizzazione
Tempo esecuzione
```

---

# Dashboard Admin

Preparare endpoint interni per:

```text
Ultima sincronizzazione

Numero partite elaborate

Numero utenti fantasy

Numero giocatori fantasy
```

Non sviluppare ancora UI admin.

---

# Preparazione Mercato Dinamico

Alla fine di ogni giornata salvare:

```text
Prestazione giornata
Punti giornata
Valore attuale giocatore
```

Questi dati saranno utilizzati nel Piano 21.

---

# Performance

Obiettivi:

```text
Sincronizzazione < 5 secondi

Calcolo giornata < 3 secondi

Aggiornamento classifica < 2 secondi
```

---

# Obiettivo finale del piano

Al termine del Piano 20:

```text
✅ ESL sincronizzato automaticamente
✅ Punti fantasy calcolati
✅ Capitano supportato
✅ Classifica aggiornata
✅ Storico giornate disponibile
✅ Statistiche giocatori aggiornate
✅ Base pronta per il mercato dinamico
```

Questo piano rappresenta il cuore del Fanta Leonessa. Tutte le funzionalità successive dipenderanno da questo sistema.