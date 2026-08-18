# 25 - Account Verification & Recovery

---

# Obiettivo

Implementare il primo sistema completo di gestione account della Leonessa App utilizzando Resend.

L'obiettivo è:

- aumentare la qualità degli utenti registrati
- ridurre account fake
- migliorare sicurezza e recupero accessi
- integrare la prima missione LP reale dell'app

---

# Tecnologie

Utilizzare:

- Auth.js
- Prisma
- PostgreSQL
- Resend

---

# Fase 1 - Verifica Email

## Obiettivo

Ogni nuovo utente deve verificare la propria email.

---

# Stato Utente

Aggiungere supporto a:

```text
Email Verificata

Email Non Verificata
```

Utilizzare il campo:

```prisma
emailVerified
```

già previsto da Auth.js.

---

# Registrazione

Dopo la registrazione:

1. creare account
2. effettuare login
3. inviare email verifica tramite Resend

---

# Email Verifica

Contenuto:

```text
Benvenuto nella Leonessa Cup

Verifica il tuo account per completare la registrazione.
```

Pulsante:

```text
Verifica Account
```

---

# Token

Generare:

- token casuale
- monouso
- con scadenza

---

# Verifica Completata

Quando l'utente clicca il link:

1. verificare token
2. aggiornare emailVerified
3. invalidare token

---

# Ricompensa LP

La verifica email rappresenta la prima missione dell'app.

---

## Missione

```text
Verifica il tuo account
```

Ricompensa:

```text
+25 LP
```

---

# Regole

La ricompensa:

- può essere ottenuta una sola volta
- non può essere duplicata
- deve essere registrata nel ledger LP

---

# LP Transaction

Motivazione:

```text
EMAIL_VERIFIED
```

---

# Banner Email Non Verificata

Mostrare banner nelle schermate principali.

---

# Contenuto

```text
Verifica la tua email e ottieni 25 LP
```

CTA:

```text
Verifica Ora
```

---

# Visibilità

Mostrare banner solo se:

```text
emailVerified = null
```

---

# Fase 2 - Password Dimenticata

---

# Login

Aggiungere link:

```text
Password dimenticata?
```

---

# Flusso

```text
Inserisci email

↓

Invio email Resend

↓

Link Reset

↓

Nuova Password

↓

Conferma
```

---

# Email Reset

Titolo:

```text
Recupero Password Leonessa Cup
```

---

# Token

Token:

- monouso
- scadenza limitata
- invalidazione immediata dopo utilizzo

---

# Reset Password

Pagina dedicata.

Campi:

```text
Nuova Password

Conferma Password
```

---

# Sicurezza

Utilizzare:

```text
bcrypt
```

per l'aggiornamento password.

---

# Fase 3 - Cambio Password

---

# Profilo

Nuova sezione:

```text
Sicurezza
```

---

# Form

Campi:

```text
Password Attuale

Nuova Password

Conferma Password
```

---

# Validazione

Verificare:

- password attuale corretta
- nuova password valida

---

# Aggiornamento

Aggiornare:

```text
passwordHash
```

nel database.

---

# Fase 4 - Cambio Email (Future)

NON implementare ora.

---

# Motivazione

Per la prima release:

- verifica email
- recupero password
- cambio password

sono sufficienti.

---

# Cambio Email Futuro

Prevedere documentazione futura per:

```text
Cambio Email

↓

Verifica nuova email

↓

Conferma

↓

Aggiornamento account
```

---

# Template Email

Creare template brandizzati Leonessa.

---

# Requisiti

Header:

```text
Logo Leonessa
```

Footer:

```text
Leonessa Cup
```

Colori:

- Blu Leonessa
- Bianco

---

# Tracking

Registrare audit log per:

- email verificata
- richiesta reset password
- password modificata

---

# Deliverable

Implementare:

✅ Verifica email tramite Resend

✅ Missione LP +25 per verifica account

✅ Banner email non verificata

✅ Recupero password

✅ Reset password tramite token

✅ Cambio password dal profilo

✅ Template email Leonessa

✅ Audit log operazioni sensibili

❌ NON implementare ancora cambio email