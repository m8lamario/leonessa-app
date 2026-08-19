# 30-fanta-player-profiles.md

## Obiettivo

Creare il sistema di profili giocatore del Fanta Leonessa.

I profili giocatore rappresentano uno degli elementi più importanti dell'intero ecosistema perché:

- aiutano gli utenti a scegliere i giocatori
- valorizzano gli studenti partecipanti
- aumentano il coinvolgimento dei giocatori reali
- generano condivisioni e competizione tra scuole
- alimentano il mercato fantasy

L'obiettivo è trasformare i giocatori della Leonessa Cup in veri protagonisti dell'app.

---

# Obiettivi del piano

Implementare:

```text
✅ Profilo giocatore dedicato
✅ Statistiche storiche
✅ Statistiche attuali
✅ Badge e riconoscimenti
✅ Valore fantasy
✅ Popolarità
✅ Storico prestazioni
✅ Dashboard personale atleta
```

Non implementare:

```text
❌ Chat
❌ Messaggi privati
❌ Commenti
❌ Social feed
❌ Upload autonomo contenuti
```

---

# Filosofia

Il profilo deve rispondere immediatamente a due domande:

```text
Chi è questo giocatore?

Vale la pena prenderlo nel Fanta?
```

---

# Route

Pagina pubblica:

```text
/player/[playerId]
```

Ogni giocatore possiede un profilo dedicato.

---

# Header Profilo

Mostrare:

```text
Nome e Cognome

Scuola

Ruolo

Numero maglia (se disponibile)

Anno scolastico
```

Esempio:

```text
Andrea Rossi

ITIS Castelli

Attaccante

Classe 5°
```

---

# Avatar

Versione V1:

```text
Iniziali giocatore
```

Versione futura:

```text
Foto ufficiale
```

Preparare il database per supportarla.

---

# Card Statistiche Principali

Mostrare:

```text
Gol

Assist

Presenze

Punti Fantasy Generati
```

Esempio:

```text
⚽ 7 Gol

🎯 4 Assist

🏃 9 Presenze

⭐ 840 Punti Fantasy
```

---

# Badge Sistema

Ogni giocatore può ottenere badge.

---

## Badge Storici

```text
🦁 Veterano
```

Partecipazione ad almeno una Leonessa Cup precedente.

---

```text
🏆 Campione
```

Ha vinto una Leonessa Cup.

---

```text
⭐ MVP Storico
```

Premi individuali ottenuti.

---

## Badge Prestazione

```text
⚽ Bomber
```

Tra i migliori marcatori.

---

```text
🎯 Assist Man
```

Tra i migliori assistman.

---

```text
🧱 Muro
```

Portiere o difensore con ottime statistiche difensive.

---

## Badge Popolarità

```text
🔥 Molto Scelto
```

Top 10%.

---

```text
⭐ Popolare
```

Top 25%.

---

```text
📈 In Crescita
```

Aumento importante di selezioni.

---

Evitare badge negativi.

---

# Valore Fantasy

Mostrare:

```text
Valore attuale
```

Esempio:

```text
42 LP
```

---

# Andamento Valore

Grafico semplice.

Visualizzare:

```text
Valore iniziale

Valore attuale

Trend
```

Esempio:

```text
20 LP
↓
42 LP
```

---

# Popolarità

Mostrare:

```text
Numero utenti che lo possiedono
```

Esempio:

```text
Scelto da 184 utenti
```

---

# Ownership %

Mostrare:

```text
Percentuale di possesso
```

Esempio:

```text
28%
degli utenti fantasy
```

---

# Storico Prestazioni

Elenco ultime giornate.

Esempio:

```text
Giornata 1
+120 punti

Giornata 2
+80 punti

Giornata 3
+190 punti
```

---

# Ultime Partite

Mostrare:

```text
Avversario

Risultato

Prestazione fantasy
```

---

# Statistiche Leonessa

Pagina dedicata alle statistiche del torneo.

Mostrare:

```text
Gol

Assist

Presenze

Cartellini

Clean Sheet
```

se applicabile.

---

# Confronto con Altri Giocatori

Preparare supporto futuro.

Esempio:

```text
Confronta con...
```

Non implementare ancora.

---

# Dashboard Personale Atleta

Funzionalità speciale.

Se il giocatore possiede un account Leonessa associato al proprio profilo:

```text
Utente
↓
Giocatore verificato
```

visualizzare informazioni aggiuntive.

---

# Profilo Verificato

Badge:

```text
✅ Giocatore Verificato
```

---

# Dashboard Atleta

Visualizzare:

```text
Statistiche personali

Andamento valore

Numero selezioni

Posizionamento tra i giocatori
```

---

# Coinvolgimento Atleta

Mostrare:

```text
Quanti utenti lo hanno selezionato

Posizione nella popolarità

Valore fantasy
```

Questo aumenta il coinvolgimento dei partecipanti.

---

# Ranking Giocatori

Preparare classifiche.

Esempio:

```text
Top Marcatori

Top Assist

Più Scelti

Più Costosi

Più Cresciuti
```

---

# SEO e Condivisione

Preparare:

```text
Meta title

Meta description

Open Graph
```

Per condivisioni future.

---

# Performance

Utilizzare:

```text
Server Components
```

per statistiche.

Utilizzare:

```text
Client Components
```

solo per:

```text
Grafici

Interazioni

Confronti
```

---

# Stato Vuoto

Per nuovi giocatori.

Mostrare:

```text
🆕 Rookie

Prima partecipazione alla Leonessa Cup
```

Anche senza statistiche.

---

# Database

Preparare campi aggiuntivi:

```prisma
isVerifiedPlayer Boolean

fantasyValue Int

ownershipCount Int

ownershipPercentage Float
```

---

# Obiettivo finale del piano

Al termine del Piano 22:

```text
✅ Ogni giocatore ha un profilo dedicato

✅ Gli utenti possono valutare chi acquistare

✅ I giocatori reali sono valorizzati

✅ Sono disponibili statistiche e badge

✅ È visibile il valore fantasy

✅ È visibile la popolarità

✅ Esiste una dashboard dedicata agli atleti verificati
```

Questo piano trasforma i giocatori da semplici record nel database a veri protagonisti della Leonessa Cup e del Fanta Leonessa.