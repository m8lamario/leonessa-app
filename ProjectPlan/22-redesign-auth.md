# 22 - Authentication Experience Redesign

---

# Obiettivo

Ripensare completamente l'esperienza di autenticazione della Leonessa App.

L'obiettivo non è semplicemente permettere il login, ma trasmettere immediatamente il brand Leonessa Cup e offrire un'esperienza moderna, mobile-first e coerente con il resto dell'app.

---

# Problemi Attuali

L'attuale schermata di login risulta troppo simile ad una classica pagina gestionale.

Criticità:

- Card centrale troppo dominante
- Poco spazio per il brand Leonessa
- Esperienza poco memorabile
- Registrazione lunga e poco mobile-friendly
- Troppi campi mostrati contemporaneamente

---

# Filosofia del Redesign

Principi guida:

- Mobile First
- Apple-like
- Minimalista
- Premium
- Forte identità Leonessa
- Massima semplicità

L'utente deve percepire:

```text
Leonessa Cup

Community

Competizione

App ufficiale
```

entro pochi secondi.

---

# Login Redesign

## Layout

Eliminare la classica card contenitore.

Utilizzare un layout fullscreen.

---

# Header

Visualizzare solamente:

- Logo Leonessa
- Titolo Leonessa Cup
- Sottotitolo

---

## Esempio

```text
[LOGO]

Leonessa Cup

La community ufficiale degli studenti
```

---

# Background

Utilizzare:

- colore brand Leonessa
- gradient molto leggero
- texture minima

NON utilizzare:

- stadi
- tifoserie
- immagini fotografiche
- effetti troppo aggressivi

Il logo Leonessa è già sufficiente per identificare il brand.

---

# Sezione Login

Ordine:

## Google Login

Pulsante principale:

```text
Continua con Google
```

---

## Divider

```text
oppure
```

---

## Login Classico

Campi:

- Email
- Password

---

## Azioni

Pulsante:

```text
Accedi
```

---

Link:

```text
Password dimenticata?
```

---

# Footer

Mantenere l'attuale switch grafico.

Visualizzare:

```text
Non hai un account?

Registrati →
```

senza modificare il componente esistente.

---

# Registrazione Redesign

---

# Nuova Filosofia

La registrazione non deve più essere una lunga lista di campi.

Utilizzare un processo guidato a step.

---

# Progress Indicator

Visualizzare sempre:

```text
1 / 4
```

oppure

```text
●━━○━━○━━○
```

---

# Step 1

## Benvenuto

Titolo:

```text
Benvenuto nella Leonessa Cup
```

Campo:

```text
Nome e Cognome
```

CTA:

```text
Continua
```

---

# Step 2

## Scuola

Titolo:

```text
Qual è la tua scuola?
```

Campo:

```text
Ricerca scuola
```

Ricerca istantanea.

Mostrare:

- nome scuola
- eventuale logo

---

# Step 3

## Email

Titolo:

```text
Inserisci la tua email
```

Campo:

```text
Email
```

---

# Step 4

## Password

Titolo:

```text
Proteggi il tuo account
```

Campi:

```text
Password

Conferma Password
```

---

# Step 5

## Conferma

Mostrare riepilogo:

```text
Mario Mottola

ITIS Benedetto Castelli

mario@email.it
```

CTA finale:

```text
Entra nella Leonessa Cup
```

---

# Animazioni

Utilizzare Framer Motion.

Cambio step:

- fade
- slide orizzontale

Durata:

```text
200ms
```

Animazioni leggere.

---

# UX Mobile

Ogni schermata deve occupare quasi tutto il viewport.

Massimo:

```text
1 campo principale
```

per step.

Evitare schermate affollate.

---

# Design System

Utilizzare:

- colori Leonessa
- tipografia esistente
- radius esistenti
- pulsanti esistenti

Mantenere coerenza con Home, Ranking e Profilo.

---

# Accessibilità

Supportare:

- tastiera mobile
- autofill email
- password manager
- Google Password Manager
- Face ID / Biometria (futuro)

---

# Deliverable

Implementare:

✅ Nuovo Login fullscreen

✅ Header Leonessa minimale

✅ Google Login prioritario

✅ Form login semplificato

✅ Registrazione multi-step

✅ Progress indicator

✅ Animazioni fluide

✅ Esperienza mobile-first

✅ Coerenza con il design system Leonessa

Senza modificare la logica Auth.js esistente.