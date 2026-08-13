# Leonessa App
## Roles & Permissions v1.0

---

# 1. Obiettivo

Definire i ruoli disponibili all'interno della piattaforma e le relative autorizzazioni.

Il sistema deve essere:

- semplice da gestire;
- facilmente estendibile;
- compatibile con future competizioni;
- basato sul principio del minimo privilegio.

---

# 2. Filosofia

Ogni utente nasce con il ruolo:

```text
USER
```

I ruoli aggiuntivi vengono assegnati dagli organizzatori o dagli amministratori.

Un utente può possedere più ruoli contemporaneamente.

### Esempio

```text
Mario

USER
PLAYER
STAFF
```

---

# 3. Gerarchia Ruoli

```text
ADMIN
│
ORGANIZER
│
SCHOOL_REP
│
STAFF
│
PLAYER
│
USER
```

La gerarchia serve solamente per comprendere il livello di accesso.

I permessi vengono comunque gestiti in modo esplicito.

---

# 4. Ruolo USER

## Descrizione

Utente registrato alla piattaforma.

Tutti gli utenti possiedono questo ruolo.

---

## Permessi

### Visualizzazione

- Visualizzare competizioni
- Visualizzare partite
- Visualizzare classifiche
- Visualizzare squadre
- Visualizzare profili pubblici
- Visualizzare missioni
- Visualizzare badge
- Visualizzare ranking

### Community

- Accumulare punti
- Completare missioni
- Ricevere notifiche

### Profilo

- Modificare il proprio profilo
- Caricare immagine profilo
- Gestire impostazioni personali

---

# 5. Ruolo PLAYER

## Descrizione

Utente appartenente ad una squadra.

---

## Permessi Aggiuntivi

### Squadra

- Visualizzare rosa squadra
- Visualizzare statistiche squadra
- Visualizzare calendario squadra

### Competizione

- Visualizzare statistiche personali
- Visualizzare storico prestazioni
- Visualizzare dati competizione dedicati

---

## Restrizioni

Non può:

- modificare risultati
- modificare rose
- gestire staff
- assegnare ruoli

---

# 6. Ruolo STAFF

## Descrizione

Utente che collabora all'organizzazione della competizione.

---

## Permessi Aggiuntivi

### Staff Area

- Accedere all'area staff
- Visualizzare i propri turni
- Effettuare check-in
- Visualizzare missioni staff
- Visualizzare punti staff

### Operazioni

- Confermare disponibilità
- Gestire il proprio calendario operativo

---

## Restrizioni

Non può:

- creare turni
- assegnare incarichi
- gestire utenti

---

# 7. Ruolo SCHOOL_REP

## Descrizione

Rappresentante di istituto.

---

## Permessi Aggiuntivi

### Scuola

- Visualizzare dashboard scuola
- Visualizzare dati partecipazione scuola
- Visualizzare statistiche dedicate

### Community

- Promuovere iniziative scuola
- Accedere a strumenti di coinvolgimento

---

## Restrizioni

Non può:

- modificare risultati
- gestire competizioni
- assegnare ruoli

---

# 8. Ruolo ORGANIZER

## Descrizione

Membro dell'organizzazione Leonessa Cup.

---

## Permessi Aggiuntivi

### Staff

- Creare turni
- Modificare turni
- Assegnare staff ai turni
- Gestire presenze
- Gestire check-in

### Competizioni

- Gestire partite
- Gestire classifiche
- Gestire eventi
- Gestire squadre

### Community

- Creare missioni
- Assegnare punti
- Gestire badge

### Comunicazioni

- Inviare comunicazioni
- Creare annunci

---

## Restrizioni

Non può:

- eliminare amministratori
- modificare configurazioni critiche di sistema

---

# 9. Ruolo ADMIN

## Descrizione

Amministratore della piattaforma.

---

## Permessi

### Completi

- Gestione utenti
- Gestione ruoli
- Gestione competizioni
- Gestione configurazioni
- Gestione sistema punti
- Gestione notifiche
- Gestione database applicativo

### Sicurezza

- Sospensione utenti
- Revoca ruoli
- Audit attività

---

# 10. Staff Roles

Oltre ai ruoli applicativi esistono i ruoli operativi.

---

## Elenco

```text
ACCOGLIENZA
SICUREZZA
SOCIAL
RACCATTAPALLE
LOGISTICA
SPOGLIATOI
STATISTICHE
FOTOGRAFO
VIDEOMAKER
INTERVISTATORE
```

---

## Note

Questi ruoli non influenzano i permessi.

Servono esclusivamente per:

- assegnazione turni;
- missioni dedicate;
- reportistica;
- gamification.

---

# 11. Matrice Permessi

| Azione | USER | PLAYER | STAFF | SCHOOL_REP | ORGANIZER | ADMIN |
|----------|----------|----------|----------|----------|----------|----------|
| Visualizzare partite | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Visualizzare classifiche | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Modificare profilo | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Accedere Community | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Accedere Rewards | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Accedere Staff Area | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| Effettuare Check-In | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| Visualizzare Turni | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| Creare Turni | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Assegnare Turni | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Gestire Match | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Gestire Competizioni | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Gestire Missioni | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Gestire Punti | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Gestire Utenti | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Gestire Ruoli | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Configurazione Sistema | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

# 12. Future Roles

Ruoli previsti ma non inclusi nell'MVP.

```text
SPONSOR_MANAGER
PRESS
REFEREE
VOLUNTEER
PARTNER
```

---

# 13. Regole di Sicurezza

- Tutte le azioni sensibili devono essere tracciate.
- Ogni assegnazione ruolo deve essere registrata.
- Ogni modifica importante deve essere auditabile.
- I permessi devono essere verificati lato server.
- I controlli UI non sostituiscono i controlli backend.

---

# 14. MVP Scope

Incluso:

- USER
- PLAYER
- STAFF
- SCHOOL_REP
- ORGANIZER
- ADMIN

Escluso:

- Sponsor
- Partner
- Press
- Referee

Da introdurre in versioni future se necessario.

---