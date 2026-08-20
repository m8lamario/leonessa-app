# 39-fanta-lineup-experience.md

## Obiettivo

Trasformare la gestione della squadra Fanta in un'esperienza mobile-first ispirata ai fantasy game calcistici e a FIFA Mobile.

La schermata deve permettere di:

- visualizzare immediatamente la formazione 4-3-3;
- gestire gli 11 titolari;
- gestire le 4 riserve;
- effettuare swap titolare ↔ riserva;
- modificare il capitano;
- vendere un giocatore direttamente dalla sua card;
- sostituire uno slot venduto con un nuovo giocatore;
- accedere al profilo del giocatore;
- confermare la formazione per la giornata;
- comprendere immediatamente se la rosa è valida.

L'obiettivo non è aggiungere funzionalità al Fanta, ma rendere quelle già esistenti più intuitive, rapide e "game-like".

---

# Principi UX

## Mobile First

La schermata deve essere progettata prima per smartphone.

Evitare:

- liste infinite;
- tabelle;
- informazioni ridondanti;
- schermate dense;
- scrolling inutile.

La formazione deve essere il principale elemento visivo della pagina.

---

# Formazione

Utilizzare esclusivamente il modulo:

```text
4-3-3
```

Layout:

```text
              ATT

        ATT          ATT

        CEN   CEN   CEN

      DIF   DIF   DIF   DIF

              POR
```

Gli slot devono essere visualizzati graficamente come un campo/formazione.

Ogni slot contiene una Player Card compatta.

---

# Player Card

La card deve mostrare solamente le informazioni più importanti:

```text
Foto/avatar

Nome
Ruolo

Punti
Valore LP
```

Il capitano deve essere immediatamente riconoscibile:

```text
C
```

oppure un badge dedicato.

Non mostrare statistiche dettagliate direttamente sulla card.

Le informazioni approfondite devono essere disponibili aprendo il giocatore.

---

# Panchina

Sotto la formazione:

```text
PANCHINA

R1   R2   R3   R4
```

Le riserve devono essere ordinate.

Ogni riserva mostra:

```text
Nome
Ruolo
Punti
```

L'ordine rappresenta la priorità:

```text
R1 > R2 > R3 > R4
```

---

# Swap Titolare / Riserva

Supportare due modalità.

## Drag & Drop

L'utente può trascinare:

```text
R1
↓
slot titolare
```

ottenendo:

```text
Titolare → Riserva
R1 → Titolare
```

Lo swap deve essere immediatamente visibile tramite animazione.

## Tap

Per accessibilità e semplicità, il drag & drop non deve essere l'unico metodo.

Tap su un giocatore:

```text
Giocatore
↓
Azioni
↓
Sostituisci
```

e mostrare i giocatori compatibili.

---

# Validazione degli slot

Gli 11 titolari non possono avere buchi.

Stato valido:

```text
11 titolari
+
4 riserve
```

Stato temporaneo durante un'operazione di mercato:

```text
10 titolari
+
1 slot vuoto
+
4 riserve
```

Lo slot vuoto deve essere rappresentato graficamente come:

```text
+
Aggiungi giocatore
```

Lo stato vuoto è consentito solo durante la procedura di sostituzione/acquisto.

Non è possibile:

```text
confermare formazione
```

con uno slot titolare vuoto.

---

# Vendita dalla Player Card

Tap sulla card:

```text
Player Card
↓
Action Sheet
```

Azioni:

```text
Profilo
Sostituisci
Vendi
```

Se l'utente seleziona:

```text
Vendi
```

il giocatore viene rimosso dallo slot e compare:

```text
+ 
AGGIUNGI GIOCATORE
```

Lo slot deve rimanere associato al ruolo necessario.

---

# Riempimento slot vuoto

Dopo una vendita l'utente può scegliere:

```text
Aggiungi giocatore
```

e vedere una selezione filtrata di giocatori acquistabili compatibili con quello slot.

Possibili sorgenti:

```text
Mercato
```

oppure:

```text
Riserve
```

Se viene scelta una riserva:

```text
Riserva → Titolare
```

