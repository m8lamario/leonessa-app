IMPLEMENTAZIONE — LEONESSA LP ECONOMY & REWARDS

Obiettivo:
Creare un sistema economico completo e flessibile per gli LP di Leonessa, separando chiaramente:
1. valuta/saldo LP
2. fonti di guadagno LP
3. catalogo premi
4. configurazione economica
5. gestione amministrativa dal Control Center

IMPORTANTE:
Prima di modificare codice, analizza l'architettura attuale, ProjectPlan, schema Prisma, PointTransaction, sistema referral, Control Center e tutte le API/server actions già esistenti. Riusa ciò che esiste e non creare sistemi duplicati.

FASE 1 — AUDIT
- Individua come viene attualmente calcolato e persistito il saldo LP.
- Analizza PointTransaction e tutti i punti che assegnano/spendono LP.
- Individua eventuali valori hardcoded.
- Analizza referral e altre future fonti di LP.
- Analizza struttura e convenzioni del Control Center.
- Verifica auth, autorizzazioni admin e pattern API/server actions.
- Prima di implementare, evidenzia eventuali conflitti con l'architettura esistente.

FASE 2 — LP ECONOMY CORE
Mantieni un'unica fonte di verità per le variazioni del saldo.

Ogni movimento LP deve essere una transazione tracciabile, idempotente e auditabile.

Le fonti devono essere identificabili, ad esempio:
- referral
- missioni
- check-in/eventi
- achievement
- Fanta
- iniziative future

NON hardcodare i valori economici nelle singole feature.

Crea un sistema centralizzato per configurare le ricompense:
- tipo di attività
- LP assegnati
- stato attivo/disattivo
- eventuali limiti/condizioni
- eventuali limiti temporali

I valori devono poter cambiare senza modificare il codice delle singole feature.

FASE 3 — CONFIGURAZIONE ECONOMICA
Progetta la configurazione in modo che sia estendibile.

Non assumere valori definitivi per:
- ricompense
- costo premi
- limiti
- quantità disponibili

Questi valori devono essere configurabili.

Se è più coerente con l'architettura attuale, utilizzare il database invece di semplici env variables, soprattutto per permettere la gestione dal Control Center.

Prevedere:
- valore corrente
- enabled/disabled
- aggiornamento admin
- timestamp
- admin che ha effettuato la modifica
- storico delle modifiche

FASE 4 — REWARDS / PREMI
Creare un catalogo premi indipendente dal sistema che genera LP.

Ogni premio deve poter avere almeno:
- nome
- descrizione
- categoria
- costo in LP
- immagine/media opzionale
- disponibilità/stock opzionale
- stato attivo/inattivo
- eventuali condizioni
- eventuale limite per utente
- ordine/priorità di visualizzazione

Prevedere categorie estendibili, ad esempio:
- merchandising
- sconti partner
- premi digitali
- esperienze
- accessi/eventi
- altre categorie future

NON fissare categorie o valori come definitivi se il progetto possiede già un sistema equivalente: riusarlo.

FASE 5 — RISCATTO PREMIO
Implementare un flusso sicuro:

Utente:
1. visualizza premio
2. vede costo LP
3. vede eventuali condizioni
4. conferma il riscatto
5. il sistema verifica nuovamente lato server:
    - autenticazione
    - LP disponibili
    - premio attivo
    - disponibilità
    - eventuali limiti
6. crea il riscatto
7. registra la transazione LP negativa
8. aggiorna lo stock, se applicabile

Il saldo NON deve essere modificabile direttamente dalla UI.

Il riscatto deve essere atomico e idempotente per evitare:
- doppio acquisto
- doppia sottrazione LP
- race condition
- stock negativo

FASE 6 — STORICO
Creare/riusare uno storico completo:

Per gli LP:
- entrata/uscita
- quantità
- motivo/source
- riferimento all'evento che l'ha generata
- timestamp
- eventuale metadata

Per i premi:
- utente
- premio
- costo
- stato
- timestamp
- eventuale codice/claim/redeem reference

