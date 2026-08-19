-- CreateTable
CREATE TABLE "FantasyTeamTransfer" (
    "id" TEXT NOT NULL,
    "fantasyTeamId" TEXT NOT NULL,
    "matchdayId" TEXT NOT NULL,
    "freeTransfers" INTEGER NOT NULL DEFAULT 0,
    "paidTransfers" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FantasyTeamTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FantasyPlayerValueHistory" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "oldValue" INTEGER NOT NULL,
    "newValue" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FantasyPlayerValueHistory_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "FantasyMatchday" ADD COLUMN "valueUpdatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "FantasyTeamTransfer_fantasyTeamId_matchdayId_key" ON "FantasyTeamTransfer"("fantasyTeamId", "matchdayId");
CREATE INDEX "FantasyTeamTransfer_matchdayId_idx" ON "FantasyTeamTransfer"("matchdayId");
CREATE INDEX "FantasyPlayerValueHistory_playerId_createdAt_idx" ON "FantasyPlayerValueHistory"("playerId", "createdAt");

-- AddForeignKey
ALTER TABLE "FantasyTeamTransfer" ADD CONSTRAINT "FantasyTeamTransfer_fantasyTeamId_fkey" FOREIGN KEY ("fantasyTeamId") REFERENCES "FantasyTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FantasyTeamTransfer" ADD CONSTRAINT "FantasyTeamTransfer_matchdayId_fkey" FOREIGN KEY ("matchdayId") REFERENCES "FantasyMatchday"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FantasyPlayerValueHistory" ADD CONSTRAINT "FantasyPlayerValueHistory_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
