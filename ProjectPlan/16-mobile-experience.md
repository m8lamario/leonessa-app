# Leonessa Platform
## 16 - Mobile Experience Improvements

---

# Obiettivo

Migliorare la percezione di qualità dell'applicazione attraverso:

- feedback tattili nativi
- spaziature più corrette
- esperienza più vicina ad un'app mobile nativa
- maggiore comfort di utilizzo

Questa implementazione non introduce nuove funzionalità business.

Ha come obiettivo esclusivamente il miglioramento della UX.

---

# Parte 1 - Haptic Feedback

## Obiettivo

Utilizzare il motore aptico di Capacitor per fornire feedback fisico durante le interazioni più importanti.

L'utilizzo deve essere moderato.

Non deve diventare invasivo.

---

# Installazione

Utilizzare:

```bash
npm install @capacitor/haptics
npx cap sync
```

---

# Creare Wrapper Centrale

Creare:

```text
src/shared/lib/haptics/
```

Struttura:

```text
haptics/

├─ haptics.ts
└─ index.ts
```

---

# API Interna

Esporre funzioni:

```ts
selection()
success()
warning()
error()
```

In modo che il resto dell'app non utilizzi direttamente Capacitor.

---

# Utilizzi Consentiti

## Bottom Navigation

Quando l'utente cambia pagina:

```text
Home
Cup
Ranking
Profilo
```

Attivare:

```ts
selection()
```

---

## Ranking Tabs

Quando l'utente cambia tab:

```text
Classifiche
Missioni
Badge
Progressione
```

Attivare:

```ts
selection()
```

---

## Invio Candidatura

Quando una candidatura viene inviata correttamente:

```ts
success()
```

---

## Completamento Missione

Quando una missione viene completata:

```ts
success()
```

---

## Salita di Livello

Quando l'utente ottiene un nuovo livello:

```ts
success()
```

---

## Errori Form

Quando un form contiene errori:

```ts
error()
```

---

# Utilizzi Vietati

NON utilizzare haptic feedback per:

- scroll
- apertura pagina
- skeleton loading
- caricamento dati
- card normali
- hover
- animazioni decorative

---

# Parte 2 - Global Layout Spacing Fix

---

# Problema

Attualmente:

- il contenuto delle pagine è troppo vicino alla Top Area
- le card iniziano troppo in alto
- la Bottom Navigation è troppo vicina al contenuto

La UI risulta visivamente compressa.

---

# Obiettivo

Creare una gerarchia visiva più moderna.

I contenuti devono respirare.

---

# Safe Area Support

Supportare:

```css
env(safe-area-inset-top)
env(safe-area-inset-bottom)
```

Per dispositivi:

- Android
- iPhone con notch
- Dynamic Island

---

# Layout Globale

Creare uno spacing system condiviso.

File:

```text
src/styles/tokens/spacing.css
```

---

# Variabili

```css
--space-xs
--space-sm
--space-md
--space-lg
--space-xl
--space-2xl
```

---

# Padding Superiore

Tutte le schermate principali devono avere:

```css
padding-top: 24px;
```

minimo.

---

# Hero Sections

Se presenti sezioni Hero:

```css
margin-top: 16px;
```

---

# Card Groups

Tra gruppi di card:

```css
gap: 16px;
```

oppure

```css
gap: 24px;
```

---

# Bottom Navigation

Aggiungere maggiore distanza tra:

- contenuto pagina
- barra inferiore

---

## Obiettivo

Evitare che:

```text
Ultima card
↓
Bottom Navigation
```

siano attaccate.

---

# Content Bottom Spacer

Aggiungere uno spacer globale.

Minimo:

```css
120px
```

oppure

```css
calc(120px + env(safe-area-inset-bottom))
```

---

# Scroll Experience

L'ultimo elemento della pagina deve essere completamente visibile.

Non deve mai rimanere nascosto dietro la Bottom Navigation.

---

# Parte 3 - Motion Consistency

---

# Obiettivo

Uniformare tutte le transizioni.

---

# Cambio Pagina

Utilizzare:

```text
Fade
+
Slide Up leggero
```

Durata:

```text
200ms - 250ms
```

---

# Apertura Card

Utilizzare:

```text
Scale 0.98 -> 1
```

molto leggero.

---

# Ranking

Quando cambia tab:

```text
Fade Transition
```

---

# Regola Fondamentale

L'utente deve percepire:

- fluidità
- precisione
- qualità

senza notare esplicitamente animazioni, vibrazioni o effetti.

Tutti questi elementi devono migliorare l'esperienza senza rubare attenzione al contenuto principale della Leonessa Platform.