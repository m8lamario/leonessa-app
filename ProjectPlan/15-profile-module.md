# Leonessa Platform
## 15 - Profile Experience

---

# Obiettivo

La sezione Profilo non deve essere un semplice pannello impostazioni.

Il profilo deve rappresentare l'identità dell'utente all'interno dell'ecosistema Leonessa.

L'obiettivo è:

- aumentare il senso di appartenenza
- valorizzare i risultati dell'utente
- incentivare la partecipazione attiva
- facilitare l'ingresso in squadre e staff
- creare una vera identità Leonessa

---

# Posizione nell'App

Bottom Navigation:

```text
🏠 Home
🏆 Cup
🏅 Ranking
👤 Profilo
```

---

# Filosofia UX

Quando un utente apre il proprio profilo deve percepire:

```text
Questa è la mia identità all'interno della Leonessa Cup.
```

Non deve sembrare:

```text
Una pagina impostazioni.
```

Le impostazioni saranno presenti ma avranno un ruolo secondario.

---

# Struttura Generale

Il profilo sarà composto da 5 sezioni principali:

```text
1. Hero Profile
2. Personal Showcase
3. Leonessa Opportunities
4. My Applications
5. Settings
```

---

# 1. Hero Profile

Sezione superiore.

È il primo elemento visibile.

---

## Contenuto

Mostrare:

- avatar
- nome
- cognome
- scuola
- ruolo principale
- livello
- LP totali

---

## Layout

```text
[Avatar]

Mario Mottola

ITIS Castelli

🏅 Supporter

Livello 4
1250 LP
```

---

# Ruolo

Ogni ruolo deve essere rappresentato da un badge grafico.

---

## Ruoli supportati

```text
Supporter
Giocatore
Staff Squadra
Staff Leonessa
Rappresentante
Sponsor
Organizzatore
```

---

## Obiettivo

Rendere immediatamente riconoscibile il ruolo dell'utente.

---

# Badge Evidenziato

Se l'utente possiede badge speciali.

Mostrare:

```text
🎖 Tifoso Fedele
```

oppure

```text
🎖 Founder 2027
```

---

# 2. Personal Showcase

Sezione dedicata ai risultati personali.

---

## Obiettivo

Far sentire l'utente parte del progetto.

---

# Informazioni Mostrate

## Ranking

```text
#87 su 2140 utenti
```

---

## Missioni Completate

```text
14 Missioni
```

---

## Badge Ottenuti

```text
8 Badge
```

---

## Eventi Partecipati

```text
5 Eventi
```

---

## Scuola

Mostrare:

```text
ITIS Castelli
```

e posizione della scuola.

```text
#2 nel Ranking Scuole
```

---

# 3. Leonessa Opportunities

La sezione più importante del profilo.

---

# Obiettivo

Permettere ad ogni utente di partecipare attivamente alla Leonessa Cup.

---

# Card 1

## Diventa Giocatore

Card dedicata.

---

### Testo

```text
⚽ Vuoi rappresentare la tua scuola?

Invia la tua candidatura
alla squadra del tuo istituto.
```

---

## Form

Campi:

- Nome
- Cognome
- Classe
- Numero WhatsApp
- Motivazione

---

## Stato Richiesta

```text
In Revisione
Accettata
Rifiutata
```

---

# Card 2

## Diventa Staff Squadra

---

### Testo

```text
📋 Aiuta la tua squadra.

Supporta il team durante
la stagione Leonessa.
```

---

## Form

Campi:

- Nome
- Cognome
- Numero WhatsApp
- Motivazione

---

## Stato Richiesta

```text
In Revisione
Accettata
Rifiutata
```

---

# Card 3

## Entra nello Staff Leonessa

Questa card deve essere molto più visibile.

---

# Design

Visual premium.

Colori:

- Blu Leonessa
- Gradient
- Glow leggero

---

## Testo

```text
🚀 Costruiamo la Leonessa Cup insieme.

Cerchiamo persone motivate
che vogliono contribuire
alla crescita del torneo.
```

---

## Form

Campi:

- Nome
- Cognome
- Numero WhatsApp
- Motivazione

---

## Stato Richiesta

```text
In Revisione
Accettata
Rifiutata
```

---

# Futuro

Possibili categorie:

- Social Media
- Foto/Video
- Sicurezza
- Organizzazione
- Hospitality
- Logistica
- Comunicazione

---

# 4. My Applications

Sezione dedicata alle candidature inviate.

---

# Obiettivo

Evitare che l'utente perda traccia delle richieste.

---

## Visualizzazione

Lista cronologica.

---

### Esempio

```text
Giocatore Castelli

In Revisione

Inviata il 12/02/2027
```

---

```text
Staff Leonessa

Accettata

Inviata il 20/02/2027
```

---

# Stati Supportati

```text
Draft
Submitted
In Review
Accepted
Rejected
Withdrawn
```

---

# Storico

Le richieste devono rimanere consultabili.

---

# 5. Settings

Sezione secondaria.

Posizionata in fondo alla pagina.

---

# Account

- Email
- Password
- Logout

---

# Notifiche

- Push Notifications
- News Leonessa
- Eventi
- Ranking
- Missioni

---

# Privacy

- Privacy Policy
- Termini
- Gestione Consensi

---

# Supporto

- Contatti
- Segnala Problema

---

# Profilo Pubblico

Versione semplificata visibile agli altri utenti.

---

# Mostrare

- Avatar
- Nome
- Scuola
- Ruolo
- Livello
- Badge principali

---

# Non mostrare

- Email
- Telefono
- Richieste
- Informazioni sensibili

---

# Social Features (MVP)

NON implementare:

- follower
- following
- chat
- commenti
- messaggi privati

---

# Possibili Funzionalità Future

Valutare successivamente:

- profili pubblici avanzati
- amici
- confronti tra utenti
- attività scuola

---

# Mobile First

L'intera esperienza deve essere progettata per smartphone.

---

# Animazioni

Utilizzare Framer Motion.

Animazioni leggere:

- fade-in
- slide-up
- card reveal

Evitare animazioni pesanti.

---

# Dati Mock

Prima implementazione:

utilizzare dati mock.

---

# Architettura

Feature:

```text
src/features/profile
```

Struttura:

```text
profile/

├─ components/
├─ sections/
├─ hooks/
├─ services/
├─ types/
├─ mock/
└─ utils/
```

---

# KPI

La sezione Profilo deve aumentare:

- candidature staff
- candidature giocatori
- senso di appartenenza
- completamento profilo
- partecipazione alla Leonessa Cup

---

# Regola Fondamentale

Il profilo deve trasformare uno spettatore passivo in un partecipante attivo.

Ogni elemento della schermata deve contribuire a questo obiettivo.