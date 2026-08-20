-- CreateEnum
CREATE TYPE "FantasyLineupStatus" AS ENUM ('STARTER', 'BENCH');

-- AlterTable
ALTER TABLE "FantasyTeamPlayer" ADD COLUMN "status" "FantasyLineupStatus" NOT NULL DEFAULT 'STARTER';
ALTER TABLE "FantasyTeamPlayer" ADD COLUMN "benchOrder" INTEGER;

-- CreateIndex
CREATE INDEX "FantasyTeamPlayer_fantasyTeamId_status_idx" ON "FantasyTeamPlayer"("fantasyTeamId", "status");

-- CreateTable
CREATE TABLE "FantasySubstitution" (
    "id" TEXT NOT NULL,
    "fantasyTeamId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "playerOutId" TEXT NOT NULL,
    "playerInId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FantasySubstitution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FantasySubstitution_matchId_idx" ON "FantasySubstitution"("matchId");

-- CreateIndex
CREATE INDEX "FantasySubstitution_fantasyTeamId_matchId_idx" ON "FantasySubstitution"("fantasyTeamId", "matchId");

-- CreateIndex
CREATE UNIQUE INDEX "FantasySubstitution_fantasyTeamId_matchId_playerOutId_key" ON "FantasySubstitution"("fantasyTeamId", "matchId", "playerOutId");

-- AddForeignKey
ALTER TABLE "FantasySubstitution" ADD CONSTRAINT "FantasySubstitution_fantasyTeamId_fkey" FOREIGN KEY ("fantasyTeamId") REFERENCES "FantasyTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FantasySubstitution" ADD CONSTRAINT "FantasySubstitution_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FantasySubstitution" ADD CONSTRAINT "FantasySubstitution_playerOutId_fkey" FOREIGN KEY ("playerOutId") REFERENCES "TeamMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FantasySubstitution" ADD CONSTRAINT "FantasySubstitution_playerInId_fkey" FOREIGN KEY ("playerInId") REFERENCES "TeamMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
