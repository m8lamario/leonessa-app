# 29-fanta-market.md

## Obiettivo

Implementare il sistema di mercato del Fanta Leonessa.

Il mercato permette agli utenti di:

- acquistare nuovi giocatori
- vendere giocatori attuali
- migliorare la propria formazione
- utilizzare strategicamente gli LP
- reagire alle prestazioni del torneo

Il mercato rappresenta il principale strumento di evoluzione della squadra fantasy durante la competizione.

---

# Obiettivi del piano

Implementare:

```text
✅ Mercato giocatori
✅ Valori dinamici
✅ Acquisto giocatori
✅ Vendita giocatori
✅ Sistema LP
✅ Storico variazioni prezzo
✅ Finestre di mercato
✅ Limiti ai cambi
```

Non implementare:

```text
❌ Scambi tra utenti
❌ Aste
❌ Prestiti
❌ Squadre multiple
❌ Mercato live durante le partite
```

---

# Filosofia del Mercato

Il Fanta Leonessa non vuole simulare il Fantacalcio classico.

L'obiettivo è:

```text
Facile da capire
Facile da usare
Strategico quanto basta
```

Tutto deve funzionare bene da smartphone.

---

# Apertura Mercato

## Mercato Chiuso

Durante le partite:

```text
🔒 Mercato chiuso
```

Non è possibile:

```text
Acquistare
Vendere
Modificare la formazione
Cambiare capitano
```

---

## Mercato Aperto

Tra una giornata e la successiva:

```text
🟢 Mercato aperto
```

Consentire:

```text
Acquisti
Vendite
Modifica capitano
Aggiornamento formazione
```

---

# Finestre di Mercato

Il mercato si apre automaticamente:

```text
Fine giornata
↓
Aggiornamento punteggi
↓
Aggiornamento valori
↓
Mercato aperto
```

Si chiude automaticamente:

```text
30 minuti prima della prima partita successiva
```

---

# Valore Giocatori

Ogni giocatore possiede:

```prisma
fantasyValue Int
```

Valore espresso in:

```text
LP
```

---

# Valore Iniziale

Prima dell'inizio del torneo:

Esempio:

```text
Portiere      20 LP
Difensore     25 LP
Centrocampista 30 LP
Attaccante    35 LP
```

Successivamente il valore sarà influenzato dalle prestazioni.

---

# Aggiornamento Valori

L'aggiornamento avviene:

```text
Una sola volta
alla fine della giornata
```

Mai in tempo reale.

---

# Formula V1

Aumento valore:

```text
Ottima prestazione
+5 LP
```

Prestazione buona:

```text
+2 LP
```

Prestazione neutra:

```text
0 LP
```

Prestazione negativa:

```text
-2 LP
```

Prestazione molto negativa:

```text
-5 LP
```

---

# Limiti Prezzo

Per evitare squilibri:

```text
Prezzo minimo: 5 LP
Prezzo massimo: 150 LP
```

---

# Storico Prezzi

Ogni modifica deve essere registrata.

Creare:

```prisma
model FantasyPlayerValueHistory {
  id         String   @id @default(cuid())

  playerId   String

  oldValue   Int
  newValue   Int

  reason     String?

  createdAt  DateTime @default(now())
}
```

---

# Vendita Giocatore

Quando un utente vende:

```text
Riceve il valore attuale del giocatore
```

Esempio:

```text
Acquistato a 20 LP

Valore attuale:
35 LP

Vendita:
+35 LP
```

Questo incentiva la scoperta dei talenti.

---

# Acquisto Giocatore

Controlli:

```text
Budget sufficiente
Ruolo valido
Formazione valida
```

Se uno dei controlli fallisce:

```text
Operazione bloccata
```

---

# Sistema Cambi

Per evitare abusi.

---

## Cambi Gratuiti

Ogni giornata:

```text
2 cambi gratuiti
```

---

## Cambi Extra

Dal terzo cambio:

```text
10 LP per cambio
```

Costo configurabile.

---

# Contatore Cambi

Salvare:

```prisma
freeTransfers Int
paidTransfers Int
```

per ogni giornata.

---

# Penalità Cambi (opzione futura)

Non implementare ora.

Possibile V2:

```text
Cambio extra
=
-20 punti fantasy
```

Lasciare predisposizione.

---

# Dashboard Mercato

Creare:

```text
/fanta/market
```

---

# Sezioni Mercato

## Budget

Mostrare:

```text
LP disponibili
```

---

## Rosa Attuale

Visualizzare:

```text
Titolari
Capitano
Valore attuale
```

---

## Acquista

Filtri:

```text
Ruolo
Scuola
Prezzo
Popolarità
```

---

## Trending

Mostrare:

```text
📈 In crescita

📉 In calo

🔥 Più acquistati
```

---

# Badge Mercato

Mostrare:

```text
🔥 Molto acquistato

📈 In crescita

💎 Affare

⭐ Top performer
```

---

# Modifica Capitano

Consentita solo con:

```text
Mercato aperto
```

---

# Audit e Sicurezza

Verificare:

```text
Budget corretto

Numero giocatori corretto

Ruoli corretti

Capitano valido
```

prima di salvare.

---

# Logging

Registrare:

```text
Acquisto giocatore

Vendita giocatore

Cambio capitano

LP spesi

LP guadagnati
```

---

# Notifiche Push

Preparare eventi:

```text
Mercato aperto

Mercato in chiusura

Giocatore in forte crescita

Giocatore della tua squadra in calo
```

Le notifiche verranno implementate successivamente.

---

# Performance

Obiettivi:

```text
Mercato < 1 secondo

Ricerca giocatore < 300 ms

Aggiornamento squadra immediato
```

---

# Obiettivo finale del piano

Al termine del Piano 21:

```text
✅ Esiste un mercato funzionante

✅ I giocatori hanno un valore dinamico

✅ Gli LP diventano una risorsa strategica

✅ Gli utenti possono migliorare la propria squadra

✅ I prezzi evolvono durante il torneo

✅ Sono supportati cambi e sostituzioni

✅ La squadra fantasy può evolvere giornata dopo giornata
```

Questo piano trasforma il Fanta Leonessa da una squadra statica a un vero gioco di gestione che mantiene gli utenti attivi per tutta la durata del torneo.