# 25-fanta-foundation.md

## Obiettivo

Preparare tutte le fondamenta tecniche del sistema **Fanta Leonessa** senza implementare ancora:

- punteggi
- mercato
- classifiche
- valori dinamici
- sincronizzazione risultati

Al termine di questo piano dovrà esistere una sezione Fanta completamente integrata nell'app e pronta per le funzionalità successive.

---

# Obiettivi del piano

Implementare:

```text
✅ Sezione Fanta nell'app
✅ Route protetta /fanta
✅ Architettura dedicata
✅ Modelli Prisma iniziali
✅ API base
✅ Dashboard placeholder
✅ Verifica squadra esistente
```

Non implementare:

```text
❌ Calcolo punteggi
❌ Mercato
❌ Classifiche
❌ LP dinamici
❌ Profili giocatore
❌ Scambi
```

---

# Routing

Creare:

```text
/app/(authenticated)/fanta/page.tsx
```

La pagina deve essere accessibile solamente agli utenti autenticati.

Utilizzare lo stesso sistema già adottato per:

```text
/dashboard
/profile
/ranking
```

---

# Bottom Navigation

Sostituisci la voce cup con:

```text
⚽ Fanta
```

nel Bottom Navigation.

Posizionamento consigliato:

```text
Home
Fanta
Ranking
Profilo
```

La sezione Fanta diventa una feature principale dell'app.

---

# Architettura Feature-Based

Creare:

```text
src/features/fanta/
```

Struttura:

```text
src/features/fanta
├── components
├── hooks
├── server
├── lib
├── types
├── constants
└── actions
```

Seguire la stessa organizzazione delle altre feature già presenti.

---

# Schema Prisma

## FantasyTeam

Una squadra fantasy per utente.

```prisma
model FantasyTeam {
  id           String   @id @default(cuid())
  userId       String   @unique

  name         String

  budgetLp     Int      @default(500)
  totalPoints  Int      @default(0)

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user         User @relation(...)
  players      FantasyTeamPlayer[]
}
```

---

## FantasyTeamPlayer

Associazione tra squadra fantasy e giocatore.

```prisma
model FantasyTeamPlayer {
  id             String @id @default(cuid())

  fantasyTeamId  String
  playerId       String

  role           String

  isCaptain      Boolean @default(false)

  createdAt      DateTime @default(now())

  fantasyTeam FantasyTeam @relation(...)
}
```

Nota:

Il modello sarà ampliato nei piani successivi.

---

# Service Layer

Creare:

```text
src/features/fanta/server/fanta-service.ts
```

Funzioni iniziali:

```ts
getFantasyTeamByUserId()

hasFantasyTeam()

createFantasyTeam()
```

Nessuna logica di mercato.

Nessun punteggio.

---

# API

Creare:

```text
/api/fanta/team
```

Metodi:

```text
GET
```

Restituisce:

```json
{
  "hasTeam": true,
  "team": {}
}
```

oppure

```json
{
  "hasTeam": false
}
```

---

# Dashboard Placeholder

## Caso 1

Utente senza squadra.

Mostrare:

```text
⚽ Fanta Leonessa

Non hai ancora creato una squadra fantasy.

[Crea la tua squadra]
```

Questo pulsante verrà collegato al Piano 18.

---

## Caso 2

Utente con squadra.

Mostrare:

```text
Nome squadra
Budget LP
Punti totali
Numero giocatori
```

Layout semplice.

Nessuna grafica definitiva.

---

# Tipizzazioni

Creare:

```text
src/features/fanta/types/fanta.ts
```

Tipi iniziali:

```ts
FantasyTeam
FantasyTeamPlayer
FantasyRole
```

Preparare il terreno per i piani successivi.

---

# Costanti

Creare:

```text
src/features/fanta/constants/fanta.ts
```

Valori iniziali:

```ts
INITIAL_BUDGET = 500;
TEAM_SIZE = 11;
CAPTAIN_MULTIPLIER = 1.5;
```

Anche se non verranno ancora utilizzati.

---

# Obiettivo finale del piano

Alla conclusione del Piano 17:

```text
✅ Esiste la sezione Fanta
✅ Esiste il database base
✅ Esistono API e servizi
✅ Esiste il collegamento nel Bottom Nav
✅ L'app sa distinguere chi ha una squadra e chi no
✅ Tutto è pronto per il Piano 18 (Team Builder)
```

**Nessuna logica fantasy avanzata deve essere implementata in questa fase.** Solo fondamenta solide e pulite.