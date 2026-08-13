\# Leonessa App

\## Prisma Schema Blueprint v1.0



\---



\# Database



```prisma

generator client {

&#x20; provider = "prisma-client-js"

}



datasource db {

&#x20; provider = "postgresql"

&#x20; url      = env("DATABASE\_URL")

}

```



\---



\# Enums



```prisma

enum UserRoleType {

&#x20; USER

&#x20; PLAYER

&#x20; STAFF

&#x20; SCHOOL\_REP

&#x20; ORGANIZER

&#x20; ADMIN

}



enum MatchStatus {

&#x20; SCHEDULED

&#x20; LIVE

&#x20; FINISHED

&#x20; CANCELLED

}



enum ShiftStatus {

&#x20; ASSIGNED

&#x20; CONFIRMED

&#x20; CHECKED\_IN

&#x20; COMPLETED

}



enum MissionStatus {

&#x20; AVAILABLE

&#x20; IN\_PROGRESS

&#x20; COMPLETED

&#x20; CLAIMED

}



enum PointType {

&#x20; LP

&#x20; SP

}

```



\---



\# User



```prisma

model User {

&#x20; id            String   @id @default(uuid())

&#x20; email         String   @unique

&#x20; name          String

&#x20; surname       String?

&#x20; avatarUrl     String?

&#x20; bio           String?

&#x20; instagram     String?



&#x20; schoolId      String?

&#x20; school        School? @relation(fields: \[schoolId], references: \[id])



&#x20; roles         UserRole\[]

&#x20; teamMembers   TeamMember\[]



&#x20; badges        UserBadge\[]

&#x20; missions      UserMission\[]



&#x20; points        PointTransaction\[]



&#x20; notifications Notification\[]



&#x20; createdAt     DateTime @default(now())

&#x20; updatedAt     DateTime @updatedAt

}

```



\---



\# School



```prisma

model School {

&#x20; id             String @id @default(uuid())



&#x20; name           String

&#x20; shortName      String



&#x20; logoUrl        String?



&#x20; primaryColor   String?

&#x20; secondaryColor String?



&#x20; users          User\[]

&#x20; teams          Team\[]



&#x20; createdAt      DateTime @default(now())

&#x20; updatedAt      DateTime @updatedAt

}

```



\---



\# UserRole



```prisma

model UserRole {

&#x20; id         String       @id @default(uuid())



&#x20; userId     String

&#x20; role       UserRoleType



&#x20; user       User         @relation(fields: \[userId], references: \[id])



&#x20; assignedAt DateTime     @default(now())

}

```



\---



\# Competition



```prisma

model Competition {

&#x20; id          String @id @default(uuid())



&#x20; name        String

&#x20; slug        String @unique



&#x20; season      String



&#x20; startDate   DateTime

&#x20; endDate     DateTime



&#x20; teams       Team\[]

&#x20; matches     Match\[]



&#x20; createdAt   DateTime @default(now())

&#x20; updatedAt   DateTime @updatedAt

}

```



\---



\# Team



```prisma

model Team {

&#x20; id             String @id @default(uuid())



&#x20; name           String



&#x20; schoolId       String

&#x20; school         School @relation(fields: \[schoolId], references: \[id])



&#x20; competitionId  String

&#x20; competition    Competition @relation(fields: \[competitionId], references: \[id])



&#x20; members        TeamMember\[]



&#x20; homeMatches    Match\[] @relation("HomeTeam")

&#x20; awayMatches    Match\[] @relation("AwayTeam")



&#x20; createdAt      DateTime @default(now())

}

```



\---



\# TeamMember



```prisma

model TeamMember {

&#x20; id          String @id @default(uuid())



&#x20; teamId      String

&#x20; userId      String



&#x20; jersey      Int?



&#x20; team        Team @relation(fields: \[teamId], references: \[id])

&#x20; user        User @relation(fields: \[userId], references: \[id])

}

```



\---



\# Match



