# 18 - Bottom Navigation Redesign

---

# Obiettivo

Ridisegnare completamente la Bottom Navigation per ottenere un'esperienza più moderna, premium e nativa.

L'ispirazione principale deve essere:

- Apple Human Interface Guidelines
- iOS Tab Bar
- App moderne come:
    - Instagram
    - Spotify
    - Apple Music
    - Apple Fitness

La navigazione deve risultare:

- elegante
- minimale
- leggibile
- premium
- coerente con il brand Leonessa

---

# Problema Attuale

Attualmente la Bottom Navigation:

- appare troppo semplice
- è troppo vicina ai contenuti
- utilizza elementi poco coerenti
- non comunica qualità premium

---

# Principi di Design

## Regola 1

Massimo:

```text
4 voci
```

Navigazione:

```text
Home
Cup / Fanta
Ranking
Profilo
```

---

## Regola 2

Utilizzare SOLO icone professionali.

NON utilizzare:

- emoji
- simboli testuali
- caratteri Unicode

---

# Libreria Icone

Utilizzare:

```bash
npm install lucide-react
```

Libreria ufficiale consigliata.

---

# Mapping Icone

## Home

Icona:

```text
House
```

---

## Cup / Fanta

Valutare:

```text
Trophy
```

oppure

```text
Goal
```

oppure

```text
Shield
```

---

## Ranking

Icona:

```text
ChartNoAxesColumn
```

oppure

```text
Medal
```

---

## Profilo

Icona:

```text
User
```

---

# Stile Apple Inspired

---

## Altezza

Aumentare leggermente l'altezza.

Target:

```text
72px - 80px
```

esclusa safe area.

---

## Safe Area

Supportare:

```css
env(safe-area-inset-bottom)
```

---

## Background

Utilizzare:

```text
Bianco semi-trasparente
```

oppure

```text
Blu Leonessa ultra leggero
```

---

## Effetto

Applicare:

```css
backdrop-filter: blur(...)
```

stile iOS.

---

## Obiettivo

Sensazione:

```text
Floating Navigation
```

non:

```text
Barra incollata al fondo
```

---

# Floating Effect

La Bottom Navigation non deve toccare i bordi.

Aggiungere:

```css
margin-left
margin-right
margin-bottom
```

---

## Esempio

```text
┌───────────────────┐
│                   │
│     CONTENUTO     │
│                   │
│   ┌───────────┐   │
│   │ Home ...  │   │
│   └───────────┘   │
└───────────────────┘
```

---

# Active State

L'elemento attivo deve essere immediatamente riconoscibile.

---

## Richiesto

- colore brand
- icona evidenziata
- label evidenziata

---

## Animazione

Quando cambia pagina:

- fade
- micro scale
- 200ms

---

# Haptic Feedback

Quando si cambia tab:

```ts
selection()
```

utilizzando Capacitor Haptics.

---

# Micro Interazioni

Quando una tab viene premuta:

```text
scale 0.96
↓
scale 1
```

Animazione molto leggera.

---

# Badge Support

La Bottom Navigation deve supportare badge futuri.

Esempio:

```text
Profilo (1)

Ranking (3)
```

oppure

```text
puntino rosso
```

---

# Layout

Ogni item:

```text
Icona

Label
```

---

# Tipografia

Label:

```text
11px - 12px
```

peso:

```text
500
```

---

# Colori

## Inattivo

Grigio neutro.

---

## Attivo

Blu Leonessa.

---

# Accessibilità

Area cliccabile minima:

```text
44x44
```

---

# Performance

Animazioni GPU accelerated.

---

# Deliverable

Aggiornare la Bottom Navigation esistente implementando:

- nuovo design premium
- effetto floating
- blur stile Apple
- Lucide Icons
- active state moderno
- haptic feedback
- supporto badge
- safe area iOS/Android
- animazioni leggere

Non modificare la logica di navigazione esistente.

Modificare esclusivamente UX/UI.