Se viene acquistato un giocatore:

```text
Nuovo giocatore → Slot
```

Il sistema deve mantenere sempre:

```text
11 titolari
4 riserve
```

quando l'operazione viene completata.

---

# Acquisto giocatore

Quando lo slot è vuoto:

```text
+ Aggiungi giocatore
```

mostrare una selezione compatibile.

Ogni giocatore deve mostrare:

```text
Nome
Scuola
Ruolo
Valore LP
```

e lo stato:

```text
Acquistabile
Non acquistabile
Già posseduto
```

Il budget disponibile deve essere sempre visibile.

Non duplicare la logica del Market: utilizzare le API e le regole già esistenti.

---

# Capitano

Il capitano può essere modificato dalla schermata formazione.

Tap:

```text
Giocatore
↓
Imposta capitano
```

Solo un titolare può essere capitano.

Il capitano deve essere visivamente distinto.

Il moltiplicatore deve continuare a essere gestito esclusivamente dallo Scoring Engine del Piano 38.

---

# Conferma formazione

La parte superiore della schermata deve mostrare lo stato della formazione.

Esempio:

```text
GIORNATA 3

✓ Formazione valida

[ CONFERMA FORMAZIONE ]
```

Dopo la conferma:

```text
🔒 FORMAZIONE CONFERMATA
```

La conferma deve essere persistita.

---

# Lock

Utilizzare il sistema di chiusura mercato già esistente.

Quando il mercato è aperto:

```text
Swap
Cambio capitano
Modifica riserve
Acquisto
Vendita
```

sono consentiti secondo le regole esistenti.

Quando il mercato è chiuso:

```text
Formazione bloccata
```

Non creare un secondo sistema di lock.

---

# Stato confermato

Una volta confermata la formazione:

- mostrare chiaramente lo stato;
- disabilitare le azioni non disponibili;
- mantenere comunque consultabile la formazione;
- mostrare il countdown alla chiusura quando utile.

Non trasformare la conferma in un processo invasivo.

---

# Player Profile

Tap sulla card senza effettuare un'azione deve permettere di accedere al profilo giocatore.

Utilizzare il profilo già implementato:

```text
/player/[playerId]
```

Non duplicare le informazioni del Player Profile nella lineup.

---

# Animazioni

Le animazioni devono comunicare il cambiamento di stato.

Esempi:

```text
Drag R1
↓
slot titolare
↓
swap animato
```

```text
Vendi
↓
card scompare
↓
slot vuoto appare
```

```text
Acquista
↓
nuovo giocatore entra nello slot
```

```text
Conferma
↓
feedback visivo
```

Le animazioni devono essere brevi e fluide.

Evitare animazioni decorative che rallentino la gestione della squadra.

Supportare `prefers-reduced-motion`.

---

# Haptic Feedback

Utilizzare gli haptics già presenti nel progetto per azioni significative:

- swap;
- vendita;
- acquisto;
- cambio capitano;
- conferma formazione.

Non utilizzare haptics continuamente durante lo scrolling o animazioni minori.

---

# Responsive

La priorità è:

```text
smartphone
```

La formazione deve occupare lo spazio necessario senza diventare eccessivamente grande.

Evitare:

- campo gigantesco;
- card sproporzionate;
- scroll verticale eccessivo;
- informazioni duplicate.

Su schermi piccoli deve essere possibile vedere:

```text
formazione
+
panchina
```

senza una quantità eccessiva di scrolling.

---

# Desktop

Il layout desktop può utilizzare uno spazio maggiore, ma non deve trasformarsi in una UI completamente diversa.

La formazione rimane il focus centrale.

---

# Eliminazione della lista giocatori

La lista completa dei giocatori precedentemente mostrata sotto la formazione non deve più essere il componente principale della schermata.

Deve essere sostituita da:

```text
Formazione
+
Panchina
+
azioni contestuali
+
selettore giocatori quando necessario
```

La ricerca dei giocatori deve apparire solamente quando l'utente deve:

```text
acquistare
```

o:

```text
sostituire
```

un giocatore.

---

# Dashboard Fanta

