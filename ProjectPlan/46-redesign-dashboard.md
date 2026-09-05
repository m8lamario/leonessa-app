PIANO — DASHBOARD + LEONESSA IDENTITY + SOCIAL + MATCH PREDICTIONS

OBIETTIVO GENERALE

Ristrutturare l'esperienza principale dell'app affinché Leonessa non sembri un semplice portale informativo, ma una piattaforma gamificata in cui l'utente:
- gioca al Fanta
- guadagna LP
- completa attività
- partecipa ai pronostici
- migliora il proprio profilo
- conquista badge/statistiche
- può cercare e confrontarsi con altri utenti

NON trasformare l'app in un social network tradizionale.
Non introdurre reel, video, foto feed o funzionalità social non necessarie.

Il concetto centrale è:

"Il profilo dell'utente è la sua vetrina nella Leonessa."

PRIMA DI IMPLEMENTARE

Analizza:
- ProjectPlan
- struttura attuale Dashboard
- Fanta
- Ranking
- profilo
- Altro / Esplora
- sistema LP / PointTransaction
- sistema Economy/Rewards appena implementato
- sistema Missioni
- badge/achievement esistenti
- API e query esistenti
- modelli Prisma

Riusa tutto ciò che è già presente.
NON creare sistemi paralleli o dati duplicati.

--------------------------------------------------
FASE 1 — NUOVA DASHBOARD
--------------------------------------------------

La Dashboard deve rispondere rapidamente a tre domande:

1. Come sto andando?
2. Cosa posso fare adesso?
3. Cosa sta succedendo nella Leonessa?

Ridurre le informazioni statiche e dare priorità alle azioni.

ORDINE PROPOSTO:

1. STATO PERSONALE

Mostrare una sezione compatta con:
- avatar
- nome
- scuola
- livello/progressione
- posizione nel ranking
- eventuale variazione recente

NON duplicare il saldo LP se già presente nella top navigation.

La top navigation rimane la fonte visiva principale per il saldo LP.

2. FANTA

Il Fanta deve essere una delle CTA principali della Dashboard.

La card deve essere dinamica in base allo stato reale dell'utente.

Esempi:
- formazione incompleta → "Completa la formazione"
- formazione pronta → "La tua formazione è pronta"
- mercato disponibile → evidenziare il mercato
- match imminente → mostrare informazioni rilevanti
- nessuna azione necessaria → mostrare posizione/punteggio Fanta

Utilizzare sempre dati reali.

3. PRONOSTICO MATCH DELLA SETTIMANA

Sostituire il semplice blocco informativo "Match della settimana" con un'interazione.

Mostrare il prossimo match rilevante:

SQUADRA A
vs
SQUADRA B

Domanda:
"Chi vincerà?"

L'utente può scegliere una delle due squadre.

RICOMPENSA:
- pronostico corretto → +5 LP
- pronostico errato → -5 LP

REGOLE:
- un solo pronostico per partita per utente
- il pronostico deve essere modificabile fino al limite temporale definito dal sistema
- dopo il kickoff il pronostico viene congelato
- il risultato deve essere determinato dai dati reali della partita
- LP assegnati automaticamente al termine della partita
- il sistema deve essere idempotente
- non permettere doppie ricompense
- non permettere doppie penalizzazioni

NON hardcodare +5/-5 nella feature se il nuovo sistema Economy permette di configurare la ricompensa.

La fonte di verità deve essere il sistema Economy.

Se il sistema Economy non supporta ancora una configurazione adeguata per questo caso, estenderlo senza creare un sistema LP separato.

Mostrare eventualmente:

"63% dei partecipanti ha scelto XX"

solo se il dato può essere calcolato realmente.

NON mostrare percentuali fake.

4. COSA PUOI FARE OGGI

Creare una sezione dinamica con poche azioni realmente disponibili.

Esempi:
- missione disponibile
- referral
- pronostico
- attività evento
- altra attività realmente disponibile

Non mostrare una lunga lista di funzionalità.

Massimo le azioni più rilevanti in quel momento.

La Dashboard deve diventare contestuale.

5. LA TUA SCUOLA

Mantenere la competizione tra scuole ma in forma compatta.

Mostrare:
- posizione della propria scuola
- punti
- eventuale variazione

CTA:
"Vedi classifica"

Non duplicare la pagina Ranking.

6. NEWS / EVENTI

Mantenerli, ma ridurre la loro priorità rispetto alle sezioni operative.

Mostrare solo gli elementi più rilevanti/recenti.

--------------------------------------------------
FASE 2 — SISTEMA PRONOSTICI
--------------------------------------------------

