# Leonessa Platform
## 12 - Dashboard User

---

# Obiettivo

La Dashboard User è la schermata principale dell'app per tutti gli utenti registrati.

Rappresenta il punto di ingresso dell'intera esperienza Leonessa.

L'obiettivo non è solamente mostrare informazioni, ma incentivare l'utente a tornare frequentemente sull'app.

La dashboard deve essere:

- coinvolgente
- personalizzata
- immediata
- veloce
- mobile-first

---

# Utente Target

Utente registrato con ruolo:

```text
USER
```

L'utente è principalmente uno spettatore.

Può:

- seguire il torneo
- supportare la propria scuola
- partecipare al Fanta Leonessa
- completare missioni
- accumulare LP
- seguire news ed eventi

---

# Obiettivi della Dashboard

La dashboard deve rispondere immediatamente a queste domande:

```text
Cosa succede oggi?
```

```text
Come sta andando la mia scuola?
```

```text
Qual è la prossima partita?
```

```text
Cosa posso fare per guadagnare LP?
```

---

# Layout

Ordine delle sezioni:

1. Hero
2. Match in evidenza
3. Missioni
4. Classifica scuole
5. News
6. Eventi
7. Profilo rapido

---

# Hero

## Obiettivo

Personalizzare immediatamente l'esperienza.

---

## Informazioni mostrate

- Nome utente
- Scuola selezionata
- Posizione scuola
- Punti scuola
- Prossima partita

---

## Esempio

```text
🏫 ITIS Castelli

#2 nella classifica generale

1.250 punti scuola

Prossima partita

Castelli vs Copernico

Sabato 16:00
```

---

## Azioni

Pulsanti:

```text
Segui partita
```

```text
Vedi scuola
```

---

# Match in Evidenza

## Obiettivo

Portare l'attenzione sulla competizione.

---

## Informazioni

- Squadra A
- Squadra B
- Data
- Ora
- Luogo
- Stato partita

---

## Stati

```text
UPCOMING
LIVE
FINISHED
```

---

## Card

Esempio:

```text
⚽ Match della settimana

Castelli vs Copernico

Sabato 16:00

Centro Sportivo San Filippo
```

---

## CTA

```text
Segui partita
```

---

# Missioni

## Obiettivo

Aumentare la retention.

---

## Informazioni

- titolo
- descrizione
- ricompensa LP
- progresso

---

## Esempi

```text
Apri l'app per 3 giorni consecutivi

+50 LP
```

```text
Segui una partita

+25 LP
```

```text
Invita un amico

+100 LP
```

---

## Visualizzazione

Ogni missione deve mostrare:

- progresso
- percentuale
- stato

---

# Classifica Scuole

## Obiettivo

Creare competizione tra istituti.

---

## Visualizzazione

Mostrare Top 5.

---

## Dati

```text
1. Copernico
2. Castelli
3. Lunardi
4. Abba Ballini
5. Tartaglia
```

---

## Informazioni

- posizione
- logo scuola
- nome scuola
- punti

---

## CTA

```text
Classifica completa
```

---

# News

## Obiettivo

Comunicare aggiornamenti.

---

## Contenuto

- titolo
- immagine
- data
- anteprima

---

## Esempi

```text
Sorteggi ufficiali pubblicati
```

```text
Nuovo sponsor annunciato
```

```text
Intervista al miglior giocatore della settimana
```

---

## CTA

```text
Leggi tutto
```

---

# Eventi

## Obiettivo

Promuovere eventi collegati.

---

## Esempi

```text
Leonessa Cup Opening Day
```

```text
Final Four
```

```text
Cerimonia di Premiazione
```

---

## Informazioni

- titolo
- data
- luogo

---

# Profilo Rapido

## Obiettivo

Mostrare progressione personale.

---

## Informazioni

- Avatar
- Nome
- Livello
- LP Totali
- Scuola

---

## Esempio

```text
Mario Mottola

Livello 4

1.250 LP

ITIS Castelli
```

---

# Bottom Navigation

Massimo 4 voci.

---

## Tab

```text
🏠 Home
```

Dashboard.

---

```text
🏆 Cup
```

Competizione.

---

```text
🏅 Ranking
```

Classifiche.

---

```text
👤 Profilo
```

Profilo utente.

---

# Mobile First

La dashboard viene progettata prima per smartphone.

---

## Risoluzione di riferimento

```text
390x844
```

(iPhone 15)

---

## Regole

- una sola colonna
- scroll verticale
- CTA facilmente raggiungibili
- thumb-friendly

---

# Animazioni

Utilizzare Framer Motion con moderazione.

---

## Consentito

- fade
- slide
- reveal
- microinterazioni

---

## Vietato

- animazioni pesanti
- effetti continui
- elementi che causano lag

---

# Origine Dati

La dashboard legge i dati dal database Leonessa tramite il layer server-side.

```text
src/features/dashboard/server/dashboard-service.ts
```

---

# KPI

La dashboard deve incentivare:

- aperture giornaliere
- permanenza nell'app
- partecipazione alle missioni
- interesse verso la competizione

---

# Definizione di Successo

Un utente deve riuscire in meno di 5 secondi a capire:

- come sta andando la propria scuola
- qual è la prossima partita
- cosa succede nel torneo
- come guadagnare LP

Se queste quattro informazioni sono immediatamente visibili, la Dashboard User è considerata correttamente progettata.