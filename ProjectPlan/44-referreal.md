# Piano — Referral / Porta un amico

## Obiettivo

Implementare un sistema referral completo per permettere agli utenti di invitare amici tramite un codice/link personale e ottenere LP quando il referral viene completato.

La feature deve essere mobile-first e integrata con Altro.

---

## 1. Pagina Referral

Creare:

`/more/referral`

(o seguire la struttura routing già presente).

La pagina deve mostrare:

- titolo "Porta un amico";
- spiegazione sintetica;
- codice referral personale;
- link referral;
- pulsante "Copia codice";
- pulsante "Condividi";
- pulsante dedicato WhatsApp;
- condizioni del programma;
- stato degli inviti effettuati.

Esempio:

PORTA UN AMICO

Invita un amico nella Leonessa Cup e guadagnate LP.

IL TUO CODICE
`ABC123`

[ Copia codice ]

[ Condividi su WhatsApp ]

I TUOI INVITI

Mario Rossi
✓ Completato
+XX LP

Luca Bianchi
○ In attesa

---

## 2. Referral code

Ogni utente deve avere un codice referral personale.

Il codice deve essere:

- univoco;
- stabile nel tempo;
- non facilmente prevedibile;
- associato a un solo utente.

Il link deve utilizzare il codice, ad esempio:

`/register?ref=ABC123`

Non usare dati personali nel referral code.

---

## 3. Attribuzione

Quando un nuovo utente arriva tramite referral:

1. leggere il codice;
2. verificare che sia valido;
3. associare il nuovo utente al referrer;
4. impedire di cambiare referrer dopo l'associazione.

La semplice apertura del link NON assegna LP.

Il referral deve avere uno stato persistente, ad esempio:

`PENDING → COMPLETED`

ed eventualmente `REJECTED` se una condizione non viene soddisfatta.

---

## 4. Completamento referral

Il referral diventa COMPLETED solo quando il nuovo utente completa le condizioni definite dal sistema.

Non assegnare LP alla semplice registrazione.

Rendere l'evento di completamento configurabile, senza hardcodare la logica nei componenti UI.

---

## 5. Controllo stesso dispositivo

Implementare un controllo antifrode.

Se il referral viene utilizzato da un dispositivo già associato al referrer:

- NON assegnare immediatamente la ricompensa;
- mostrare chiaramente che il referral richiede un dispositivo differente;
- mantenere il referral in stato non completato/bloccato;
- spiegare all'utente cosa deve fare.

Il controllo deve essere effettuato lato server.

Non considerare il solo controllo frontend sufficiente.

Utilizzare gli identificatori/device signals già disponibili nel progetto senza introdurre sistemi invasivi non necessari.

Il sistema deve comunque consentire a persone diverse che utilizzano legittimamente dispositivi differenti di completare il referral.

---

## 6. Condizioni

La pagina deve spiegare chiaramente tutte le condizioni del referral.

In particolare:

- un utente può utilizzare un solo referral;
- non è possibile auto-invitarsi;
- il referral deve provenire da un altro utente;
- lo stesso referral non può essere ricompensato più volte;
- la ricompensa viene assegnata solo dopo il completamento delle condizioni;
- il dispositivo deve essere differente da quello del referrer quando il sistema rileva una possibile auto-attribuzione;
- eventuali referral non validi non generano LP.

Non inventare ulteriori condizioni non richieste.

---

## 7. Ricompense LP

Non fissare ancora il valore definitivo degli LP.

Creare una struttura configurabile per:

- LP assegnati al referrer;
- LP assegnati all'invitee.

Le ricompense devono passare dal reward/PointTransaction system già esistente.

NON modificare direttamente il saldo LP.

La ricompensa deve essere idempotente.

Se lo stesso evento viene elaborato più volte:

`1 referral completato = 1 sola ricompensa`

---

## 8. Stato referral

L'utente deve poter vedere almeno:

- amico invitato;
- stato;
- eventuale ricompensa ottenuta.

Stati consigliati:

`PENDING`
`COMPLETED`
`BLOCKED`

Non mostrare informazioni personali non necessarie sull'altro utente.

Se non è possibile mostrare il nome in modo coerente con il modello privacy esistente, mostrare invece uno stato generico.

---

## 9. Condivisione

Implementare:

### Web Share

Usare Web Share API quando disponibile.

### WhatsApp

Creare un link WhatsApp con:

- testo predefinito;
- referral link personale.

Esempio:

"Entra anche tu nella Leonessa Cup! ⚽
Usa il mio codice: ABC123"

Non hardcodare il dominio: utilizzare la configurazione URL dell'app.

### Fallback

Se Web Share non è disponibile:

- copia link;
- copia codice.

---

## 10. Integrazione con Altro

Aggiungere in:

`Altro → Porta un amico`

La card deve mostrare un'anteprima:

- icona;
- titolo;
- breve descrizione;
- eventuale stato degli inviti.

Il tap apre la pagina completa Referral.

---

## 11. Backend

Creare una feature dedicata, seguendo l'architettura esistente.

Gestire:

- generazione/recupero referral code;
- attribuzione referral;
- stato;
- completamento;
- validazioni;
- antifrode;
- reward;
- idempotenza.

Non mettere la logica referral direttamente nei componenti React.

---

## 12. Database

Prima di modificare Prisma:

- analizzare lo schema esistente;
- verificare se esistono già modelli riutilizzabili;
- evitare duplicazioni.

Se necessario introdurre un modello referral con almeno:

- referrer;
- referred user;
- code/reference;
- status;
- timestamps;
- eventuale motivo di blocco;
- informazioni necessarie all'antifrode.

Aggiungere vincoli DB per impedire duplicazioni.

---

## 13. UI / UX

Design coerente con Leonessa.

La pagina deve essere semplice e non sembrare un pannello amministrativo.

Priorità visiva:

1. ricompensa;
2. codice;
3. condivisione;
4. stato degli inviti;
5. condizioni.

Usare le icone della libreria già presente nel progetto.

Niente nuove librerie.

---

## 14. Sicurezza e idempotenza

Verificare esplicitamente:

- self-referral;
- referral duplicato;
- stesso invitee con più referrer;
- completamento ripetuto;
- reward duplicata;
- codice inesistente;
- codice proprio;
- referral già completato;
- race condition durante il completamento.

La validazione deve essere server-side.

---

## 15. Test

Aggiungere test per almeno:

- generazione codice;
- referral valido;
- codice invalido;
- self-referral;
- doppio referral;
- stesso invitee;
- stesso dispositivo;
- completamento;
- completamento ripetuto;
- reward idempotente;
- stato PENDING → COMPLETED;
- condivisione/link.

Eseguire:

`npm run typecheck`
`npm run lint`
`npm run test`
`npm run build`

---

## 16. Importante

NON decidere autonomamente il numero definitivo di LP.

NON introdurre sistemi antifrode invasivi.

NON creare dati mock presentati come reali.

Prima dell'implementazione analizzare:

- reward engine;
- PointTransaction;
- User;
- eventuali sistemi/device già presenti;
- struttura di Altro;
- autenticazione;
- routing.

Riutilizzare il più possibile l'infrastruttura esistente.