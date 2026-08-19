# 31-fanta-social.md

## Obiettivo

Creare il sistema social del Fanta Leonessa.

L'obiettivo non è costruire un social network, ma aumentare:

- coinvolgimento
- competizione
- condivisione
- ritorno giornaliero nell'app

Tutte le funzionalità devono essere leggere, immediate e pensate per studenti.

---

# Obiettivi del piano

Implementare:

```text
✅ Feed attività fantasy
✅ Rivalità tra utenti
✅ Achievement
✅ Condivisione risultati
✅ Top Performer
✅ Notifiche social
✅ Hall of Fame
```

Non implementare:

```text
❌ Chat
❌ Commenti
❌ Messaggi privati
❌ Gruppi
❌ Social network completo
```

---

# Filosofia

L'utente deve aprire l'app e pensare:

```text
"Cosa hanno fatto gli altri?"
```

oltre a:

```text
"Come sta andando la mia squadra?"
```

---

# Route

Nuova sezione:

```text
/fanta/social
```

Accessibile dal menu Fanta.

---

# Feed Attività

Mostrare gli eventi principali.

Esempi:

```text
🔥 Marco è salito al 1° posto

📈 Andrea Rossi è stato acquistato da 24 utenti

⚽ Luca Bianchi ha generato 250 punti fantasy

👑 Giulia ha cambiato capitano

💎 Castelli Legends ha fatto il miglior acquisto della giornata
```

---

# Feed Rules

Mostrare solo eventi rilevanti.

Evitare spam.

Massimo:

```text
20 eventi recenti
```

---

# Top Performer Giornata

Sezione dedicata.

Mostrare:

```text
🥇 Miglior squadra fantasy

🥈 Seconda

🥉 Terza
```

Con:

```text
Nome squadra

Punti giornata
```

---

# MVP Fantasy

Mostrare:

```text
⭐ MVP della giornata
```

Informazioni:

```text
Giocatore

Scuola

Punti ottenuti
```

---

# Hall of Fame

Pagina dedicata.

Mostrare:

```text
Miglior punteggio singola giornata

Maggior numero di gol fantasy

Maggior crescita valore

Utente più vincente
```

---

# Achievement System

Creare sistema di obiettivi.

---

## Prima Squadra

```text
🏁 Fondatore

Hai creato la tua prima squadra fantasy
```

---

## Primo Gol

```text
⚽ Talent Scout

Uno dei tuoi giocatori segna il primo gol
```

---

## Primo Podio

```text
🥉 Competitivo

Entri nella Top 3
```

---

## Primo Posto

```text
👑 Re della Leonessa

Raggiungi la posizione #1
```

---

## Mercato

```text
💎 Occhio Lungo

Acquisti un giocatore che aumenta di almeno 20 LP
```

---

# Sistema Badge Profilo

Mostrare nel profilo utente.

Esempi:

```text
🏁 Fondatore

⚽ Talent Scout

👑 Re della Leonessa

💎 Trader

🔥 Top 10
```

---

# Rivalità

Sistema automatico.

Identificare:

```text
Utenti vicini in classifica
```

Mostrare:

```text
+120 punti da Marco

-80 punti da Giulia
```

---

# Duello Settimanale

Ogni giornata:

```text
Tu

VS

Rivale diretto
```

Mostrare:

```text
Chi ha ottenuto più punti
```

---

# Condivisione Risultati

Generare card condivisibili.

Esempio:

```text
🏆 Leonessa Cup Fantasy

#4 in classifica

3.250 punti

Leonessa Legends
```

---

# Share Card

Formato:

```text
Instagram Story

WhatsApp

Telegram
```

Preparare generazione immagine dinamica.

---

# Squadre Più Seguite

Classifica social.

Mostrare:

```text
Più popolari

Più vincenti

Più in crescita
```

---

# Trend Settimanali

Nuova sezione.

Mostrare:

```text
🔥 Giocatore più acquistato

📈 Maggior crescita LP

📉 Maggior calo LP

⭐ Miglior prestazione
```

---

# Notifiche Social

Preparare eventi.

Esempi:

```text
Hai superato Marco

Sei entrato in Top 10

Nuovo record personale

Il tuo capitano è MVP
```

---

# Ranking Friends (Future Ready)

Preparare supporto.

Possibile futuro:

```text
Classifica amici

Classifica scuola

Classifica classe
```

Non implementare ancora.

---

# Database

Nuovo modello.

```prisma
model FantasyAchievement {
  id          String @id @default(cuid())

  userId      String

  code        String

  unlockedAt  DateTime @default(now())
}
```

---

# Activity Feed

Nuovo modello.

```prisma
model FantasyActivity {
  id          String @id @default(cuid())

  type        String

  title       String

  description String?

  createdAt   DateTime @default(now())
}
```

---

# Performance

Limiti:

```text
Massimo 20 attività recenti

Massimo 50 achievement caricati

Cache feed social
```

---

# Moderazione

Evitare:

```text
Dati sensibili

Email

Numeri di telefono

Informazioni private
```

Mostrare solo:

```text
Nome squadra

Nome pubblico utente
```

---

# Gamification

L'obiettivo è aumentare:

```text
Ritorno giornaliero

Tempo medio in app

Coinvolgimento studenti

Condivisioni social
```

senza rendere l'app un social network.

---

# Obiettivo finale del piano

Al termine del Piano 23:

```text
✅ Esiste un feed attività fantasy

✅ Esistono achievement e badge

✅ Sono presenti rivalità automatiche

✅ Sono disponibili classifiche speciali

✅ Gli utenti possono condividere i risultati

✅ È presente una Hall of Fame

✅ Il coinvolgimento dell'app aumenta significativamente
```

Questo piano introduce la componente sociale del Fanta Leonessa e trasforma il fantasy da semplice classifica a esperienza condivisa tra studenti e scuole.