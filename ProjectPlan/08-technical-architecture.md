\# Leonessa App

\## Technical Architecture v1.0



\---



\# 1. Obiettivo



Definire l'architettura tecnica della piattaforma Leonessa App.



L'architettura deve essere:



\- Scalabile

\- Manutenibile

\- Performante

\- Economica

\- Facilmente espandibile



\---



\# 2. Principi Architetturali



\## Mobile First



L'app viene progettata prima per smartphone.



Successivamente viene adattata per tablet e desktop.



\---



\## API First



Ogni funzionalità deve essere accessibile tramite API.



Questo permetterà in futuro:



\- App native

\- Dashboard amministrative

\- Integrazioni esterne

\- AI Assistant



\---



\## Modularità



Ogni modulo deve essere indipendente.



Esempio:



```text

Auth

Community

Staff

Tournament

Rewards

```



possono evolvere separatamente.



\---



\## Scalabilità Progressiva



Non costruire infrastrutture enterprise inutili.



L'obiettivo è:



```text

Partire semplice

Scalare quando necessario

```



\---



\# 3. Stack Tecnologico



\## Frontend



\### Framework



```text

Next.js 15

```



\---



\### Linguaggio



```text

TypeScript

```



\---



\### Styling



```text

CSS Modules

```



\---



\### Animazioni



```text

Framer Motion

```



\---



\### Component Library



Custom Design System



Nessuna libreria UI pesante.



\---



\# 4. Mobile App



\## Tecnologia



```text

Capacitor

```



\---



\## Motivazione



Permette di:



\- riutilizzare Next.js

\- pubblicare su Play Store

\- pubblicare su App Store

\- mantenere un unico codice



\---



\## Accesso Funzionalità Native



Capacitor verrà utilizzato per:



\- Push Notification

\- Camera

\- QR Scanner

\- Deep Linking

\- Storage locale



\---



\# 5. Backend



\## Framework



```text

Next.js Route Handlers

```



\---



\## Motivazione



Permette di:



\- mantenere un monorepo

\- ridurre complessità

\- sviluppare più velocemente



\---



\## Organizzazione



```text

/app/api

```



\---



\### Esempio



```text

/api/auth

/api/users

/api/schools

/api/teams

/api/matches

/api/community

/api/staff

/api/rewards

```



\---



\# 6. Database



\## Database Principale



```text

PostgreSQL

```



\---



\## Provider



```text

DigitalOcean Managed PostgreSQL

```



\---



\## ORM



```text

Prisma

```



\---



\## Motivazione



\- Ottima integrazione con Next.js

\- Migrazioni semplici

\- Type safety

\- Sviluppo rapido



\---



\# 7. Autenticazione



\## Libreria



```text

Auth.js

```



\---



\## Login Supportati



\### Google



Principale.



\---



\### Email + Password



Secondario.



\---



\## Sessioni



```text

JWT

```



\---



\## Ruoli



Gestiti nel database.



\---



\# 8. Storage



\## File Upload



```text

Cloudinary

```



\---



\## Contenuti



\- Avatar

\- Loghi scuole

\- Immagini eventi

\- Media community



\---



\# 9. Hosting



\## Frontend



```text

Vercel

```



\---



\## Motivazione



\- Deploy immediato

\- Ottima integrazione Next.js

\- CDN globale



\---



\## Database



```text

DigitalOcean

```



\---



\# 10. Architettura Applicativa



```text

Client

&#x20;   ↓

Next.js Frontend

&#x20;   ↓

Server Actions

&#x20;   ↓

Route Handlers

&#x20;   ↓

Prisma

&#x20;   ↓

PostgreSQL

```



\---



\# 11. Architettura Modulare



\## Auth Module



Responsabilità:



\- Login

\- Registrazione

\- Sessioni

\- Permessi



\---



\## Tournament Module



Responsabilità:



\- Competizioni

\- Match

\- Classifiche

\- Eventi partita



\---



\## Staff Module



Responsabilità:



\- Turni

