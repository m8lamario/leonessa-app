# 19 - Shared Components & Global Layout Refactor

---

# Obiettivo

Risolvere un problema architetturale emerso durante lo sviluppo.

Attualmente alcuni elementi UI fondamentali, come la Bottom Navigation, sono implementati direttamente nelle singole pagine.

Questo approccio genera:

- duplicazione del codice
- manutenzione complessa
- rischio di inconsistenze
- difficoltà nei futuri redesign

L'obiettivo è centralizzare tutti i componenti condivisi e utilizzare correttamente il sistema di Layout di Next.js App Router.

---

# Problema Attuale

Situazione attuale:

```text
Home Page
 └─ Bottom Navigation

Ranking Page
 └─ Bottom Navigation

Profile Page
 └─ Bottom Navigation

Fanta Page
 └─ Bottom Navigation
```

Ogni pagina mantiene una propria copia della navigazione.

Quando viene modificata una pagina:

- le altre rimangono indietro
- le modifiche non sono globali

---

# Obiettivo Finale

La Bottom Navigation deve esistere una sola volta.

Architettura desiderata:

```text
App Layout

├─ Page Content
│
└─ Bottom Navigation
```

Ogni pagina eredita automaticamente la navigazione.

---

# Refactor Layout

Utilizzare il sistema nativo:

```text
Next.js App Router Layout
```

---

# Creare

```text
src/app/(authenticated)/layout.tsx
```

Responsabilità:

- renderizzare il contenuto della pagina
- renderizzare la Bottom Navigation
- gestire il layout comune

---

# Struttura Obiettivo

```text
src/

├─ app/
│
├─ features/
│
├─ shared/
│
└─ styles/
```

---

# Shared Components

Creare:

```text
src/shared/components
```

---

# Struttura

```text
shared/

components/

├─ navigation/
├─ layout/
├─ ui/
├─ feedback/
└─ common/
```

---

# Navigation

```text
navigation/

├─ BottomNavigation/
│
├─ BottomNavigation.tsx
├─ BottomNavigation.module.css
├─ BottomNavigationItem.tsx
├─ navigation.config.ts
└─ index.ts
```

---

# Responsabilità

La Bottom Navigation deve:

- conoscere le route
- conoscere le icone
- conoscere gli stati attivi
- gestire l'haptic feedback
- supportare badge futuri

---

# Config Centralizzata

Creare:

```text
navigation.config.ts
```

---

# Esempio

```ts
[
  {
    label: "Home",
    href: "/"
  },
  {
    label: "Fanta",
    href: "/fanta"
  },
  {
    label: "Ranking",
    href: "/ranking"
  },
  {
    label: "Profilo",
    href: "/profile"
  }
]
```

---

# Vantaggi

Aggiungere una nuova voce richiederà una sola modifica.

---

# UI Components

Creare una libreria condivisa.

---

# Cartella

```text
shared/components/ui
```

---

# Componenti Iniziali

```text
Button
Card
Badge
Avatar
Modal
Input
Textarea
Skeleton
```

---

# Regola

Ogni componente deve avere:

```text
Component.tsx
Component.module.css
index.ts
```

---

# Layout Components

Creare:

```text
shared/components/layout
```

---

# Componenti

```text
PageContainer
PageHeader
Section
ScreenLayout
```

---

# Obiettivo

Uniformare tutte le pagine.

---

# Feedback Components

Creare:

```text
shared/components/feedback
```

---

# Componenti

```text
LoadingState
ErrorState
EmptyState
SkeletonState
```

---

# Common Components

Creare:

```text
shared/components/common
```

---

# Componenti

```text
Logo
SchoolBadge
RoleBadge
LevelBadge
```

---

# Page Container Standard

Creare:

```text
PageContainer
```

Utilizzato da:

- Home
- Fanta
- Ranking
- Profilo

---

# Responsabilità

Gestire automaticamente:

- padding top
- padding bottom
- safe area
- spacing globale

---

# Safe Area

Supportare:

```css
env(safe-area-inset-top)
env(safe-area-inset-bottom)
```

---

# Bottom Navigation Spacing

Il PageContainer deve calcolare automaticamente lo spazio necessario.

Le pagine NON devono più aggiungere:

```css
padding-bottom
```

manualmente.

---

# Regola Fondamentale

Le pagine devono contenere esclusivamente:

```text
Business Logic

+
Page Content
```

---

# NON Devono Contenere

- Bottom Navigation
- Layout globale
- Safe Area
- Spacing di sistema
- Componenti duplicati

---

# Verifica Finale

Dopo il refactor:

✅ una sola Bottom Navigation

✅ layout condiviso

✅ component library centralizzata

✅ spacing uniforme

✅ manutenzione semplificata

✅ base pronta per crescita futura

---

# Deliverable

Refactor completo dell'architettura UI senza modificare funzionalità esistenti.

L'obiettivo è ottenere una foundation professionale e scalabile prima di proseguire con Fanta, Ranking e nuove funzionalità.