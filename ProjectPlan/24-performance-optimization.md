# 15-performance-optimization.md

## Obiettivo

Ridurre la latenza percepita dell'app Leonessa su Capacitor intervenendo sui colli di bottiglia individuati dall'audit.

---

# FASE 1 — Quick Wins (Priorità Alta)

## 1. Sostituire tutti i link HTML interni

Cercare tutti i casi:

```tsx
<a href="/...">
```

e sostituirli con:

```tsx
import Link from "next/link";

<Link href="/...">
```

### Obiettivi

- evitare full page reload;
- mantenere cache React e TanStack Query;
- migliorare la fluidità della navigazione;
- sfruttare il prefetch automatico di Next.js.

---

## 2. Rimuovere il delay artificiale della Ranking

Rimuovere completamente:

```ts
const MOCK_LOADING_DELAY = 400;
```

e qualsiasi:

```ts
setTimeout(...)
```

utilizzato solamente per simulare il caricamento.

Lo skeleton deve apparire solo quando esiste una richiesta reale.

---

# FASE 2 — Ottimizzazione Team Page (Priorità Alta)

## Problema attuale

Flusso:

```text
Page
↓
Auth
↓
Hydration
↓
API Call
↓
Auth
↓
Prisma
```

## Obiettivo

Convertire in:

```text
Page
↓
Auth
↓
Prisma
↓
Render
```

## Implementazione

- recuperare i dati Team direttamente nel Server Component;
- passare i dati iniziali al Client Component;
- usare TanStack Query solo per aggiornamenti successivi;
- eliminare autenticazioni duplicate;
- eliminare chiamate API inutili al primo caricamento.

---

# FASE 3 — Ottimizzazione Ranking (Priorità Alta)

## Problema

Viene scaricato l'intero ranking anche quando vengono mostrati solo pochi elementi.

## Implementazione

Per Dashboard:

```ts
findMany({
  take: 5,
});
```

Creare query separate per:

- Top Ranking;
- Posizione utente;
- Classifica completa.

Non caricare centinaia di record per ottenere una sola posizione.

---

# FASE 4 — Prefetch delle schermate principali

Prefetch automatico per:

- Ranking
- Profile
- Team

quando l'utente si trova nella Dashboard.

Esempio:

```tsx
router.prefetch("/ranking");
router.prefetch("/profile");
```

Obiettivo:

ridurre il tempo percepito della prima apertura.

---

# FASE 5 — Standardizzazione TanStack Query

Configurazione globale consigliata:

```ts
staleTime: 5 * 60 * 1000;
gcTime: 30 * 60 * 1000;
refetchOnWindowFocus: false;
```

Obiettivi:

- evitare richieste duplicate;
- sfruttare la cache tra le pagine;
- ridurre le attese percepite.

---

# FASE 6 — Riduzione Payload Prisma

Sostituire dove possibile:

```ts
include: true;
```

con:

```ts
select: {
  ...
}
```

Recuperare solo i campi realmente mostrati nella UI.

Obiettivi:

- payload più piccoli;
- meno dati serializzati;
- rendering più rapido su Android.

---

# FASE 7 — Misurazione Finale

Misurare prima e dopo:

- apertura Dashboard;
- Dashboard → Ranking;
- Dashboard → Team;
- Dashboard → Profile;
- cold start;
- warm start.

Generare un report con:

- tempo iniziale;
- tempo finale;
- miglioramento percentuale.

---

# Regole

- Non modificare il design.
- Non modificare la UX.
- Non introdurre nuove funzionalità.
- Non modificare LP, ranking o candidature.
- Concentrarsi esclusivamente sulle prestazioni.
- Documentare ogni intervento effettuato.