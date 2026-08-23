# Fanta Team Builder — Mobile UX Redesign

## Obiettivo

Ridisegnare completamente la fase di selezione giocatori del Team Builder Fanta.

L'obiettivo non è cambiare le regole del Fanta, ma migliorare drasticamente:

- utilizzo dello spazio;
- leggibilità;
- dimensione delle card;
- quantità e qualità delle informazioni;
- ricerca e filtri;
- scrolling;
- esperienza mobile;
- percezione "game-like".

La nuova interfaccia deve ricordare una schermata di gestione rosa di un gioco mobile, mantenendo però il design system Leonessa.

---

## 1. Layout generale

Ridurre lo spazio occupato dalla timeline superiore.

La timeline deve rimanere utile per capire:

- fase corrente;
- ruoli completati;
- ruolo attuale;
- avanzamento della rosa.

Non deve però occupare una porzione sproporzionata dello schermo.

Ridurre le informazioni secondarie e sfruttare maggiormente lo spazio verticale disponibile per i giocatori.

---

## 2. Lista giocatori

Sostituire le attuali card molto compatte con card più grandi e informative.

Layout mobile consigliato:

- 2 colonne;
- card più alte;
- maggiore spazio per nome e scuola;
- prezzo chiaramente visibile;
- badge/indicatori facilmente riconoscibili;
- statistiche essenziali;
- stato di selezione chiaramente visibile.

Le card devono rimanere leggibili anche senza foto.

---

## 3. Foto giocatore

La foto deve essere opzionale.

Se disponibile:

- mostrarla nella card;
- utilizzarla come elemento visivo principale.

Se non disponibile:

- utilizzare un fallback coerente con Leonessa;
- nessun enorme spazio vuoto;
- mantenere esattamente la stessa struttura della card.

Il componente deve quindi supportare:

```text
photoUrl presente
photoUrl assente
```

senza modificare il layout generale.

---

## 4. Informazioni giocatore

Separare dati obbligatori e dati opzionali.

### Sempre disponibili

Mostrare almeno:

- nome;
- numero;
- scuola;
- ruolo;
- prezzo;
- dati Fanta disponibili.

### Opzionali

Supportare quando disponibili:

- foto;
- piede;
- ruolo secondario;
- titolarità;
- bonus;
- eventuali badge;
- future statistiche.

I dati opzionali non devono generare spazi vuoti quando assenti.

La card deve adattarsi progressivamente ai dati disponibili.

---

## 5. Statistiche

Mostrare solo informazioni realmente disponibili.

Non inventare dati.

Esempi:

```text
Punti
Presenze
Gol
Assist
Valore
```

Se una statistica non è disponibile, non mostrare un placeholder inutile.

La card deve rimanere visivamente equilibrata.

---

## 6. Ricerca

Mantenere la ricerca giocatore.

Deve permettere di cercare almeno:

- nome;
- scuola.

La ricerca deve essere immediata e compatibile con i filtri.

---

## 7. Filtri

Aggiungere filtri facilmente accessibili senza occupare troppo spazio.

Obbligatori:

### Prezzo

Possibilità di filtrare per fascia di prezzo.

Esempio:

```text
Tutti
0–10 LP
10–20 LP
20–50 LP
50+ LP
```

La soluzione UI può essere migliorata rispetto all'esempio.

### Scuola

Dropdown/lista delle scuole disponibili.

### Ordinamento

Prevedere almeno:

- prezzo crescente;
- prezzo decrescente;
- punti;
- nome.

La UI dei filtri deve essere mobile-first.

---

## 8. Budget

La card deve rendere immediatamente comprensibile se un giocatore è acquistabile.

Se il giocatore supera il budget disponibile:

- non eliminarlo;
- mostrarlo comunque;
- renderlo visivamente più scuro/disabilitato;
- impedire la selezione;
- mostrare eventualmente il motivo.

Esempio:

```text
Non hai abbastanza LP
```

