# 27-fanta-dashboard.md

## Obiettivo

Creare la dashboard principale del Fanta Leonessa.

Questa sarà la schermata che gli utenti consulteranno più spesso durante il torneo e dovrà mostrare immediatamente:

- andamento della propria squadra
- posizione in classifica
- punti accumulati
- stato del mercato
- prestazioni dei propri giocatori

Inoltre questo piano introduce il primo ambiente completo di test per il sistema fantasy.

---

# Obiettivi del piano

Implementare:

```text
✅ Dashboard Fanta completa
✅ Hero section con statistiche principali
✅ Visualizzazione formazione
✅ Prestazioni ultima giornata
✅ Accesso rapido al mercato
✅ Classifica rapida
✅ Widget di scoperta giocatori
✅ Seed iniziale giocatori
✅ Stato vuoto per nuovi utenti
```

Non implementare:

```text
❌ Mercato
❌ Scambi
❌ Modifica formazione
❌ Sistema punteggi reale
❌ Social completo
```

---

# Route

Pagina principale:

```text
/fanta
```

Accessibile solo agli utenti autenticati.

---

# Prerequisiti

La dashboard deve funzionare sia con:

```text
Utente con squadra
```

sia con:

```text
Utente senza squadra
```

---

# Ambiente di Test

Per facilitare lo sviluppo del Fanta Leonessa creare un dataset iniziale.

Popolare il database con:

```text
Almeno 40 giocatori
```

Distribuiti in:

```text
5 Portieri

15 Difensori

10 Centrocampisti

10 Attaccanti
```

Provenienti da:

```text
Almeno 4 scuole differenti
```

Ogni giocatore deve avere:

```text
Nome
Scuola
Ruolo
Fantasy Value
Statistiche Mock
```

Esempio:

```text
Andrea Rossi
ITIS Castelli
ATT
40 LP
```

Questo dataset servirà per sviluppare:

```text
Team Builder

Dashboard

Mercato

Classifiche

Sistema punteggi
```

senza dipendere immediatamente dai dati reali ESL.

---

# Layout Dashboard

La dashboard sarà composta da:

```text
Header
↓
Hero Card
↓
Formazione
↓
Prestazioni Ultima Giornata
↓
Prossima Giornata
↓
Mercato
↓
Classifica Rapida
↓
Widget Giocatori
```

---

# Header

Mostrare:

```text
⚽ Nome squadra

Posizione attuale

Punti totali

Budget LP disponibile
```

Esempio:

```text
Leonessa Legends

#14

3.250 punti

184 LP
```

---

# Hero Card

Card principale della schermata.

Mostrare:

```text
Posizione

Punti totali

Variazione classifica

Punti ottenuti nell'ultima giornata
```

Esempio:

```text
#14

3.250 punti

↑ +8 posizioni

+340 punti ultima giornata
```

Se disponibile:

```text
Miglior risultato stagionale
```

---

# Formazione

Visualizzazione grafica della squadra.

Schema iniziale:

```text
      ATT
ATT   ATT

   CEN
CEN CEN

 DIF DIF
DIF DIF

     POR
```

Ogni giocatore mostra:

```text
Nome

Scuola

Ruolo

Punti accumulati
```

---

# Capitano

Il capitano deve essere immediatamente riconoscibile.

Mostrare:

```text
👑 Capitano
```

oppure:

```text
C
```

sul badge del giocatore.

---

# Prestazioni Ultima Giornata

Sezione dedicata alle prestazioni recenti.

Per ogni giocatore mostrare:

```text
Punti ottenuti

Gol

Assist

Cartellini

Bonus/Malus
```

Esempio:

```text
Andrea Rossi

+150 punti

⚽ 1 gol
🎯 1 assist
```

---

# Prossima Giornata

Mostrare:

```text
Prossima giornata Leonessa Cup
```

Informazioni:

```text
Numero di giocatori coinvolti

Partite imminenti

Countdown
```

Esempio:

```text
8 giocatori scenderanno in campo

Inizio tra:
2 giorni e 5 ore
```

---

# Mercato

Card dedicata.

Mostrare:

```text
Budget LP disponibile

Numero cambi disponibili

Stato mercato
```

Esempio:

```text
184 LP

2 cambi disponibili

🟢 Mercato aperto
```

oppure:

```text
🔴 Mercato chiuso
```

Pulsante:

```text
Vai al Mercato
```

Il mercato verrà implementato nel Piano 21.

---

# Classifica Rapida

Mostrare:

```text
Top 10 utenti
```

Visualizzazione:

```text
#1 Marco
#2 Luca
#3 Anna
...
```

L'utente deve essere evidenziato anche se fuori dalla Top 10.

Esempio:

```text
────────────

#14 Tu
```

Pulsante:

```text
Classifica completa
```

---

# Widget Giocatori

Sezione dinamica.

Mostrare:

```text
🔥 Più scelto

📈 In crescita

⭐ MVP attuale
```

Esempio:

```text
🔥 Più scelto

Andrea Rossi

Scelto da 142 utenti
```

---

# Stato Vuoto

Se l'utente non ha ancora creato una squadra.

Mostrare:

```text
⚽ Benvenuto nel Fanta Leonessa

Non hai ancora creato la tua squadra.
```

Pulsante principale:

```text
Crea la tua squadra
```

Reindirizzare al Team Builder.

---

# Esperienza Guidata Creazione Squadra

La creazione della squadra deve essere percepita come un percorso guidato.

Utilizzare una timeline progressiva.

Esempio:

```text
① Nome Squadra
↓
② Portiere
↓
③ Difensori
↓
④ Centrocampisti
↓
⑤ Attaccanti
↓
⑥ Capitano
↓
⑦ Conferma
```

Mostrare sempre il progresso corrente.

Esempio:

```text
Passo 3 di 7
```

oppure:

```text
██████░░░░░░

43%
```

---

# Progress Header

Durante tutta la creazione della squadra mostrare sempre:

```text
LP rimanenti

Giocatori selezionati

Passo corrente
```

Esempio:

```text
220 LP

6/11 giocatori

Passo 3 di 7
```

---

# Esperienza Mobile Team Builder

Ogni passaggio deve occupare una singola schermata.

Evitare:

```text
Liste infinite

Form enormi

Scroll eccessivo
```

Preferire:

```text
Un passo alla volta

Bottom sheet

Ricerca veloce

Selezione immediata
```

L'utente deve concentrarsi su una sola decisione per schermata.

---

# Performance

Utilizzare:

```text
Server Components
```

per:

```text
Classifica

Statistiche

Dati statici
```

Utilizzare:

```text
Client Components
```

solo per:

```text
Interazioni

Aggiornamenti live

Azioni utente
```

---

# Skeleton Loading

Mostrare skeleton durante il caricamento.

Evitare:

```text
Spinner centrali
```

Preferire:

```text
Skeleton delle card

Skeleton formazione

Skeleton classifica
```

---

# Responsive Mobile

La dashboard è progettata principalmente per smartphone.

Priorità:

```text
Mobile First
```

Utilizzare:

```text
Card verticali

Touch target ampi

Scrolling naturale

Animazioni leggere
```

---

# Obiettivo finale del piano

Al termine del Piano 19:

```text
✅ Esiste una dashboard Fanta completa

✅ Esiste un dataset iniziale di test

✅ L'utente vede immediatamente la propria situazione

✅ La formazione è visualizzabile

✅ La classifica è accessibile

✅ Il mercato è raggiungibile

✅ Il Team Builder è guidato tramite timeline

✅ L'esperienza mobile è ottimizzata

✅ La dashboard è pronta per ricevere il sistema punteggi del Piano 20
```

La dashboard deve diventare il centro dell'esperienza Fanta Leonessa e incentivare gli utenti ad aprire l'app ogni giorno durante tutto il torneo.