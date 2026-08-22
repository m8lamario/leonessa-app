# 40-match-follow-push.md

## Obiettivo

Permettere all'utente di seguire una partita e ricevere una push notification quando inizia.

Flusso:

Segui partita
↓
salvataggio preferenza
↓
kickoff
↓
🔴 Push "La partita è iniziata"
↓
tap sulla notifica
↓
apertura della pagina Live della partita

Il sistema deve essere progettato principalmente per l'app Capacitor Android/iOS.

---

# UX

Nel Match Card:

```text
[ Segui partita ]
```

Dopo il tap:

```text
✓ Partita seguita
```

Il comportamento deve essere immediato.

Se la partita è già iniziata:

```text
🔴 LIVE
```

e non deve essere possibile creare un reminder per il kickoff passato.

---

# Push Notification

Al kickoff inviare:

```text
⚽ Partita iniziata

ITIS Castelli vs Liceo De Andrè

La partita è iniziata.
```

La notifica deve contenere un'azione/deep link verso:

```text
/live/[matchId]
```

o la route Live già presente nel progetto.

Il tap sulla notifica deve:

- aprire l'app se chiusa;
- portare l'app in foreground se già aperta;
- navigare direttamente alla partita;
- funzionare correttamente da cold start.

---

# Capacitor Push

Utilizzare il sistema di push notification nativo compatibile con Capacitor.

Supportare:

```text
Android
iOS
```

Gestire:

- richiesta permesso;
- registrazione dispositivo;
- token push;
- aggiornamento del token;
- revoca/disattivazione;
- ricezione foreground;
- tap sulla notifica;
- cold start.

Non implementare notifiche Web Push come sostituzione delle push native dell'app.

---

# Device Registration

Creare una persistenza per associare:

```text
User
↓
Device
↓
Push Token
↓
Platform
```

Salvare almeno:

```text
userId
token
platform
createdAt
updatedAt
lastSeenAt
enabled
```

Un utente può avere più dispositivi.

Lo stesso token non deve essere registrato più volte.

---

# Match Follow

Creare una relazione:

```text
User
↓
FollowedMatch
↓
Match
```

Vincolo:

```text
userId + matchId
```

unico.

Funzioni necessarie:

```text
followMatch()
unfollowMatch()
isFollowingMatch()
```

---

# API

Implementare endpoint coerenti con l'architettura esistente, ad esempio:

```text
POST   /api/matches/[matchId]/follow
DELETE /api/matches/[matchId]/follow
GET    /api/matches/[matchId]/follow
```

Richiedere autenticazione.

Verificare che il match appartenga a una competizione valida.

---

# Scheduling

La notifica deve essere inviata al kickoff reale della partita.

Non creare un timer client-side.

Il dispositivo potrebbe essere:

- offline;
- spento;
- l'app potrebbe essere chiusa.

La programmazione/invio deve quindi essere server-side.

Utilizzare il sistema di scheduling/infrastruttura già presente nel progetto quando possibile.

Non introdurre un nuovo sistema di cron se ne esiste già uno riutilizzabile.

---

# Precisione temporale

Il trigger deve utilizzare:

```text
Match.startAt
```

come fonte di verità.

Non utilizzare:

```text
setTimeout()
```

nel client.

Gestire correttamente:

- timezone;
- modifiche all'orario della partita;
- partita cancellata;
- partita già iniziata;
- partita già terminata.

Se `startAt` cambia prima del kickoff, la notifica deve utilizzare il nuovo orario.

---

# Idempotenza

La stessa partita non deve generare più notifiche allo stesso dispositivo per lo stesso kickoff.

Utilizzare un identificatore/idempotency key concettualmente equivalente a:

```text
matchId + notificationType + kickoff
```

Esempio:

```text
2353708b-match-start-2026-05-13T19:30
```

---

# Deep Link

La push deve contenere il riferimento alla partita.

Esempio:

```text
leonessa://match/2353708
```

oppure il sistema di deep link già utilizzato dall'app.

Il progetto deve utilizzare una sola strategia coerente.

Gestire:

```text
App chiusa
App in background
App aperta
```

---

# Foreground

Se la push arriva mentre l'utente sta utilizzando l'app:

non aprire automaticamente la pagina.

Mostrare invece un feedback non invasivo:

```text
🔴 ITIS Castelli vs De Andrè è iniziata

[ Vedi Live ]
```

Il tap porta alla pagina Live.

---

# Notification Permission

Alla prima necessità di utilizzare la funzione:

```text
Vuoi ricevere aggiornamenti sulle partite che segui?

[ Abilita notifiche ]
```

Non chiedere il permesso nativo immediatamente all'avvio dell'app senza contesto.

Se l'utente nega:

```text
Partita seguita comunque.

Le notifiche push sono disattivate.
```

