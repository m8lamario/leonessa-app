# Leonessa App

## Database Design v1.0



---



# 1. Obiettivo



Definire il modello dati principale della piattaforma.



Questo documento rappresenta la base per:



- Prisma Schema

- PostgreSQL

- API Design

- Permissions System

- Business Logic



---



# 2. Principi di Progettazione



## Scalabilità



Il database deve supportare:



- più competizioni;

- più stagioni;

- nuovi sport;

- nuove funzionalità.



---



## Modularità



Ogni modulo deve essere indipendente.



Esempio:



- Community

- Staff

- Tournament



devono poter evolvere separatamente.



---



## Auditabilità



Ogni operazione importante deve essere tracciabile.



---



## Soft Delete



Per entità importanti utilizzare:



```sql

deleted_at

```



invece della cancellazione fisica.



---



# 3. Entity Relationship Overview



```text

User

│

├── UserRole

├── UserBadge

├── UserMission

├── PointTransaction

├── Notification

├── TeamMember

├── ShiftAssignment

└── EventAttendance



School

│

└── Team



Competition

│

├── Team

├── Match

└── Event



Match

│

└── MatchEvent



StaffRole

│

└── Shift

```



---



# 4. Users



## User



Rappresenta un utente registrato.



### Campi



| Campo | Tipo |

|---------|---------|

| id | uuid |

| email | string |

| name | string |

| surname | string |

| avatarUrl | string |

| schoolId | uuid |

| bio | string |

| instagram | string |

| className | string |

| createdAt | datetime |

| updatedAt | datetime |



---



## Relazioni



```text

User

├── School

├── Roles

├── TeamMembership

├── Points

├── Missions

├── Badges

└── Notifications

```



---



# 5. Roles



## Role



Ruoli applicativi.



### Campi



| Campo | Tipo |

|---------|---------|

| id | uuid |

| name | string |



---



### Valori



```text

USER

PLAYER

STAFF

SCHOOL_REP

ORGANIZER

ADMIN

```



---



## UserRole



Relazione molti-a-molti.



### Campi



| Campo | Tipo |

|---------|---------|

| id | uuid |

| userId | uuid |

| roleId | uuid |

| assignedBy | uuid |

| assignedAt | datetime |



---



# 6. Schools



## School



Scuola partecipante.



### Campi



| Campo | Tipo |

|---------|---------|

| id | uuid |

| name | string |

| shortName | string |

| logoUrl | string |

| primaryColor | string |

| secondaryColor | string |

| description | text |



---



## Relazioni



```text

School

├── Users

└── Team

```



---



# 7. Competitions



## Competition



Competizione sportiva.



### Campi



| Campo | Tipo |

|---------|---------|

| id | uuid |

| name | string |

| slug | string |

| season | string |

| startDate | datetime |

| endDate | datetime |

| status | string |



---



### Esempi



```text

Leonessa Cup 2027

Invibe Padel Cup 2027

```



---



# 8. Teams



## Team



Squadra partecipante.



### Campi



| Campo | Tipo |

|---------|---------|

| id | uuid |

| competitionId | uuid |

| schoolId | uuid |

| name | string |



---



## Relazioni



```text

Team

├── School

├── Competition

├── Players

└── Matches

```



---



## TeamMember



Associazione utente-squadra.



### Campi



| Campo | Tipo |

|---------|---------|

| id | uuid |

| teamId | uuid |

| userId | uuid |

| role | string |

| jerseyNumber | int |



---



### Valori ruolo



```text

PLAYER

COACH

MANAGER

SOCIAL_MANAGER

```



---



# 9. Matches



## Match



Partita.



### Campi



| Campo | Tipo |

|---------|---------|

| id | uuid |

| competitionId | uuid |

| homeTeamId | uuid |

| awayTeamId | uuid |

| venue | string |

| startAt | datetime |

| status | string |

| homeScore | int |

| awayScore | int |



---



### Stati



```text

SCHEDULED

LIVE

FINISHED

CANCELLED

```



---



## MatchEvent



Evento partita.



### Campi



| Campo | Tipo |

|---------|---------|

| id | uuid |

| matchId | uuid |

| type | string |

| minute | int |

| playerId | uuid |

| relatedPlayerId | uuid |



---



### Tipologie