Implementare il sistema in modo indipendente dalla UI Dashboard.

Creare/riusare un modello che permetta di memorizzare:

- user
- match
- scelta dell'utente
- timestamp
- stato
- eventuale reward transaction
- eventuale risultato finale

Garantire:
- unique user + match
- idempotenza
- validazione server-side
- impossibilità di modificare il pronostico dopo il cutoff
- elaborazione automatica dopo la conclusione del match

Integrare con:
- dati match reali
- PointTransaction
- Economy
- Ranking/Profilo se necessario

NON modificare direttamente il saldo LP.

Usare sempre il sistema centralizzato di transazioni LP.

--------------------------------------------------
FASE 3 — LEONESSA PROFILE / IDENTITY
--------------------------------------------------

Trasformare il profilo utente da semplice pagina account a:

"Vetrina personale nella Leonessa."

Il profilo deve mostrare ciò che l'utente ha costruito nell'app.

SEZIONI POSSIBILI:

IDENTITÀ
- avatar
- nome
- scuola
- eventuale username
- eventuale bio breve, se coerente con il progetto

PROGRESSIONE
- livello
- progressione XP
- LP
- statistiche di progressione

COMPETIZIONE
- posizione Ranking
- punti Fanta
- posizione Fanta
- statistiche rilevanti
- percentuale pronostici corretti

TROFEI
- badge
- achievement
- trofei
- eventuali riconoscimenti speciali

ATTIVITÀ
- missioni completate
- record
- risultati importanti
- attività rilevanti

IMPORTANTE:
Non mostrare statistiche inventate.

Ogni dato deve provenire da una fonte reale.

Se una statistica non esiste ancora nel backend, NON simulare il dato: valutare se implementarla oppure ometterla.

--------------------------------------------------
FASE 4 — RICERCA UTENTI
--------------------------------------------------

Integrare la ricerca utenti nella sezione Esplora, senza trasformare Esplora in una copia del social.

Creare una ricerca del tipo:

"Cerca nella Leonessa"

Permettere di cercare utenti utilizzando i dati realmente disponibili, ad esempio:
- nome
- username

Risultati compatti:

Avatar
Nome
Scuola
Livello
Ranking

Tap → apertura profilo pubblico.

REQUISITI:
- ricerca reale
- query server-side
- gestione loading
- empty state
- error state
- risultati paginati/limitati se necessario
- evitare di caricare tutti gli utenti inutilmente

Privacy:
Mostrare solamente le informazioni che il progetto considera pubbliche.

NON esporre dati personali non necessari.

--------------------------------------------------
FASE 5 — PROFILO PUBBLICO
--------------------------------------------------

Separare concettualmente:

PROFILO PERSONALE
"Chi sono io?"

PROFILO PUBBLICO
"Come mi vedono gli altri nella Leonessa?"

Il profilo pubblico deve essere una vetrina.

Deve valorizzare:
- livello
- ranking
- Fanta
- badge
- achievement
- statistiche
- scuola
- risultati

Non mostrare impostazioni, email, privacy, logout ecc.

Questi rimangono nel profilo/account personale.

--------------------------------------------------
FASE 6 — CONFRONTO TRA UTENTI
--------------------------------------------------

Aggiungere nel profilo pubblico una CTA:

"Confronta"

Il confronto deve permettere di vedere le principali statistiche tra:
- utente corrente
- utente visitato

Esempio:

             TU       MARIO
Livello      18         21
LP           1840      2450
Fanta        #24       #8
Badge        12         18
Pronostici   68%       72%

Utilizzare esclusivamente statistiche reali.

Il confronto deve essere leggibile soprattutto da mobile.

NON creare una nuova infrastruttura di ranking:
utilizzare le stesse fonti del Ranking/Profile.

--------------------------------------------------
FASE 7 — AMICI / FOLLOW
--------------------------------------------------

NON rendere obbligatorio introdurre immediatamente un sistema social completo.

Prima implementare:
- ricerca utenti
- visualizzazione profilo
- confronto

Valutare eventualmente in una fase successiva:
- aggiunta amici
- follow
- lista amici
- confronti tra amici

Non introdurre queste funzionalità se non sono necessarie per la prima versione.

--------------------------------------------------
FASE 8 — EVOLUZIONE DEL MACROSOCIAL
--------------------------------------------------

NON creare:
- Reel
- video
- photo feed
- stories
- contenuti generati dagli utenti complessi

Il "social" di Leonessa deve inizialmente essere basato sull'identità e sulla competizione.

Il loop previsto è:

