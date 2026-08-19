-- CreateTable
CREATE TABLE "FantasyMatchday" (
    "id" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FantasyMatchday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FantasyScore" (
    "id" TEXT NOT NULL,
    "fantasyTeamId" TEXT NOT NULL,
    "matchdayId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FantasyScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FantasyPlayerStat" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "yellowCards" INTEGER NOT NULL DEFAULT 0,
    "redCards" INTEGER NOT NULL DEFAULT 0,
    "matches" INTEGER NOT NULL DEFAULT 0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FantasyPlayerStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FantasyProcessedMatch" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FantasyProcessedMatch_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "TeamMember" ADD COLUMN "eslId" TEXT;
ALTER TABLE "MatchEvent" ADD COLUMN "eslId" TEXT;
ALTER TYPE "MatchEventType" ADD VALUE 'OWN_GOAL';

-- CreateIndex
CREATE UNIQUE INDEX "FantasyMatchday_round_key" ON "FantasyMatchday"("round");
CREATE UNIQUE INDEX "FantasyScore_fantasyTeamId_matchdayId_key" ON "FantasyScore"("fantasyTeamId", "matchdayId");
CREATE INDEX "FantasyScore_matchdayId_idx" ON "FantasyScore"("matchdayId");
CREATE UNIQUE INDEX "FantasyPlayerStat_playerId_key" ON "FantasyPlayerStat"("playerId");
CREATE UNIQUE INDEX "FantasyProcessedMatch_matchId_key" ON "FantasyProcessedMatch"("matchId");
CREATE UNIQUE INDEX "TeamMember_eslId_key" ON "TeamMember"("eslId");
CREATE UNIQUE INDEX "MatchEvent_eslId_key" ON "MatchEvent"("eslId");

-- AddForeignKey
ALTER TABLE "FantasyScore" ADD CONSTRAINT "FantasyScore_fantasyTeamId_fkey" FOREIGN KEY ("fantasyTeamId") REFERENCES "FantasyTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FantasyScore" ADD CONSTRAINT "FantasyScore_matchdayId_fkey" FOREIGN KEY ("matchdayId") REFERENCES "FantasyMatchday"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FantasyPlayerStat" ADD CONSTRAINT "FantasyPlayerStat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FantasyProcessedMatch" ADD CONSTRAINT "FantasyProcessedMatch_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
