# Leonessa Platform
## 14 - Ranking Module

---

# Obiettivo

Il modulo Ranking rappresenta il centro della gamification della Leonessa Platform.

La Home deve raccontare la Leonessa Cup.

La sezione Ranking deve raccontare la partecipazione degli utenti.

L'obiettivo è:

- incentivare il coinvolgimento
- aumentare il senso di appartenenza
- valorizzare la propria scuola
- mostrare la progressione personale
- fornire obiettivi chiari all'utente

---

# Posizione nell'App

Bottom Navigation:

```text
🏠 Home
🏆 Cup
🏅 Ranking
👤 Profilo
```

---

# Struttura Ranking

La sezione Ranking è composta da 4 tab.

```text
🏆 Classifiche
🎯 Missioni
🎖 Badge
📈 Progressione
```

---

# Tab 1 - Classifiche

## Obiettivo

Permettere all'utente di confrontarsi con:

- altri utenti
- altre scuole

---

## Sottosezioni

```text
Utenti
Scuole
```

---

# Ranking Utenti

Mostrare:

- posizione
- avatar
- nome
- scuola
- livello
- LP

---

## Esempio

```text
#1 Marco Rossi
Livello 12
4.850 LP

#2 Giulia Bianchi
Livello 11
4.620 LP

#3 Mario Mottola
Livello 10
4.100 LP
```

---

## Posizione Personale

Anche se l'utente non è in top classifica.

Mostrare sempre:

```text
La tua posizione

#87

Livello 4

1.250 LP
```

---

# Ranking Scuole

## Obiettivo

Creare competizione tra istituti.

---

## Sistema

Utilizzare SSP
(School Support Points)

NON utilizzare LP personali.

---

## Esempio

```text
🥇 Castelli
12.450 SSP

🥈 Copernico
11.980 SSP

🥉 Lunardi
10.750 SSP
```

---

## Informazioni Mostrate

- posizione
- logo scuola
- nome scuola
- SSP totali

---

## Scuola Utente

Mostrare sempre:

```text
La tua scuola

ITIS Castelli

#2

11.980 SSP
```

---

# Tab 2 - Missioni

## Obiettivo

Mostrare all'utente come ottenere LP.

---

# Missioni Attive

Ogni missione mostra:

- titolo
- descrizione
- ricompensa
- progresso
- stato

---

## Stati

```text
AVAILABLE
IN_PROGRESS
COMPLETED
CLAIMED
```

---

## Esempio

```text
Completa il profilo

50 LP

100%
```

---

```text
Partecipa ad un evento

100 LP

0%
```

---

# Missioni Completate

Sezione dedicata.

Visualizzare:

- missione
- data completamento
- ricompensa ottenuta

---

# Tab 3 - Badge

## Obiettivo

Valorizzare i traguardi.

---

# Badge Ottenuti

Visualizzare:

- icona
- nome
- descrizione
- data ottenimento

---

## Esempio

```text
🎖 Profilo Completo

Profilo completato al 100%
```

---

```text
🎖 Tifoso Fedele

Supporta la tua scuola
```

---

# Badge Da Sbloccare

Visualizzare:

- badge
- requisito
- progresso

---

## Esempio

```text
🎖 Costanza

Completa 10 missioni

6 / 10
```

---

# Rarità Badge

Supportare:

```text
Comune
Raro
Epico
Leggendario
```

---

# Tab 4 - Progressione

## Obiettivo

Mostrare crescita personale.

---

# Profilo Livello

Visualizzare:

- livello attuale
- LP attuali
- LP necessari per livello successivo

---

## Esempio

```text
Livello 4

1.250 LP

250 LP al prossimo livello
```

---

# Barra Esperienza

Visualizzazione grafica.

---

## Informazioni

```text
1250 / 1500 LP
```

---

# Storico LP

Timeline cronologica.

---

## Eventi

```text
+50 LP
Completa profilo
```

---

```text
+100 LP
Invita un amico
```

---

```text
+20 LP
Vittoria scuola
```

---

# Statistiche Personali

Visualizzare:

- LP totali guadagnati
- missioni completate
- badge ottenuti
- eventi partecipati
- referral completati

---

# Mobile First

Tutte le schermate devono essere progettate prima per smartphone.

---

# UX

La sezione Ranking deve dare una risposta immediata a:

```text
Quanto sto contribuendo?
```

```text
Come posso ottenere altri LP?
```

```text
Come sta andando la mia scuola?
```

```text
Qual è il mio prossimo obiettivo?
```

---

# Dati Mock

Prima implementazione:

utilizzare esclusivamente dati mock.

Creare:

```text
src/features/ranking/mock
```

---

# Architettura

Feature:

```text
src/features/ranking
```

---

## Struttura

```text
ranking/

├─ components/
├─ sections/
├─ hooks/
├─ types/
├─ mock/
├─ services/
└─ utils/
```

---

# KPI

La sezione Ranking deve aumentare:

- ritorni nell'app
- completamento missioni
- partecipazione eventi
- senso di appartenenza alla scuola

---

# Regola Fondamentale

La gamification non deve mai diventare il prodotto principale.

L'utente deve percepire prima la Leonessa Cup.

Il sistema LP, SSP, Missioni e Badge deve essere un supporto all'esperienza, non il motivo principale dell'esistenza dell'app.