GIOCA
↓
GUADAGNA LP
↓
COMPLETA MISSIONI
↓
OTTieni BADGE / LIVELLI
↓
MIGLIORA IL FANTA
↓
SALII NEL RANKING
↓
MIGLIORA IL TUO PROFILO
↓
CONFRONTATI CON GLI AMICI
↓
TORNA A GIOCARE

Ogni nuova feature futura dovrebbe poter alimentare il profilo.

Esempi:
- nuovo achievement → badge sul profilo
- nuovo torneo → nuova statistica
- missione speciale → achievement
- Fanta → statistiche
- pronostici → percentuale/record
- evento → badge
- referral → eventuale achievement

Il profilo diventa quindi una rappresentazione persistente della storia dell'utente nella Leonessa.

--------------------------------------------------
FASE 9 — RANKING
--------------------------------------------------

Il Ranking deve rimanere separato dal Profilo.

RANKING:
"Quanto sono forte rispetto agli altri?"

PROFILO:
"Chi sono nella Leonessa?"

Il Ranking deve utilizzare esclusivamente dati reali.

Controllare in particolare:
- posizione
- LP
- punti
- progressione
- statistiche
- eventuali valori mostrati nella preview dell'utente

Eliminare definitivamente eventuali mock data presenti.

--------------------------------------------------
FASE 10 — ARCHITETTURA DATI
--------------------------------------------------

Non duplicare dati già esistenti.

Prima verificare:
- User
- PointTransaction
- Economy
- Rewards
- Fanta
- Match
- Mission
- Badge/Achievement
- Ranking

Utilizzare relazioni/query esistenti quando possibile.

Le nuove feature devono essere costruite sopra queste fonti.

Il saldo LP deve continuare a essere gestito centralmente.

Le ricompense dei pronostici devono passare dal sistema Economy/PointTransaction.

--------------------------------------------------
FASE 11 — UI / UX
--------------------------------------------------

Mobile-first.

La Dashboard deve essere:
- semplice
- gerarchica
- non dispersiva
- orientata all'azione

NON inserire troppe card solo per riempire lo spazio.

Ogni elemento deve avere una funzione.

Usare il design system esistente.

VIETATO usare emoji nella UI.

Utilizzare esclusivamente icone professionali dalla libreria già presente nel progetto.

NON installare una nuova icon library senza necessità.

Mantenere:
- safe-area
- Capacitor
- responsive
- accessibilità
- reduced motion dove appropriato

--------------------------------------------------
FASE 12 — TEST
--------------------------------------------------

Aggiungere test per:

PRONOSTICI
- creazione
- modifica prima del cutoff
- blocco dopo cutoff
- risultato corretto
- risultato errato
- +5 LP
- -5 LP
- idempotenza
- doppio processing
- match non concluso

PROFILO
- dati reali
- statistiche
- badge
- ranking
- profilo pubblico
- privacy

RICERCA
- ricerca reale
- risultati
- nessun risultato
- query invalida
- pagination/limit

CONFRONTO
- dati corretti
- utenti differenti
- dati mancanti

DASHBOARD
- dati reali
- CTA contestuali
- Fanta
- missioni
- pronostico
- scuola
- match

Eseguire:
- test
- typecheck
- lint
- build

--------------------------------------------------
CRITERI DI ACCETTAZIONE
--------------------------------------------------

Considerare il lavoro completato solo quando:

1. La Dashboard non contiene dati mock.
2. Il Fanta è chiaramente una delle azioni principali.
3. Il match della settimana permette realmente di effettuare un pronostico.
4. Il pronostico assegna/scala LP attraverso il sistema centralizzato.
5. Non è possibile ottenere la ricompensa più volte.
6. Il profilo è una vera vetrina dell'utente.
7. La ricerca utenti funziona realmente.
8. Un utente può aprire il profilo pubblico di un altro utente.
9. È possibile confrontare due utenti.
10. Ranking e Profilo utilizzano le stesse fonti reali.
11. Non vengono mostrati dati inventati.
12. La Dashboard non è sovraccarica.
13. Non sono state introdotte funzionalità social superflue.
14. Nessuna emoji è utilizzata nella UI.
15. Typecheck, lint e build sono puliti.

PRINCIPIO FINALE

Non progettare la Dashboard come un contenitore di tutte le funzionalità dell'app.

Deve essere il punto di ingresso al ciclo principale di Leonessa:

STATO PERSONALE → AZIONE → RICOMPENSA → PROGRESSIONE → COMPETIZIONE → IDENTITÀ → CONFRONTO.

Implementa prima ciò che è già supportato dall'architettura esistente e segnala esplicitamente eventuali decisioni di prodotto o dati mancanti che richiedono una scelta prima di procedere.