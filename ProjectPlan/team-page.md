# 20 - Team Pages

---

# Obiettivo

Creare le pagine dedicate alle squadre della Leonessa Cup.

Le Team Pages devono rafforzare il senso di appartenenza alla propria scuola e valorizzare la community presente nell'app.

NON devono duplicare il sito ufficiale Leonessa.

Le informazioni dettagliate su classifiche e calendario continueranno ad essere disponibili sul sito web principale.

L'app deve offrire il valore aggiunto della community e dell'interazione.

---

# Route

Creare:

```text
/team/[teamId]
```

oppure

```text
/teams/[teamId]
```

seguendo le convenzioni del progetto.

---

# Fonte Dati

## Dati Sportivi

Provenienza:

```text
ESL Sync Database
```

NON interrogare direttamente ESL dal frontend.

Utilizzare esclusivamente i dati già sincronizzati nel database Leonessa.

---

## Dati Community

Provenienza:

```text
Database Leonessa
```

Utilizzare:

- utenti registrati
- candidature
- giocatori approvati
- staff approvati
- supporter

---

# Header Squadra

Mostrare:

- logo squadra
- nome squadra
- scuola
- posizione attuale
- punti ranking

---

# Esempio

```text
ITIS Castelli

#3 in classifica

350 LP
```

---

# Statistiche Squadra

Card dedicata.

Mostrare:

- posizione classifica
- punti
- partite giocate
- vittorie
- pareggi
- sconfitte
- gol fatti
- gol subiti
- differenza reti

---

# Community Leonessa

Questa è la sezione principale della pagina.

---

## Giocatori Registrati

Mostrare gli utenti associati alla squadra con ruolo:

```text
PLAYER
```

Informazioni:

- avatar
- nome
- ruolo

---

## Staff Squadra

Mostrare utenti con ruolo:

```text
TEAM_STAFF
```

Informazioni:

- avatar
- nome
- ruolo

---

## Supporters

Mostrare:

```text
Numero totale supporter
```

registrati nell'app.

---

# Top Supporters

Classifica interna della squadra.

Mostrare:

```text
Top 5 supporter
```

ordinati per LP.

Informazioni:

- posizione
- avatar
- nome
- LP

---

# Ultime Partite

Mostrare solamente:

```text
Ultime 3 partite
```

---

# Card Partita

Visualizzare:

- squadra casa
- squadra ospite
- risultato
- esito

---

# Prossime Partite

Mostrare:

```text
Prossime 3 partite
```

---

# Card Partita

Visualizzare:

- squadra casa
- squadra ospite
- data
- ora

---

# Redirect al Sito Ufficiale

L'app NON deve replicare tutte le informazioni sportive.

---

## Classifica Completa

Pulsante:

```text
Visualizza Classifica Completa
```

Azione:

```text
Apri sito Leonessa
```

---

## Calendario Completo

Pulsante:

```text
Visualizza Calendario Completo
```

Azione:

```text
Apri sito Leonessa
```

---

# CTA Community

Mostrare call-to-action differenti in base allo stato dell'utente.

---

## Utente Non Associato

Mostrare:

```text
Entra nella tua squadra
```

---

## Candidatura Giocatore

Mostrare:

```text
Candidati come Giocatore
```

---

## Candidatura Staff

Mostrare:

```text
Candidati come Staff
```

---

# Stato Candidatura

Se esiste una candidatura:

```text
In Revisione
```

oppure

```text
Approvata
```

oppure

```text
Rifiutata
```

---

# UI / UX

Seguire design system Leonessa.

---

## Layout

Ordine sezioni:

```text
Header

Statistiche

Community

Top Supporters

Ultime Partite

Prossime Partite

CTA

Link Sito
```

---

# Performance

Utilizzare:

- React Query
- Skeleton Loading
- Lazy Rendering liste

---

# Non Implementare

NON implementare:

- modifica risultati
- modifica classifiche
- gestione partite
- statistiche avanzate
- dati live ESL

---

# Obiettivo Finale

Creare una pagina squadra che:

- rafforzi il senso di appartenenza
- valorizzi la community Leonessa
- mostri le informazioni principali della squadra
- utilizzi i dati già presenti nel database
- eviti duplicazioni con il sito ufficiale
- favorisca candidature di giocatori e staff