Prevedere stati utili per il ciclo di vita del premio, senza complicare inutilmente il modello.

FASE 7 — CONTROL CENTER
Aggiungere una sezione Economy/Rewards al Control Center.

L'admin deve poter:

ECONOMY
- vedere le fonti di LP
- modificare le ricompense
- attivare/disattivare una fonte
- vedere configurazione corrente
- vedere storico modifiche

REWARDS
- creare premio
- modificare premio
- modificare costo LP
- modificare stock
- attivare/disattivare
- modificare categoria
- gestire eventuali condizioni
- visualizzare i riscatti

Ogni modifica amministrativa deve essere autorizzata e tracciata.

FASE 8 — UI UTENTE
Creare/integrare una sezione Premi raggiungibile da Altro/Leonessa Pass secondo la navigazione già esistente.

UI:
- mobile-first
- coerente con il design system esistente
- card premio curate
- costo LP ben visibile
- stato disponibilità
- CTA chiara
- conferma riscatto tramite modal/flow appropriato
- feedback di successo/errore
- stato premio esaurito/inattivo

Il saldo LP rimane nella top navigation e NON deve essere duplicato nella Dashboard.

VIETATO utilizzare emoji nella UI.
Utilizzare esclusivamente icone professionali dalla libreria di icone già presente nel progetto.
NON installare una nuova icon library senza necessità.

FASE 9 — ARCHITETTURA
Organizzare il codice seguendo le convenzioni già presenti (`src/features/*`, server/client separation, ecc.).

Separare chiaramente:
- economy
- rewards
- transactions
- admin configuration

Non duplicare:
- calcolo saldo
- PointTransaction
- autenticazione
- componenti UI
- logiche di autorizzazione

Le feature future devono poter chiamare un servizio centralizzato del tipo:

awardLP(...)
spendLP(...)
getLPBalance(...)
getRewardConfig(...)

senza conoscere i dettagli della persistenza.

FASE 10 — DATABASE
Aggiornare Prisma solo dopo aver verificato i modelli esistenti.

Creare le migration necessarie.

Garantire:
- foreign keys corrette
- unique constraints dove necessarie
- indici sulle query frequenti
- transazioni DB atomiche
- idempotency keys
- audit trail

Non creare colonne/modelli duplicati rispetto a quelli già presenti.

FASE 11 — TEST
Aggiungere test per:

LP:
- accredito
- spesa
- saldo
- idempotenza
- transazioni concorrenti
- source/config disabilitata

Rewards:
- creazione/modifica
- premio inattivo
- premio esaurito
- LP insufficienti
- acquisto valido
- doppio acquisto
- race condition
- limite per utente

Admin:
- accesso non autorizzato
- modifica configurazione
- audit log

Eseguire:
- test
- typecheck
- lint
- build

FASE 12 — SEED / DEVELOPMENT
Creare solo dati seed/dev chiaramente identificabili.

NON scegliere valori economici come decisioni di prodotto.
Se servono dati per testare l'interfaccia, utilizzare valori demo esplicitamente marcati come tali.

CRITERIO FONDAMENTALE:
Il sistema deve permettere di cambiare in futuro:
"quanto guadagno facendo X"
e
"quanto costa il premio Y"

senza dover riscrivere la feature che genera gli LP.

Prima di concludere:
- riepiloga cosa hai trovato nell'architettura esistente
- riepiloga i modelli creati/modificati
- riepiloga le API/server actions
- riepiloga le modifiche al Control Center
- indica eventuali decisioni che richiedono una scelta di prodotto
- verifica test, typecheck, lint e build
- aggiorna ProjectPlan con quanto effettivamente implementato

---

## STATO IMPLEMENTAZIONE (Completato)

