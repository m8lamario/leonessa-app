# Navigation, Profile & More Hub

## Obiettivo

Riorganizzare la navigazione principale dell'app separando chiaramente:

- navigazione principale;
- profilo personale;
- gamification e servizi;
- partner e vantaggi.

Non modificare le funzionalità esistenti non coinvolte.

---

## 1. Bottom Navigation

Passare da:

Home | Fanta | Ranking | Profilo

a:

Home | Fanta | Ranking | Altro

Il Profilo NON deve più essere una voce della bottom navigation.

Mantenere la bottom nav:
- mobile-first;
- sticky/fixed;
- compatibile con Capacitor e safe-area;
- coerente con il design esistente.

Le icone devono utilizzare la libreria di icone già presente nel progetto, senza introdurre nuove librerie.

---

## 2. Top Navigation

Mantenere nel top nav:

- logo Leonessa;
- notifiche;
- avatar utente.

Il tap sull'avatar deve portare al Profilo.

Il top nav deve rimanere riutilizzabile nelle pagine dell'app come già definito.

---

# 3. Profilo

Il Profilo deve diventare la sezione dedicata esclusivamente all'identità dell'utente.

Mostrare:

- avatar;
- nome;
- scuola;
- livello;
- LP;
- statistiche personali principali.

Se disponibili, mostrare anche:

- badge;
- risultati;
- attività personali.

### Sezioni

Profilo

→ Informazioni personali
→ I miei badge
→ Le mie statistiche
→ Impostazioni
→ Notifiche
→ Privacy / account
→ Logout

Non inserire qui Partner, Missioni, Accrediti o Premi: appartengono ad Altro.

---

# 4. Altro

Creare una vera Hub page, non un semplice menu.

Titolo:

ALTRO

La pagina deve essere organizzata tramite card/sezioni.

## Leonessa Pass

Card principale con:

- LP disponibili;
- livello;
- badge principali;
- progressione;
- eventuali vantaggi disponibili.

Esempio:

475 LP
Livello 2
4 badge

---

## Accrediti

Permettere all'utente di:

- scansionare il QR del proprio biglietto/accredito;
- ricevere LP;
- visualizzare gli accrediti già utilizzati.

Prevedere la struttura per future ricompense legate alla partecipazione.

---

## Premi

Mostrare le ricompense disponibili.

Esempi:

- merch;
- omaggi;
- esperienze;
- vantaggi.

Mostrare chiaramente:

- costo in LP;
- disponibilità;
- stato ottenibile/non ottenibile.

La redemption reale può rimanere fuori scope se non ancora implementata.

---

## Partner & Vantaggi

Sezione dedicata ai partner Leonessa.

Ogni partner può mostrare:

- logo;
- nome;
- descrizione;
- offerta;
- eventuale omaggio;
- eventuale sconto;
- condizioni.

Esempi:

Sconto 10%
Omaggio
Coupon
Vantaggio esclusivo

La struttura deve essere predisposta per future integrazioni senza inventare dati che oggi non esistono.

---

## Missioni

Collegare le missioni già presenti.

Mostrare:

- missioni attive;
- progresso;
- ricompensa;
- completate.

Esempi:

Segui una partita
Completa il profilo
Partecipa a una partita
Scansiona un accredito

Non modificare il reward engine esistente.

---

## Badge & Trofei

Mostrare la collezione personale.

Separare:

- ottenuti;
- bloccati;
- progressivi.

Utilizzare le informazioni già presenti nel sistema.

---

## Esplora

Sezione per scoprire contenuti della piattaforma:

- scuole;
- squadre;
- giocatori;
- partite;
- classifiche;
- partner.

Utilizzare solo sezioni/funzionalità già disponibili o predisposte.

---

# 5. Informazioni e supporto

In fondo alla pagina Altro:

- Regolamento;
- FAQ;
- Assistenza;
- Contatti;
- Informazioni Leonessa.

Le impostazioni dell'account rimangono invece nel Profilo.

---

# 6. Gerarchia

La struttura finale deve essere:

BOTTOM NAV

Home
Fanta
Ranking
Altro


TOP NAV

Logo
Notifiche
Avatar → Profilo


ALTRO

Leonessa Pass
├── Accrediti
├── Premi
├── Partner & Vantaggi
├── Missioni
├── Badge & Trofei
└── Esplora

Supporto
├── Regolamento
├── FAQ
├── Assistenza
└── Contatti


PROFILO

Identità
├── Informazioni personali
├── Statistiche
├── Badge
├── Notifiche
├── Impostazioni
├── Privacy
└── Logout

---

# 7. UX

Altro deve sembrare una destinazione vera dell'app, non un contenitore di link.

Utilizzare:

- card;
- icone;
- gerarchia visiva;
- stato/progresso;
- microinterazioni leggere.

Dare maggiore rilevanza a:

1. Leonessa Pass
2. Accrediti
3. Premi
4. Partner
5. Missioni
6. Badge
7. Esplora

Non creare una pagina eccessivamente lunga: utilizzare una griglia/card layout dove appropriato.

---

# 8. Dati mancanti

Non inventare contenuti reali.

Quando una funzionalità non ha ancora dati backend:

- predisporre la UI;
- mostrare empty state appropriati;
- non usare dati falsi presentati come reali.

La struttura deve essere pronta per essere collegata ai sistemi futuri.

---

# 9. Compatibilità

Mantenere:

- design system esistente;
- CSS Modules;
- componenti condivisi;
- responsive mobile-first;
- Capacitor;
- safe-area;
- accessibilità.

Riutilizzare componenti esistenti quando possibile.

Non duplicare top nav o bottom nav nelle singole pagine.

---

# 10. Criteri di completamento

- Profilo rimosso dalla bottom nav.
- Bottom nav = Home / Fanta / Ranking / Altro.
- Avatar apre il Profilo.
- Top nav condiviso.
- Altro implementato come Hub.
- Leonessa Pass presente.
- Accrediti predisposti.
- Premi predisposti.
- Partner & Vantaggi predisposto.
- Missioni collegate.
- Badge collegati.
- Esplora predisposto.
- Supporto presente.
- Profilo separato dalle funzionalità gamification.
- Nessun dato inventato.
- Nessuna regressione nelle sezioni esistenti.
- Responsive mobile.
- Capacitor safe-area corretta.

Eseguire:

npm run typecheck
npm run lint
npm run test
npm run build