Questo permette all'utente di esplorare comunque tutta la lista.

---

## 9. Giocatori già selezionati

Un giocatore già selezionato deve avere uno stato visivo evidente.

Esempio:

```text
✓ Selezionato
```

La card non deve poter essere aggiunta nuovamente.

Il comportamento deve rimanere coerente con le regole esistenti del Team Builder.

---

## 10. Scroll

La lista dei giocatori deve essere realmente scrollabile.

I giocatori non devono mai sovrapporsi ai controlli inferiori.

La struttura deve essere:

```text
Header
↓
Progress / timeline compatta
↓
Titolo fase
↓
Search + filters
↓
Scrollable player list
↓
Bottom navigation/action area
```

Il bottone "Continua" deve rimanere sempre accessibile.

Lo scrolling deve interessare solamente il contenuto necessario.

Aggiungere sufficiente padding inferiore alla lista per evitare che l'ultima riga venga nascosta dal bottone.

---

## 11. Bottom actions

Mantenere:

```text
Indietro
Continua
```

come azioni persistenti.

Devono rimanere fuori dalla lista scrollabile.

Non devono essere coperti dalle card.

Devono rispettare safe-area e Capacitor.

---

## 12. Microinterazioni

Rendere la selezione più simile a un gioco.

Quando si seleziona un giocatore:

- feedback visivo immediato;
- leggera animazione;
- stato selected;
- aggiornamento del contatore.

Esempio:

```text
0/3
↓
1/3
```

L'animazione deve essere breve e non rallentare la selezione.

---

## 13. Responsive

Ottimizzare principalmente per smartphone.

Prevedere comunque:

- smartphone piccoli;
- smartphone grandi;
- tablet.

Su schermi molto piccoli le card devono rimanere leggibili senza comprimere eccessivamente testo e statistiche.

---

## 14. Accessibilità

Garantire:

- contrasto sufficiente;
- target touch adeguati;
- focus states;
- testi leggibili;
- supporto `prefers-reduced-motion`.

Non utilizzare solamente colore per indicare selezione/disponibilità.

---

## 15. Performance

Non introdurre rendering inutilmente pesante.

La lista deve rimanere fluida anche con molti giocatori.

Evitare immagini obbligatorie se non disponibili.

Utilizzare lazy loading/ottimizzazione immagini quando saranno disponibili foto reali.

---

## 16. Regole Fanta

NON modificare le regole di business esistenti.

Il redesign deve mantenere:

- budget;
- ruoli;
- numero massimo per ruolo;
- giocatori selezionabili;
- capitano;
- riserve;
- validazione squadra;
- salvataggio.

Questo piano riguarda esclusivamente UX/UI e presentazione della selezione.

---

## 17. Dati futuri

Il componente deve essere progettato per supportare progressivamente nuovi dati senza richiedere un redesign.

Esempio futuro:

```text
foto
piede
ruolo secondario
titolarià
bonus
statistiche
badge
```

Se questi dati non sono presenti oggi, l'interfaccia deve funzionare perfettamente comunque.

---

## 18. Criteri di completamento

La nuova fase deve:

- usare meglio lo spazio verticale;
- ridurre significativamente lo spazio occupato dalla timeline;
- avere card più grandi;
- supportare foto opzionali;
- supportare informazioni opzionali;
- avere ricerca;
- avere filtro prezzo;
- avere filtro scuola;
- avere ordinamento;
- mostrare giocatori fuori budget ma disabilitati;
- avere lista scrollabile;
- non coprire mai i pulsanti inferiori;
- mantenere Indietro/Continua sempre accessibili;
- funzionare bene su Capacitor;
- mantenere tutte le regole Fanta esistenti;
- avere microinterazioni fluide;
- essere responsive.

Eseguire alla fine:

npm run typecheck
npm run lint
npm run test
npm run build

Non modificare altre sezioni dell'app non coinvolte dal Team Builder.