### 1. Architettura & Schema Prisma
- Modelli aggiunti:
  - `Reward`: catalogo premi con `id`, `name`, `description`, `category`, `costLp`, `imageUrl`, `stock`, `active`, `conditions`, `maxPerUser`, `displayOrder`, `deletedAt`.
  - `RewardRedemption`: tracciamento atomico del riscatto con `userId`, `rewardId`, `costLp`, `status`, `code`, `idempotencyKey`, `metadata`.
  - `EconomyRewardConfig`: configurazione dinamica per sorgenti di guadagno LP (`key`, `title`, `description`, `category`, `rewardLp`, `enabled`, `conditions`).
  - `EconomyConfigHistory`: audit log storico delle modifiche alle configurazioni con `actorId`, `oldValue`, `newValue`, `oldEnabled`, `newEnabled`, `reason`.
- Enum aggiornati:
  - `PointSourceType`: aggiunto `REWARD_REDEMPTION`.
  - `AuditAction`: aggiunti `REWARD_REDEMPTION`, `ECONOMY_CONFIG_UPDATE`.
  - `RewardRedemptionStatus`: `PENDING`, `COMPLETED`, `CANCELLED`.
- Migration: `20260904151000_add_lp_economy_rewards`.

### 2. Core Service LP Economy & Rewards
- `src/features/rewards/server/reward-engine.ts`:
  - `spendLP` & `spendLPInTransaction`: spesa LP atomica, serializable, con decremento saldo `UserLPBalance`, verifica capienza e idempotenza tramite `PointTransaction` negativa.
  - `getLPBalance`: lettura saldo LP unificata.
- `src/features/rewards/server/economy-config-service.ts`:
  - `getRewardConfig`: risoluzione dinamica DB con fallback trasparente su `DEFAULT_REWARD_CONFIGS`.
  - `getAllRewardConfigs`: elenco configurazioni sorgenti LP.
  - `updateRewardConfig`: aggiornamento configurazione con audit trail in `EconomyConfigHistory` e `AuditLog`.
- `src/features/rewards/server/reward-catalog-service.ts`:
  - `getUserRewardCatalog`: catalogo arricchito con controlli di affondabilità, stock e limiti per utente.
  - `redeemReward`: riscatto atomico con generazione codice claim univoco `LEO-XXXX-XXXX`, spesa LP e decremento stock concorrente protetto.
  - CRUD premi: `createReward`, `updateReward`, `deleteReward`.

### 3. API & Endpoints
- Utente:
  - `GET /api/rewards`: catalogo premi per l'utente loggato con saldo e stati di riscatto.
  - `POST /api/rewards/[id]/redeem`: riscatto sicuro con idempotenza opzionale.
  - `GET /api/rewards/redemptions`: elenco riscatti effettuati dall'utente con relativi codici claim.
- Admin:
  - `GET /api/admin/economy/configs` & `POST`: lettura e aggiornamento parametri LP ed enabled/disabled.
  - `GET /api/admin/economy/rewards` & `POST`: lettura e creazione premi.
  - `GET /api/admin/economy/rewards/[id]`, `PATCH`, `DELETE`: gestione premio singolo.
  - `GET /api/admin/economy/redemptions`: storico di tutti i riscatti per audit admin.

### 4. Control Center & UI
- Control Center (`/admin/economy`):
  - Tab "Fonti LP & Valori": gestione dinamica valori, stato attivo/disattivo, motivazione audit.
  - Tab "Catalogo Premi": creazione/modifica premi, categorie, stock, limiti, condizioni speciali.
  - Tab "Riscatti": tabella riepilogativa dei riscatti con claim code e stato.
  - Tab "Audit & Modifiche": storico delle modifiche apportate dagli admin.
  - Link diretto aggiunto nel header del Fanta Control Center (`/admin/fanta`).
- UI Utente (`/altro/premi`):
  - Visualizzazione saldo LP aggiornato, card premio con categorie, costo LP e stock.
  - Modal di conferma riscatto e feedback di successo con claim code per il ritiro.
  - Tab per consultare lo storico dei propri premi riscattati.
  - Nessuna emoji utilizzata nella UI (utilizzate icone Lucide).