La nuova lineup deve poter diventare anche la rappresentazione principale della formazione nella dashboard Fanta.

La dashboard deve poter mostrare:

```text
Formazione 4-3-3
↓
11 titolari
↓
4 riserve
```

senza replicare la vecchia lista completa.

Le azioni di modifica devono essere disponibili solo quando consentite.

---

# Market Integration

La nuova lineup deve integrarsi con il Market esistente.

Non creare un secondo sistema economico.

Devono essere riutilizzati:

- budget;
- prezzi;
- cambi disponibili;
- validazione acquisto;
- validazione vendita;
- lock mercato.

La lineup diventa semplicemente una nuova interfaccia per effettuare queste operazioni.

---

# Stato vuoto

Se l'utente non possiede ancora una squadra:

```text
Crea la tua squadra
```

e accesso al Team Builder iniziale.

Dopo la creazione:

```text
11 titolari
+
4 riserve
```

---

# Errori

Gli errori devono essere contestuali.

Esempi:

```text
Budget insufficiente
```

```text
Giocatore non disponibile
```

```text
Mercato chiuso
```

```text
Rosa incompleta
```

Evitare errori generici senza spiegazione.

---

# Architettura

La UI deve utilizzare i servizi Fanta già esistenti.

Non duplicare:

```text
Market logic
Scoring logic
Team validation
Player data
Lock logic
```

La nuova UI deve essere un nuovo livello di presentazione e interazione sopra le funzionalità esistenti.

---

# Test

Testare almeno:

```text
11 titolari + 4 riserve
```

```text
Swap titolare ↔ riserva
```

```text
Cambio ordine riserve
```

```text
Vendita titolare
```

```text
Slot vuoto
```

```text
Acquisto nel nuovo slot
```

```text
Sostituzione con riserva
```

```text
Cambio capitano
```

```text
Conferma formazione
```

```text
Blocco formazione
```

```text
Budget insufficiente
```

```text
Mercato chiuso
```

```text
Formazione invalida
```

```text
Idempotenza delle operazioni
```

---

# Criteri di completamento

Il piano è completato quando:

```text
✅ La formazione viene visualizzata come 4-3-3

✅ Sono visibili 11 titolari + 4 riserve

✅ La lista infinita dei giocatori non è più presente nella schermata principale

✅ È possibile fare swap titolare/riserve

✅ È possibile ordinare le riserve

✅ È possibile vendere un giocatore direttamente dalla card

✅ La vendita crea uno slot vuoto

✅ Lo slot vuoto può essere riempito con un acquisto o una riserva

✅ Gli 11 titolari non possono essere confermati con buchi

✅ Il capitano è gestibile dalla formazione

✅ La formazione può essere confermata

✅ Il lock mercato blocca le modifiche

✅ Market e lineup utilizzano le stesse regole

✅ Il Player Profile è raggiungibile

✅ Drag & drop funziona su mobile

✅ Esiste un'alternativa tramite tap

✅ Haptics sono utilizzati sulle azioni principali

✅ Le animazioni sono fluide e non invasive

✅ La UI è realmente mobile-first

✅ La formazione è utilizzabile anche come componente della dashboard

✅ I test principali passano

✅ Typecheck passa

✅ Lint passa

✅ Build passa
```

---

# Risultato finale

L'esperienza deve passare da:

```text
Lista giocatori
↓
seleziona
↓
configura
↓
modifica
```

a:

```text
                 FANTA LEONESSA

                     4-3-3

                    PLAYER
                      ↓
          PLAYER              PLAYER

       PLAYER   PLAYER   PLAYER

    PLAYER   PLAYER   PLAYER   PLAYER

                    PLAYER

                 ─────────

                   PANCHINA

              R1   R2   R3   R4

                 ─────────

          ✓ FORMAZIONE VALIDA

             CONFERMA FORMAZIONE
```

L'utente deve avere la sensazione di **gestire una squadra**, non di compilare un form.

La complessità tecnica deve rimanere dietro l'interfaccia: l'esperienza deve essere semplice, immediata e principalmente basata su **card, tap, drag & drop e feedback visivo**.