\# Leonessa App

\## User Flows v1.0



\---



\# 1. Obiettivo del Documento



Questo documento descrive i principali flussi utente dell'app Leonessa.



Lo scopo è definire:



\- percorsi utente;

\- schermate;

\- azioni disponibili;

\- dati coinvolti;

\- regole di business.



Questo documento sarà utilizzato per progettazione UX/UI, backend, database e permessi.



\---



\# 2. Registrazione



\## Obiettivo



Consentire a qualsiasi studente di registrarsi nel minor tempo possibile.



\---



\## Flusso



```text

Landing

↓

Login Google / Email

↓

Inserimento dati base

↓

Account creato

↓

Home

```



\---



\## Schermata Login



\### Azioni disponibili



\- Continua con Google

\- Continua con Email



\---



\## Schermata Profilo Base



\### Campi



\- Nome

\- Cognome

\- Scuola



\---



\## Regole



\- Email obbligatoria.

\- Ogni account appartiene ad una scuola.

\- Ogni nuovo account nasce con ruolo USER.



\---



\# 3. Primo Accesso



\## Obiettivo



Permettere all'utente di iniziare subito ad utilizzare la piattaforma.



\---



\## Flusso



```text

Registrazione completata

↓

Home

↓

Esplorazione libera

```



\---



\## Home iniziale



Mostra:



\- prossime partite;

\- classifica;

\- novità;

\- community.



\---



\# 4. Gestione Profilo



\## Obiettivo



Consentire la modifica delle informazioni personali.



\---



\## Flusso



```text

Profilo

↓

Modifica Profilo

↓

Salva

```



\---



\## Campi modificabili



\- Foto profilo

\- Biografia

\- Instagram

\- Classe

\- Anno scolastico



\---



\# 5. Richiesta Ruolo Staff



\## Obiettivo



Consentire ad uno studente di candidarsi allo staff.



\---



\## Flusso



```text

Profilo

↓

Diventa Staff

↓

Selezione area

↓

Invio candidatura

↓

In attesa approvazione

```



\---



\## Aree disponibili



\- Accoglienza

\- Sicurezza

\- Social

\- Logistica

\- Spogliatoi

\- Statistiche

\- Raccattapalle



\---



\## Dati richiesti



\- Area scelta

\- Motivazione



\---



\## Approvazione



L'organizzatore può:



\- approvare;

\- rifiutare.



\---



\# 6. Assegnazione Ruolo Giocatore



\## Obiettivo



Associare un utente ad una squadra.



\---



\## Flusso



```text

Organizer

↓

Seleziona squadra

↓

Aggiungi giocatore

↓

Conferma

```



\---



\## Risultato



L'utente ottiene:



\- ruolo PLAYER

\- collegamento alla squadra



\---



\# 7. Consultazione Torneo



\## Obiettivo



Consentire la consultazione rapida del torneo.



\---



\## Flusso



```text

Cup

↓

Competizione

↓

Partita

```



\---



\## Informazioni disponibili



\### Competizione



\- classifica

\- calendario

\- squadre



\### Partita



\- risultato

\- eventi

\- MVP

\- statistiche



\---



\# 8. Visualizzazione Squadra



\## Obiettivo



Permettere agli utenti di seguire la propria scuola.



\---



\## Flusso



```text

Scuola

↓

Squadra

```



\---



\## Informazioni



\- logo

\- giocatori

\- classifica

\- statistiche

\- prossime partite



\---



\# 9. Turni Staff



\## Obiettivo



Mostrare attività e responsabilità dello staff.



\---



\## Flusso



```text

Staff

↓

I miei turni

↓

Dettaglio turno

```



\---



\## Informazioni



\- ruolo

\- orario

\- luogo

\- punti assegnati



\---



\## Azioni



\- conferma presenza

\- visualizza dettagli



\---



\# 10. Check-In Staff



\## Obiettivo



Verificare la presenza dello staff.



\---



\## Flusso



```text

Turno

↓

Check-In

↓

QR Scanner

↓

Conferma

```



\---



\## Risultato



\- presenza registrata

\- punti assegnati



\---



\# 11. Sistema Punti



\## Obiettivo



Premiare la partecipazione.



\---



\## Tipologie



\### LP



Leonessa Points



Utilizzati per:



\- community

\- missioni

\- partecipazione



\---



\### SP



Staff Points



Utilizzati per:



\- attività staff

\- turni

\- contributi organizzativi



\---



\# 12. Storico Punti



\## Flusso



```text

Profilo

↓

Punti

↓

Storico

```



\---



\## Informazioni



\- data

\- quantità

\- motivo



\---



\# 13. Missioni



\## Obiettivo



Incentivare comportamenti desiderati.



\---



\## Flusso



```text

Community

↓

Missioni

↓

Dettaglio Missione

```



\---



\## Esempi



\- partecipa ad una partita

\- completa un turno

\- effettua check-in

\- invita un amico



\---



\## Stati



\- disponibile

\- in corso

\- completata

\- riscossa



\---



\# 14. Notifiche



\## Obiettivo



Comunicare informazioni rilevanti.



\---



\## Eventi



\- assegnazione turno

\- approvazione ruolo

\- partita imminente

\- missione completata

\- nuovi punti ricevuti



\---



\# 15. Home Personalizzata



\## USER



Visualizza:



\- partite

\- classifiche

\- missioni

\- novità



\---



\## PLAYER



Visualizza:



\- prossima partita

\- squadra

\- statistiche personali

\- classifica



\---



\## STAFF



Visualizza:



\- prossimi turni

\- missioni staff

\- punti staff

\- comunicazioni operative



\---



\## ORGANIZER



Visualizza:



\- dashboard operativa

\- turni scoperti

\- presenze

\- stato partite

\- notifiche urgenti



\---



\# 16. Gestione Competizioni Future



\## Obiettivo



Supportare nuove competizioni senza modifiche strutturali.



\---



\## Flusso



```text

Competizioni

↓

Leonessa Cup



oppure



Invibe Padel Cup



oppure



Nuova competizione

```



\---



\## Regola



Tutti i moduli devono essere collegati ad una competizione specifica.



\---



\# 17. Flussi Fuori MVP



Da progettare successivamente:



\- Fanta Leonessa

\- Reward Store

\- Ticketing

\- Sponsor

\- Coupon

\- AI Assistant

\- Marketplace premi



\---

