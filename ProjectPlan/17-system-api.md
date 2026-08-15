# 17 - ESL Sync & Ranking Engine

---

# Obiettivo

Sincronizzare automaticamente i dati della Leonessa Cup da ESL.

L'app non dovrà leggere direttamente ESL.

Tutti i dati verranno salvati nel database Leonessa.

---

# Architettura

ESL API

↓

ESL Sync Service

↓

PostgreSQL Leonessa

↓

Ranking Engine

↓

App

---

# Frequenza Sincronizzazione

## Avvio Applicazione

Al primo avvio del backend:

```text
Eseguire immediatamente una sincronizzazione.
```

---

## Successivamente

Ogni:

```text
30 minuti
```

eseguire una nuova sincronizzazione.

---

# Fonte Dati

API:

```text
https://api.estudentsleague.com/matches/?format=json
```

---

# Filtro Competizione

Recuperare tutte le partite.

Filtrare esclusivamente:

```text
Leonessa Cup
```

Ignorare:

- Mole Cup
- Bora Cup
- Olympius Cup
- altre competizioni ESL

---

# Database

## Teams

Salvare o aggiornare:

```text
eslId
name
school
logo
```

---

## Matches

Salvare o aggiornare:

```text
eslId

homeTeam
awayTeam

homeScore
awayScore

status

matchDate

competition
```

---

# Metodo

Utilizzare:

```text
UPSERT
```

Mai creare duplicati.

---

# Ranking Engine

Dopo ogni sincronizzazione.

---

## Partite da Elaborare

Solo:

```text
status = finished
```

---

## Regola

Una partita può assegnare punti una sola volta.

---

# Campo Necessario

Tabella Match:

```text
rankingProcessed
```

Default:

```text
false
```

---

Quando i punti vengono assegnati:

```text
rankingProcessed = true
```

---

# Sistema Punti

## Vittoria

Squadra vincente:

```text
+100 LP
```

---

## Pareggio

Entrambe:

```text
+50 LP
```

---

## Sconfitta

```text
0 LP
```

---

# Applicazione Punti

Esempio:

```text
Castelli 3 - 1 Copernico
```

Risultato:

```text
Castelli +100 LP

Copernico +0 LP
```

---

Esempio:

```text
Castelli 2 - 2 Tartaglia
```

Risultato:

```text
Castelli +50 LP

Tartaglia +50 LP
```

---

# Ranking School

Tabella:

```text
SchoolRanking
```

Campi:

```text
schoolId

totalPoints

wins

draws

losses

matchesPlayed
```

---

# Aggiornamento Ranking

Quando una partita viene elaborata:

Aggiornare:

```text
matchesPlayed

wins

draws

losses

totalPoints
```

---

# Sicurezza

Se ESL corregge un risultato:

NON ricalcolare automaticamente.

Loggare:

```text
Match already processed
```

e inviare alert agli admin.

Versione MVP.

---

# Logging

Loggare:

```text
Sync Started

Matches Retrieved

Leonessa Matches Filtered

Teams Updated

Matches Updated

Ranking Updated

Sync Completed
```

---

# Endpoint Interni

## Teams

```http
GET /api/cup/teams
```

---

## Matches

```http
GET /api/cup/matches
```

---

## Ranking

```http
GET /api/ranking/schools
```

---

# Obiettivo Finale

Avere un sistema automatico che:

- legge ESL
- filtra Leonessa Cup
- aggiorna squadre
- aggiorna partite
- assegna punti
- aggiorna il ranking

senza alcun intervento manuale.