\# Leonessa App

\## Information Architecture v1.0



\---



\# 1. Obiettivo



Definire la struttura completa dell'applicazione, la navigazione principale e le schermate disponibili per ogni tipologia di utente.



\---



\# 2. Navigation Principale



\## Bottom Navigation



Tutti gli utenti visualizzano:



```text

🏠 Home

🏆 Cup

🎯 Community

⭐ Rewards

👤 Profile

```



Alcune sezioni possono comparire o scomparire in base ai ruoli.



\---



\## Navigation Dinamica



\### Staff



Visibile solo a:



\- STAFF

\- ORGANIZER

\- ADMIN



```text

🛠 Staff

```



\---



\### Admin



Visibile solo a:



\- ADMIN



```text

⚙ Admin

```



\---



\# 3. Sitemap Generale



```text

Home

│

├── Feed

├── News

├── Eventi

├── Match in evidenza

└── Notifiche



Cup

│

├── Competizioni

│   ├── Leonessa Cup

│   ├── Invibe Padel Cup

│   └── Future Competitions

│

├── Calendario

├── Classifiche

├── Squadre

└── Match Center



Community

│

├── Ranking

├── Missioni

├── Badge

├── Attività

└── Community Feed



Rewards

│

├── Wallet

├── Premi

├── Storico

└── Obiettivi



Profile

│

├── Profilo

├── Ruoli

├── Notifiche

├── Impostazioni

└── Storico Punti

```



\---



\# 4. Home



\## Obiettivo



Fornire una panoramica immediata e personalizzata.



\---



\## Contenuti



\### Tutti gli utenti



\- Match in evidenza

\- Ultime news

\- Eventi imminenti

\- Notifiche



\---



\### Player



\- Prossima partita

\- Classifica squadra

\- Statistiche personali



\---



\### Staff



\- Prossimo turno

\- Comunicazioni operative

\- Missioni staff



\---



\### Organizer



\- Dashboard operativa

\- Turni scoperti

\- Alert



\---



\# 5. Cup



\## Competizioni



Lista di tutte le competizioni disponibili.



Esempi:



\- Leonessa Cup

\- Invibe Padel Cup



\---



\## Dettaglio Competizione



\### Tab



```text

Overview

Classifica

Calendario

Squadre

Statistiche

```



\---



\# 6. Squadre



\## Lista Squadre



Visualizzazione di tutte le scuole partecipanti.



\---



\## Pagina Squadra



Informazioni:



\- Logo

\- Nome

\- Colori

\- Classifica

\- Rosa

\- Statistiche

\- Partite



\---



\# 7. Match Center



\## Lista Partite



Filtri:



\- Oggi

\- Questa settimana

\- Fase a gironi

\- Eliminazione diretta



\---



\## Dettaglio Partita



Informazioni:



\- Risultato

\- Squadre

\- Cronologia eventi

\- MVP

\- Statistiche



\---



\# 8. Community



\## Obiettivo



Creare coinvolgimento oltre le partite.



\---



\## Ranking



Classifiche:



\- Utenti

\- Scuole

\- Staff



\---



\## Missioni



Visualizzazione:



\- Disponibili

\- In corso

\- Completate



\---



\## Badge



Raccolta badge ottenuti.



\---



\## Feed



Attività recenti della community.



\---



\# 9. Rewards



\## Wallet



Visualizzazione:



\- Leonessa Points (LP)

\- Staff Points (SP)



\---



\## Premi



Catalogo premi disponibili.



\---



\## Storico



Movimenti punti.



\---



\# 10. Profile



\## Informazioni Personali



Campi:



\- Foto profilo

\- Nome

\- Cognome

\- Scuola

\- Classe

\- Bio

\- Instagram



\---



\## Ruoli



Ruoli assegnati all'utente.



Esempio:



```text

USER

PLAYER

STAFF

```



\---



\## Storico Punti



Visualizzazione dettagliata delle attività.



\---



\# 11. Area Staff



Disponibile solo ai ruoli autorizzati.



\---



\## I Miei Turni



Visualizzazione:



\- Futuri

\- In corso

\- Completati



\---



\## Turni Disponibili



Turni ancora da assegnare.



\---



\## Check-In



Accesso rapido allo scanner QR.



\---



\## Missioni Staff



Missioni dedicate allo staff.



\---



\# 12. Organizer Dashboard



Disponibile solo agli organizzatori.



\---



\## Sezioni



\### Staff



\- Presenze

\- Turni

\- Attività



\### Competizione



\- Match

\- Classifiche

\- Eventi



\### Community



\- Ranking

\- Missioni



\### Comunicazioni



\- Notifiche

\- Annunci



\---



\# 13. Admin Area



Disponibile solo agli amministratori.



\---



\## Gestione Utenti



\- Ricerca

\- Modifica

\- Sospensione



\---



\## Gestione Ruoli



\- Assegnazione

\- Revoca



\---



\## Gestione Competizioni



\- Creazione

\- Modifica

\- Archiviazione



\---



\# 14. Principi UX



\## Mobile First



Tutte le schermate devono essere progettate prima per smartphone.



\---



\## Performance



Le animazioni non devono compromettere la fluidità.



\---



\## Accessibilità



Componenti facilmente utilizzabili da tutti gli utenti.



\---



\## Coerenza



Pattern grafici e comportamentali uniformi.



\---



\# 15. Componenti Principali



\## Match Card



Mostra:



\- squadre

\- risultato

\- data



\---



\## School Card



Mostra:



\- logo

\- nome

\- posizione



\---



\## Mission Card



Mostra:



\- titolo

\- progresso

\- ricompensa



\---



\## Reward Card



Mostra:



\- premio

\- costo

\- disponibilità



\---



\## Notification Card



Mostra:



\- titolo

\- descrizione

\- data



\---

