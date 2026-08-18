# 26-fanta-team-builder.md

## Obiettivo

Permettere all'utente di creare la propria squadra fantasy per la Leonessa Cup.

Al termine di questo piano l'utente dovrà poter:

```text
✅ Creare una squadra fantasy
✅ Assegnare un nome alla squadra
✅ Scegliere gli 11 titolari
✅ Rispettare i ruoli obbligatori
✅ Selezionare un capitano
✅ Spendere il budget iniziale LP
✅ Salvare la squadra nel database
```

Non implementare ancora:

```text
❌ Mercato
❌ Scambi
❌ Aggiornamento valori
❌ Classifiche fantasy
❌ Calcolo punteggi
❌ Storico giornate
```

---

# User Flow

## Caso 1

Utente senza squadra

Apre:

```text
/fanta
```

Visualizza:

```text
⚽ Fanta Leonessa

Crea la tua squadra fantasy e sfida gli altri studenti.

[Crea squadra]
```

---

## Caso 2

Click su:

```text
Crea squadra
```

Apre il Team Builder.

---

# Wizard a Step

Non utilizzare un form gigante.

Utilizzare un processo guidato.

---

## Step 1 — Nome squadra

Schermata semplice.

Campi:

```text
Nome squadra
```

Esempi:

```text
FC Mario
Leonessa Legends
Castelli United
```

Validazioni:

```text
Min 3 caratteri
Max 30 caratteri
Nome obbligatorio
```

Pulsante:

```text
Continua
```

---

## Step 2 — Introduzione Budget

Mostrare:

```text
Budget iniziale:
500 LP
```

Spiegazione:

```text
Ogni giocatore ha un valore.
Dovrai costruire la tua squadra rispettando il budget disponibile.
```

Mostrare:

```text
LP disponibili
```

sempre in evidenza.

---

# Formazione Ufficiale

La V1 utilizza:

```text
1 Portiere

4 Difensori

3 Centrocampisti

3 Attaccanti
```

Totale:

```text
11 giocatori
```

---

# Step 3 — Selezione Giocatori

Visualizzazione:

```text
Portieri
Difensori
Centrocampisti
Attaccanti
```

Filtro rapido:

```text
Scuola
Ruolo
Ricerca
```

---

# Card Giocatore

Ogni giocatore mostra:

```text
Nome
Scuola
Ruolo
Costo LP
```

Badge eventuali:

```text
🦁 Veterano
⚽ Bomber
⭐ MVP
🔥 Molto scelto
🆕 Rookie
```

Se disponibili.

---

# Informazioni Budget

Sempre visibili in alto.

Esempio:

```text
LP disponibili: 184

Giocatori scelti: 8/11
```

Aggiornamento realtime.

---

# Regole di Selezione

Non consentire:

```text
2 portieri
5 attaccanti
```

oltre il limite previsto.

Validazione immediata.

---

# Calcolo Costi

Ogni giocatore possiede:

```text
fantasyValue
```

Salvato nel database.

Esempio:

```text
Portiere = 20

Difensore = 25

Veterano = 40

Bomber = 70
```

Valori reali definiti successivamente.

---

# Controlli Prima del Salvataggio

La squadra può essere salvata solo se:

```text
11/11 giocatori selezionati
```

e

```text
Budget >= 0
```

e

```text
Ruoli completi
```

---

# Step 4 — Scelta Capitano

Mostrare gli 11 selezionati.

L'utente sceglie:

```text
1 Capitano
```

Bonus:

```text
Moltiplicatore x1.5
```

Visualizzazione:

```text
👑 Capitano
```

---

# Step 5 — Conferma

Riepilogo:

```text
Nome squadra

11 giocatori

Capitano

Budget rimanente
```

Pulsante:

```text
Conferma squadra
```

---

# Salvataggio Database

Creare:

## FantasyTeam

```text
Nome squadra
Budget residuo
Utente
```

---

## FantasyTeamPlayer

Per ogni giocatore:

```text
FantasyTeam
Player
Ruolo
Capitano
Costo acquisto
```

Importante:

Salvare il costo di acquisto.

Servirà per il mercato futuro.

---

# Gestione Errori

Mostrare messaggi chiari.

Esempi:

```text
Budget insufficiente.
```

```text
Serve almeno 1 portiere.
```

```text
Devi selezionare un capitano.
```

---

# Esperienza Mobile

Essenziale.

Utilizzare:

```text
Bottom sheet
Stepper
Progress indicator
```

Mostrare sempre:

```text
Step attuale
```

Esempio:

```text
1/4
2/4
3/4
4/4
```

---

# Ricompensa LP

Alla creazione completata:

```text
+50 LP
```

Da assegnare automaticamente.

Prima missione completata.

---

# Analytics

Registrare:

```text
Team creato
Capitano scelto
Giocatore scelto
Budget medio utilizzato
```

Servirà per capire il comportamento degli utenti.

---

# Obiettivo finale del piano

Al termine del Piano 18:

```text
✅ L'utente può creare una squadra fantasy completa
✅ Il budget LP viene rispettato
✅ I ruoli sono validati
✅ Esiste un capitano
✅ I dati sono salvati nel database
✅ La squadra è pronta per ricevere punti nel Piano 20
```

Questa è la prima versione realmente utilizzabile del Fanta Leonessa. Dopo questo step gli utenti possono già costruire la propria rosa, mentre punteggi, mercato e classifiche arriveranno nei piani successivi.