# Leonessa App
## Product Requirements Document (PRD) v1.0

---

# 1. Executive Summary

## Cos'è

Leonessa App è la piattaforma digitale ufficiale della Leonessa Cup.

L'app centralizza l'esperienza di studenti, giocatori, staff e organizzatori, offrendo strumenti per seguire il torneo, partecipare alla community e gestire le operazioni dell'evento.

L'obiettivo è creare un ecosistema digitale capace di accompagnare l'utente durante tutta la stagione, migliorando sia l'organizzazione interna sia il coinvolgimento della community.

---

## Problemi Attuali

### Organizzazione

- Comunicazioni frammentate principalmente tramite WhatsApp.
- Difficoltà nella gestione dei turni dello staff.
- Assenza di un sistema centralizzato per presenze e incarichi.
- Difficoltà nel monitoraggio operativo durante gli eventi.

### Community

- Coinvolgimento limitato ai giorni delle partite.
- Mancanza di una piattaforma unica per seguire la competizione.
- Assenza di sistemi di fidelizzazione e appartenenza.

### Prodotto

- Processi distribuiti su più strumenti.
- Assenza di uno storico centralizzato delle attività.
- Difficoltà nell'introdurre nuove iniziative digitali.

---

## Obiettivi

### Organizzazione

- Migliorare la gestione operativa degli eventi.
- Ridurre il caos organizzativo.
- Aumentare la presenza e l'affidabilità dello staff.
- Centralizzare le comunicazioni.

### Community

- Incrementare il coinvolgimento degli studenti.
- Rafforzare il legame con la propria scuola.
- Incentivare la partecipazione durante tutta la stagione.
- Creare senso di appartenenza alla Leonessa Cup.

### Prodotto

- Realizzare una piattaforma scalabile.
- Supportare competizioni future.
- Consentire l'aggiunta di nuove funzionalità senza rifattorizzazioni importanti.
- Diventare il punto di riferimento digitale della Leonessa Cup.

---

# 2. Contesto

## Leonessa Cup

La Leonessa Cup è un torneo calcistico cittadino che coinvolge le scuole superiori di Brescia.

### Dati attuali

- 22 scuole partecipanti.
- Centinaia di giocatori iscritti.
- Migliaia di spettatori durante la stagione.
- Decine di membri dello staff.
- Coinvolgimento di sponsor e partner.

---

## Visione Futura

La piattaforma dovrà essere progettata per supportare:

- Leonessa Cup.
- Invibe Padel Cup.
- Eventi speciali.
- Competizioni future.
- Collaborazioni con sponsor.
- Nuovi format sportivi.

---

# 3. Utenti

## User

Studente registrato alla piattaforma.

### Obiettivi

- Seguire il torneo.
- Restare aggiornato.
- Partecipare alla community.
- Utilizzare il sistema Fanta.
- Accumulare punti.

---

## Player

Giocatore appartenente a una squadra.

### Obiettivi

- Consultare calendario e partite.
- Visualizzare statistiche.
- Seguire la propria squadra.
- Partecipare alle attività della community.

---

## Staff

Membro dello staff operativo.

### Obiettivi

- Consultare i turni assegnati.
- Effettuare check-in.
- Partecipare alle attività operative.
- Accumulare punti staff.

---

## School Representative

Rappresentante di istituto.

### Obiettivi

- Coinvolgere gli studenti.
- Promuovere la partecipazione.
- Monitorare l'attività della propria scuola.

---

## Organizer

Organizzatore della competizione.

### Obiettivi

- Coordinare le operazioni.
- Gestire staff e attività.
- Monitorare gli eventi.
- Garantire il corretto svolgimento del torneo.

---

## Admin

Amministratore della piattaforma.

### Obiettivi

- Gestione completa del sistema.
- Configurazione della piattaforma.
- Supervisione globale.

---

# 4. Principi di Prodotto

## Mobile First