```prisma

model Match {

&#x20; id              String @id @default(uuid())



&#x20; competitionId   String

&#x20; competition     Competition @relation(fields: \[competitionId], references: \[id])



&#x20; homeTeamId      String

&#x20; awayTeamId      String



&#x20; homeTeam        Team @relation("HomeTeam", fields: \[homeTeamId], references: \[id])

&#x20; awayTeam        Team @relation("AwayTeam", fields: \[awayTeamId], references: \[id])



&#x20; status          MatchStatus



&#x20; homeScore       Int @default(0)

&#x20; awayScore       Int @default(0)



&#x20; venue           String?



&#x20; startAt         DateTime



&#x20; events          MatchEvent\[]



&#x20; createdAt       DateTime @default(now())

}

```



\---



\# MatchEvent



```prisma

model MatchEvent {

&#x20; id              String @id @default(uuid())



&#x20; matchId         String

&#x20; playerId        String?



&#x20; type            String



&#x20; minute          Int



&#x20; match           Match @relation(fields: \[matchId], references: \[id])

}

```



\---



\# StaffRole



```prisma

model StaffRole {

&#x20; id          String @id @default(uuid())



&#x20; name        String



&#x20; shifts      Shift\[]

}

```



\---



\# Shift



```prisma

model Shift {

&#x20; id            String @id @default(uuid())



&#x20; title         String



&#x20; startAt       DateTime

&#x20; endAt         DateTime



&#x20; rewardPoints  Int



&#x20; staffRoleId   String



&#x20; staffRole     StaffRole @relation(fields: \[staffRoleId], references: \[id])



&#x20; assignments   ShiftAssignment\[]

}

```



\---



\# ShiftAssignment



```prisma

model ShiftAssignment {

&#x20; id          String @id @default(uuid())



&#x20; shiftId     String

&#x20; userId      String



&#x20; status      ShiftStatus



&#x20; shift       Shift @relation(fields: \[shiftId], references: \[id])

&#x20; user        User @relation(fields: \[userId], references: \[id])

}

```



\---



\# Mission



```prisma

model Mission {

&#x20; id            String @id @default(uuid())



&#x20; title         String

&#x20; description   String



&#x20; rewardPoints  Int



&#x20; users         UserMission\[]

}

```



\---



\# UserMission



```prisma

model UserMission {

&#x20; id          String @id @default(uuid())



&#x20; userId      String

&#x20; missionId   String



&#x20; status      MissionStatus



&#x20; user        User @relation(fields: \[userId], references: \[id])

&#x20; mission     Mission @relation(fields: \[missionId], references: \[id])

}

```



\---



\# Badge



```prisma

model Badge {

&#x20; id          String @id @default(uuid())



&#x20; name        String

&#x20; description String



&#x20; users       UserBadge\[]

}

```



\---



\# UserBadge



```prisma

model UserBadge {

&#x20; id          String @id @default(uuid())



&#x20; userId      String

&#x20; badgeId     String



&#x20; user        User @relation(fields: \[userId], references: \[id])

&#x20; badge       Badge @relation(fields: \[badgeId], references: \[id])



&#x20; earnedAt    DateTime @default(now())

}

```



\---



\# PointTransaction



```prisma

model PointTransaction {

&#x20; id          String @id @default(uuid())



&#x20; userId      String



&#x20; amount      Int



&#x20; type        PointType



&#x20; reason      String



&#x20; user        User @relation(fields: \[userId], references: \[id])



&#x20; createdAt   DateTime @default(now())

}

```



\---



\# Notification



```prisma

model Notification {

&#x20; id          String @id @default(uuid())



&#x20; userId      String



&#x20; title       String

&#x20; body        String



&#x20; readAt      DateTime?



&#x20; user        User @relation(fields: \[userId], references: \[id])



&#x20; createdAt   DateTime @default(now())

}

```



\---



\# V1 Database Scope



✅ Auth



✅ Users



✅ Schools



✅ Teams



✅ Competitions



✅ Matches



✅ Staff



✅ Missions



✅ Badges



✅ Points



✅ Notifications



\---



\# V2



\- Reward Store

\- Sponsor System

\- Fanta Leonessa

\- AI Assistant

\- Ticketing



\---



\# V3



\- Multi Tournament Platform

\- API Pubbliche

\- White Label Competitions



\---

