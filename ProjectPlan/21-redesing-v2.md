# 21 - Leonessa Brand Identity Header

---

# Obiettivo

Rafforzare immediatamente l'identità visiva della Leonessa Cup all'interno dell'app.

Attualmente la dashboard è moderna e funzionale, ma potrebbe appartenere a qualsiasi applicazione.

L'utente deve percepire fin dal primo secondo di essere all'interno dell'app ufficiale Leonessa Cup.

---

# Problema Attuale

L'header è integrato direttamente nella card principale.

Attualmente mostra:

- scritta Leonessa Cup
- avatar utente
- informazioni scuola

Tuttavia:

- il logo Leonessa non è valorizzato
- manca una vera top bar istituzionale
- il brand non è sufficientemente riconoscibile
- la schermata appare troppo generica

---

# Nuova Struttura Dashboard

Separare completamente:

```text
Top Header Leonessa

↓

Hero Card Utente
```

---

# Top Header Leonessa

Creare una barra superiore dedicata.

---

# Layout

```text
🦁 Leonessa Cup              🔔   MM
```

---

# Lato Sinistro

Visualizzare:

- logo Leonessa
- nome Leonessa Cup

---

# Logo

Utilizzare il logo ufficiale Leonessa.

Dimensione:

```text
28px - 36px
```

---

# Nome

Visualizzare:

```text
Leonessa Cup
```

Peso:

```text
600
```

---

# Stagione

Sotto il titolo:

```text
Stagione 2027
```

oppure

```text
Official App
```

Versione piccola e discreta.

---

# Lato Destro

Visualizzare:

## Notifiche

Icona:

```text
Bell
```

(Lucide React)

Supportare badge futuri.

Esempio:

```text
3
```

---

## Avatar Utente

Visualizzare:

- immagine profilo
- oppure iniziali

Esempio:

```text
MM
```

---

# Hero Card Utente

La card principale rimane sotto l'header.

---

# Modifica Principale

Ridurre l'importanza della scritta:

```text
ITC
```

---

# Nuovo Approccio

Mostrare direttamente:

```text
ITIS Benedetto Castelli
```

come elemento principale.

---

# Gerarchia

```text
Bentornato Mario

ITIS Benedetto Castelli

La tua scuola
```

---

# Motivazione

La maggior parte degli utenti non identifica immediatamente:

```text
ITC
```

Mentre identifica subito:

```text
ITIS Benedetto Castelli
```

---

# Informazioni Hero

Mantenere:

- LP utente
- Livello
- Punti scuola
- Posizione scuola

---

# Prossima Partita

Mantenerla invariata.

---

# Azioni Rapide

Mantenere:

```text
Segui Partita

Vedi Squadra
```

---

# Branding Continuo

Il logo Leonessa deve comparire in:

- Home
- Ranking
- Profilo
- Fanta
- Cup

---

# Regola

Ogni schermata principale deve contenere almeno un elemento identificativo Leonessa.

---

# Animazioni

Al caricamento:

- fade-in leggero
- slide-down minima

Durata:

```text
200ms - 300ms
```

---

# Responsive

L'header deve:

- rispettare safe area Android
- rispettare safe area iOS
- funzionare correttamente con Dynamic Island

---

# Deliverable

Aggiornare la dashboard Home introducendo:

✅ Top Header Leonessa dedicato

✅ Logo ufficiale Leonessa sempre visibile

✅ Bell notifiche

✅ Avatar utente

✅ Separazione Header / Hero Card

✅ Migliore gerarchia della scuola

✅ Branding più forte

✅ Aspetto più premium e istituzionale

Senza modificare le funzionalità esistenti.