La piattaforma deve essere progettata principalmente per smartphone.

---

## Personalizzazione

Ogni utente deve visualizzare contenuti e funzionalità coerenti con il proprio ruolo.

---

## Semplicità

Le operazioni principali devono richiedere il minor numero possibile di passaggi.

---

## Gamification

La piattaforma deve incentivare la partecipazione tramite:

- Punti.
- Badge.
- Missioni.
- Classifiche.

---

## Performance

L'applicazione deve risultare fluida anche su dispositivi di fascia media.

---

## Scalabilità

Ogni funzionalità deve essere progettata considerando future competizioni ed espansioni.

---

# 5. Architettura Generale

## Core Modules

### Authentication

Gestione registrazione e accesso utenti.

### Profiles

Gestione profili utente.

### Roles & Permissions

Gestione ruoli e autorizzazioni.

### Notifications

Sistema notifiche.

---

## Competition Modules

### Schools

Gestione scuole.

### Teams

Gestione squadre.

### Competitions

Gestione competizioni.

### Matches

Gestione partite.

### Standings

Gestione classifiche.

### Match Events

Gestione eventi partita.

---

## Community Modules

### Ranking

Classifiche utenti e scuole.

### Missions

Missioni e attività.

### Points

Sistema punti.

### Badges

Sistema badge e achievement.

---

## Staff Modules

### Staff Roles

Ruoli operativi.

### Shifts

Turni.

### Assignments

Assegnazione attività.

### Check-In

Presenze.

### Operations Dashboard

Dashboard organizzativa.

---

# 6. MVP

## Inclusioni

### Authentication

- Login Google.
- Login Email.
- Gestione sessione.

### Profiles

- Profilo utente.
- Profilo scuola.

### Competition

- Calendario.
- Partite.
- Squadre.
- Classifiche.

### Staff

- Turni.
- Assegnazioni.
- Check-in.
- Dashboard staff.

### Community

- Sistema punti.
- Classifiche base.

### Notifications

- Notifiche in-app.

---

## Esclusioni

### Fase Successiva

- Fanta Leonessa.
- Reward Store.
- Ticketing proprietario.
- AI Assistant.
- Sponsor avanzati.
- Coupon.
- Marketplace premi.
- Analytics avanzate.

---

# 7. Stack Tecnologico

## Frontend

- Next.js
- TypeScript
- CSS Modules
- Framer Motion

---

## Backend

- Next.js Route Handlers
- Server Actions

---

## Database

- PostgreSQL
- Prisma ORM

---

## Authentication

- Auth.js

---

## Storage

- Cloudinary

---

## Mobile

- Capacitor

---

## Deploy

### Frontend

- Vercel

### Database

- DigitalOcean Managed PostgreSQL

---

# 8. Obiettivi MVP

## Organizzazione

- Ridurre la dipendenza da WhatsApp.
- Centralizzare informazioni operative.
- Migliorare la gestione dello staff.

---

## Community

- Fornire un punto unico di accesso alle informazioni.
- Incrementare la partecipazione.
- Iniziare a costruire il sistema di appartenenza.

---

## Tecnici

- Costruire fondamenta solide.
- Definire architettura scalabile.
- Validare il prodotto con utenti reali.

---

# 9. Roadmap

## Versione 1.0

- Authentication.
- Profiles.
- Schools.
- Teams.
- Competitions.
- Matches.
- Staff.
- Points.
- Notifications.

---

## Versione 1.5

- Missioni.
- Badge.
- Ranking scuole.
- Gamification avanzata.

---

## Versione 2.0

- Fanta Leonessa.
- Statistiche avanzate.
- Coinvolgimento community.

---

## Versione 3.0

- Sponsor.
- Coupon.
- Challenge.
- Reward Store.

---

## Versione 4.0

- AI Assistant.
- Ecosistema eventi completo.
- Espansione multi-competizione.

---