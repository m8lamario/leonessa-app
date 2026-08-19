# 32-testing-sandbox-platform.md

## Obiettivo

Creare una piattaforma di test interna per Leonessa.

Questa infrastruttura non sarà dedicata esclusivamente al Fanta Leonessa, ma diventerà il sistema ufficiale per simulare, verificare e validare qualsiasi funzionalità dell'app prima del rilascio.

L'obiettivo è poter testare intere feature senza dipendere da:

- ESL
- dati reali
- utenti reali
- competizioni attive

---

# Visione

Leonessa deve poter funzionare in due modalità:

```text
Produzione
```

e

```text
Sandbox
```

La Sandbox permette di simulare qualsiasi scenario dell'app.

---

# Obiettivi del piano

Implementare:

```text
✅ Modalità Sandbox globale

✅ Seed automatici

✅ Simulazione utenti

✅ Simulazione squadre

✅ Simulazione competizioni

✅ Simulazione partite

✅ Simulazione statistiche

✅ Simulazione notifiche

✅ Simulazione classifiche

✅ Tool di reset ambiente

✅ Tool di generazione dati
```

---

# Configurazione

Creare variabile ambiente:

```env
APP_SANDBOX_MODE=true
```

Quando attiva:

```text
L'app utilizza dati simulati
```

Quando disattiva:

```text
L'app utilizza dati reali
```

---

# Separazione Ambiente

La modalità Sandbox non deve modificare:

```text
Utenti reali

Partite reali

Classifiche reali

Dati ESL reali
```

Tutti i dati devono essere isolati.

---

# Seed System

Creare un sistema di popolamento automatico.

Comando:

```bash
npm run sandbox:seed
```

Genera:

```text
Utenti

Scuole

Squadre

Giocatori

Competizioni

Partite

News

Eventi
```

---

# Sandbox Users

Generare utenti fittizi.

Esempio:

```text
Marco Rossi

Giulia Bianchi

Luca Verdi

Anna Ferrari
```

Ogni utente deve avere:

```text
Nome

Email mock

LP

Ruolo
```

---

# Sandbox Schools

Generare scuole simulate.

Esempio:

```text
ITIS Castelli

Liceo Copernico

Abba Ballini

Olivieri
```

---

# Sandbox Players

Generare giocatori simulati.

Quantità minima:

```text
50 giocatori
```

Distribuzione:

```text
Portieri

Difensori

Centrocampisti

Attaccanti
```

Ogni giocatore deve avere:

```text
Nome

Ruolo

Scuola

Valore LP

Statistiche
```

---

# Sandbox Teams

Generare squadre fantasy.

Quantità:

```text
20-50 squadre
```

Ogni squadra deve avere:

```text
Rosa completa

Capitano

Budget residuo

Storico punteggi
```

---

# Sandbox Matches

Generare partite simulate.

Esempio:

```text
Castelli vs Copernico

2 - 1
```

Con:

```text
Marcatori

Assist

Cartellini

MVP
```

---

# Match Simulator

Creare endpoint interno.

Esempio:

```text
/api/dev/simulate-matchday
```

Funzione:

```text
Genera una giornata completa
```

---

# Simulazione Giornata

La simulazione deve:

```text
Generare risultati

Aggiornare statistiche

Aggiornare classifiche

Aggiornare punteggi fantasy

Aggiornare valore giocatori
```

---

# Simulazione Mercato

Endpoint:

```text
/api/dev/simulate-market
```

Funzione:

```text
Aumentare e diminuire il valore LP dei giocatori
```

Per verificare:

```text
Acquisti

Vendite

Budget

Scambi
```

---

# Simulazione Ranking

Permettere:

```text
Salita utenti

Discesa utenti

Parità punti

Cambio leader
```

Per verificare:

```text
Classifiche

Widget

Statistiche
```

---

# Simulazione Notifiche

Endpoint:

```text
/api/dev/simulate-notification
```

Tipologie:

```text
Push

Sistema

Achievement

Mercato

Fantasy
```

---

# Simulazione Achievement

Permettere di sbloccare:

```text
Badge

Livelli

Achievement

Missioni
```

senza attendere eventi reali.

---

# Simulazione Eventi

Permettere di creare:

```text
News

Comunicati

Eventi

Aggiornamenti
```

per verificare:

```text
Dashboard

Feed

Home
```

---

# Admin Sandbox Panel

Nuova sezione amministrativa.

Route:

```text
/admin/sandbox
```

Disponibile solo per amministratori.

---

# Funzioni Admin

Permettere:

```text
Genera utenti

Genera giocatori

Genera partite

Genera giornata

Genera notifiche

Genera achievement

Reset dati
```

---

# Reset Completo

Pulsante:

```text
Reset Sandbox
```

Funzione:

```text
Elimina tutti i dati simulati

Rigenera ambiente iniziale
```

---

# Testing Fanta Leonessa

Grazie alla Sandbox sarà possibile testare:

```text
17 Foundation

18 Team Builder

19 Dashboard

20 Scoring Engine

21 Market

22 Player Profiles

23 Social
```

senza dipendere da ESL.

---

# Testing Future Features

La Sandbox dovrà essere riutilizzabile per:

```text
Dashboard utente

Candidature

Notifiche

Badge

Missioni

Sistema LP

News

Eventi

Accrediti

Ticketing

Competizioni future
```

---

# Logging

Ogni simulazione deve produrre log.

Esempio:

```text
[SIMULATION]

Matchday #3 generated

12 goals
8 assists
4 yellow cards
```

---

# Performance

I dati Sandbox devono essere:

```text
Veloci da generare

Veloci da eliminare

Riproducibili
```

---

# Sicurezza

In produzione:

```text
Sandbox disabilitata
```

Tutti gli endpoint:

```text
/api/dev/*
```

devono essere protetti.

---

# Obiettivo finale del piano

Al termine del Piano 24:

```text
✅ Esiste una modalità Sandbox globale

✅ È possibile simulare una stagione completa

✅ È possibile testare il Fanta Leonessa senza ESL

✅ È possibile verificare classifiche e mercato

✅ È possibile simulare notifiche e achievement

✅ È possibile testare nuove feature future

✅ Leonessa dispone di un ambiente di QA permanente
```

La Sandbox deve diventare uno strumento fondamentale di sviluppo, test e validazione per tutta la piattaforma Leonessa, non soltanto per il sistema Fantasy.