```text

GOAL

ASSIST

YELLOW_CARD

RED_CARD

MVP

```



---



# 10. Staff



## StaffRole



Ruolo operativo.



### Campi



| Campo | Tipo |

|---------|---------|

| id | uuid |

| name | string |



---



### Valori



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



## Shift



Turno operativo.



### Campi



| Campo | Tipo |

|---------|---------|

| id | uuid |

| title | string |

| staffRoleId | uuid |

| startAt | datetime |

| endAt | datetime |

| pointsReward | int |



---



## ShiftAssignment



Assegnazione turno.



### Campi



| Campo | Tipo |

|---------|---------|

| id | uuid |

| shiftId | uuid |

| userId | uuid |

| status | string |



---



### Stati



```text

ASSIGNED

CONFIRMED

CHECKED_IN

COMPLETED

```



---



## CheckIn



Registrazione presenza.



### Campi



| Campo | Tipo |

|---------|---------|

| id | uuid |

| shiftId | uuid |

| userId | uuid |

| timestamp | datetime |

| method | string |



---



### Metodi



```text

QR

MANUAL

```



---



# 11. Community



## Mission



Missione disponibile.



### Campi



| Campo | Tipo |

|---------|---------|

| id | uuid |

| title | string |

| description | text |

| rewardPoints | int |

| active | boolean |



---



## UserMission



Progressione missione.



### Campi



| Campo | Tipo |

|---------|---------|

| id | uuid |

| userId | uuid |

| missionId | uuid |

| status | string |

| completedAt | datetime |



---



### Stati



```text

AVAILABLE

IN_PROGRESS

COMPLETED

CLAIMED

```



---



## Badge



Achievement.



### Campi



| Campo | Tipo |

|---------|---------|

| id | uuid |

| name | string |

| description | string |

| iconUrl | string |



---



## UserBadge



Badge ottenuto.



### Campi



| Campo | Tipo |

|---------|---------|

| id | uuid |

| userId | uuid |

| badgeId | uuid |

| earnedAt | datetime |



---



# 12. Points System



## PointTransaction



Storico movimenti punti.



### Campi



| Campo | Tipo |

|---------|---------|

| id | uuid |

| userId | uuid |

| amount | int |

| type | string |

| reason | string |

| createdAt | datetime |



---



### Tipologie



```text

LP

SP

```



---



### Esempi



```text

+50 LP - Partecipazione evento

+100 SP - Turno completato

-200 LP - Riscatto premio

```



---



# 13. Events



## Event



Evento generico.



### Campi



| Campo | Tipo |

|---------|---------|

| id | uuid |

| competitionId | uuid |

| title | string |

| description | text |

| startAt | datetime |

| location | string |



---



## EventAttendance



Partecipazione evento.



### Campi



| Campo | Tipo |

|---------|---------|

| id | uuid |

| userId | uuid |

| eventId | uuid |

| checkedAt | datetime |



---



# 14. Notifications



## Notification



Notifica utente.



### Campi



| Campo | Tipo |

|---------|---------|

| id | uuid |

| userId | uuid |

| title | string |

| body | text |

| readAt | datetime |

| createdAt | datetime |



---



# 15. Future Entities (Non MVP)



## Reward



Premi riscattabili.



## Redemption



Storico riscatti.



## Sponsor



Sponsor ufficiali.



## SponsorCampaign



Attività sponsor.



## FantasyTeam



Fanta Leonessa.



## FantasyPlayer



Giocatori fantasy.



## Coupon



Sconti e promozioni.



## AIConversation



Assistente AI.



---



# 16. Database MVP Scope



Entità incluse nella V1:



- User

- Role

- UserRole

- School

- Competition

- Team

- TeamMember

- Match

- MatchEvent

- StaffRole

- Shift

- ShiftAssignment

- CheckIn

- Mission

- UserMission

- Badge

- UserBadge

- PointTransaction

- Event

- EventAttendance

- Notification



---



# 17. Note per Prisma



Linee guida:



- UUID come primary key.

- createdAt e updatedAt ovunque.

- Foreign key esplicite.

- Enum Prisma per stati e tipologie.

- Soft delete per entità critiche.

- Indici su:

&#x20; - email

&#x20; - schoolId

&#x20; - competitionId

&#x20; - userId

&#x20; - matchId



---