\- Presenze

\- Check-in

\- Missioni staff



\---



\## Community Module



Responsabilità:



\- Badge

\- Ranking

\- Missioni

\- Activity Feed



\---



\## Rewards Module



Responsabilità:



\- LP

\- SP

\- Reward Store



\---



\# 12. State Management



\## Server State



Utilizzare:



```text

TanStack Query

```



\---



\## Client State



Utilizzare:



```text

Zustand

```



\---



\## Evitare



```text

Redux

```



Per il momento aggiungerebbe complessità inutile.



\---



\# 13. Cartelle Frontend



```text

src

│

├── app

├── actions

├── components

├── features

├── hooks

├── lib

├── services

├── store

├── types

├── utils

└── styles

```



\---



\# 14. Features Structure



```text

features

│

├── auth

├── profile

├── schools

├── teams

├── competitions

├── matches

├── staff

├── community

├── rewards

└── notifications

```



\---



\# 15. Security



\## Regole



Mai fidarsi del frontend.



\---



\## Validazioni



Tutte lato server.



\---



\## Permessi



Sempre verificati backend.



\---



\## Rate Limiting



Applicare a:



\- Login

\- Registrazione

\- API pubbliche



\---



\# 16. Logging



\## Sistema



```text

Pino

```



\---



\## Tracciamento



\- Errori

\- Login

\- Assegnazioni ruoli

\- Check-in

\- Modifiche risultati



\---



\# 17. Monitoring



\## Error Tracking



```text

Sentry

```



\---



\## Analytics



```text

PostHog

```



\---



\## KPI



Monitorare:



\- Utenti attivi

\- Crash

\- Performance

\- Conversione staff



\---



\# 18. Push Notifications



\## Provider



```text

Firebase Cloud Messaging

```



\---



\## Utilizzi



\- Turni assegnati

\- Partite imminenti

\- Missioni completate

\- Comunicazioni organizzatori



\---



\# 19. QR System



\## Utilizzo



Check-in staff.



\---



\## Flusso



```text

Utente

↓

Scanner QR

↓

Validazione Server

↓

Registrazione Presenza

↓

Assegnazione Punti

```



\---



\# 20. Environment Variables



\## Frontend



```env

NEXT\_PUBLIC\_APP\_URL=

NEXT\_PUBLIC\_CLOUDINARY\_CLOUD\_NAME=

```



\---



\## Backend



```env

DATABASE\_URL=

AUTH\_SECRET=

AUTH\_GOOGLE\_ID=

AUTH\_GOOGLE\_SECRET=

CLOUDINARY\_API\_KEY=

CLOUDINARY\_API\_SECRET=

```



\---



\# 21. CI/CD



\## Repository



```text

GitHub

```



\---



\## Workflow



```text

Push

↓

Lint

↓

Type Check

↓

Build

↓

Deploy

```



\---



\## Branch Strategy



```text

main

develop

feature/\*

```



\---



\# 22. MVP Infrastructure



Servizi necessari:



\- Vercel

\- PostgreSQL

\- Cloudinary

\- Auth.js

\- Sentry

\- PostHog



\---



Costo stimato:



```text

0€ - 30€/mese

```



nelle prime fasi.



\---



\# 23. Scalabilità Futura



Possibili evoluzioni:



\- Ticketing proprietario

\- AI Assistant

\- Fanta Leonessa

\- Live Match Center

\- Multi-competition platform

\- Sponsor Marketplace



\---



\# 24. Architettura Finale



```text

Leonessa App

│

├── Web App (Next.js)

├── Mobile App (Capacitor)

├── API Layer

├── PostgreSQL

├── Auth System

├── Community System

├── Staff System

├── Tournament System

└── Rewards System

```



\---



\# 25. Regola Fondamentale



Ogni scelta tecnica deve rispondere a questa domanda:



```text

Questa soluzione permette di sviluppare più velocemente

senza compromettere la scalabilità futura?

```



Se la risposta è no, probabilmente è una complessità prematura.



\---