L'utente deve poterle riabilitare dalle impostazioni dell'app.

---

# Stato "Segui partita"

Il follow della partita è indipendente dalle notifiche.

Quindi:

```text
Segui partita
```

significa che l'utente segue la partita anche se:

```text
notifiche disabilitate
```

In questo modo il follow rimane una preferenza applicativa.

---

# Dopo il kickoff

Quando la partita diventa LIVE:

```text
Seguita
↓
Push inviata
↓
stato Live
```

Il bottone deve diventare:

```text
🔴 Vedi Live
```

Se l'utente non apre la notifica può comunque raggiungere la partita normalmente dall'app.

---

# Partita terminata

Non è necessario inviare una seconda push in questa fase.

Il risultato finale può essere mostrato nella normale pagina Live/Match.

Eventuali notifiche:

```text
gol
cartellini
fine partita
```

sono fuori scope.

---

# Backend Notification Service

Creare un livello riutilizzabile per l'invio:

```text
NotificationService
```

con responsabilità separate:

```text
creazione evento
↓
ricerca destinatari
↓
recupero device token
↓
invio push
↓
gestione errore
```

Non inserire direttamente la logica push nei servizi Match.

---

# Token Management

Gestire:

```text
nuovo token
token aggiornato
token invalido
logout
dispositivo disabilitato
```

Se il provider restituisce un token non più valido:

```text
enabled = false
```

senza bloccare l'invio agli altri dispositivi dell'utente.

---

# Sicurezza

Non permettere al client di inviare direttamente notifiche push.

Il client può:

```text
registrare token
seguire partita
rimuovere follow
```

Solo il server può:

```text
inviare notifiche
```

---

# Admin / Debug

Aggiungere una possibilità di debug nella Sandbox/Admin già esistente.

Permettere di verificare:

```text
utente
dispositivo
token
partita seguita
stato notifica
```

Possibilità di simulare:

```text
Match Started
```

senza modificare una partita reale.

La simulazione deve essere limitata alla Sandbox.

---

# Sandbox

Creare uno scenario:

```text
Sandbox Match
↓
User follows match
↓
simulate kickoff
↓
push notification
↓
tap
↓
apertura Live
```

Testare anche:

```text
follow
unfollow
follow duplicato
token duplicato
utente con più dispositivi
notifica duplicata
partita già iniziata
partita cancellata
```

---

# Database

Aggiungere solo i modelli necessari.

Indicativamente:

```text
PushDevice
FollowedMatch
NotificationDelivery
```

`NotificationDelivery` può essere utilizzato per garantire idempotenza e debugging.

Non creare modelli inutili se l'architettura esistente dispone già di strutture equivalenti.

---

# UI Match Card

Stato iniziale:

```text
[ Segui partita ]
```

Seguita:

```text
[ ✓ Partita seguita ]
```

Live:

```text
[ 🔴 Vedi Live ]
```

La UI deve rimanere compatta e coerente con il design system esistente.

---

# Errori

Gestire esplicitamente:

```text
Notifiche non autorizzate
Token non disponibile
Match inesistente
Match già terminato
Errore registrazione device
Errore follow
```

Non lasciare click senza feedback.

---

# Test

Testare almeno:

```text
follow partita
unfollow partita
follow duplicato
device registration
token duplicato
più device per utente
permission denied
match già iniziato
match terminato
match cancellato
invio al kickoff
idempotenza notifica
foreground notification
background notification
cold start
deep link
```

---

# Criteri di completamento

```text
✅ L'utente può seguire una partita

✅ Il follow viene persistito

✅ Un utente può seguire più partite

✅ Un utente può avere più dispositivi

✅ Il token push viene registrato correttamente

✅ Android supportato

✅ iOS supportato

✅ Il permesso viene richiesto nel momento corretto

✅ La notifica viene inviata al kickoff

✅ La stessa notifica non viene duplicata

✅ Il tap apre direttamente la partita

✅ Il deep link funziona a app chiusa

✅ Il deep link funziona in background

✅ Foreground gestito correttamente

✅ Match modificato/cancellato gestito

✅ Sandbox permette di testare il flusso

✅ Nessuna logica push nel client per il timing

✅ Nessuna modifica al sistema di scoring

✅ Typecheck
✅ Lint
✅ Test
✅ Build
```

# Risultato finale

L'esperienza deve essere:

```text
SEGUI PARTITA
      ↓
🔔 Follow salvato
      ↓
     KICKOFF
      ↓
📱 PUSH
"ITIS Castelli vs De Andrè è iniziata"
      ↓
    TAP
      ↓
🔴 LIVE
      ↓
Pagina Live della partita
```

Il sistema deve inoltre costituire la base tecnica per future notifiche dell'app, senza implementare in questa fase notifiche per gol, cartellini, risultati o altri eventi.