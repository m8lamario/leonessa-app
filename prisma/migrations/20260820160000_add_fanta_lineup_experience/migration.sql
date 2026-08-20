-- CreateTable
CREATE TABLE "FantasyLineupVacancy" (
    "id" TEXT NOT NULL,
    "fantasyTeamId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" "FantasyLineupStatus" NOT NULL,
    "benchOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FantasyLineupVacancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FantasyLineupConfirmation" (
    "id" TEXT NOT NULL,
    "fantasyTeamId" TEXT NOT NULL,
    "matchdayId" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FantasyLineupConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FantasyLineupVacancy_fantasyTeamId_role_status_key"
ON "FantasyLineupVacancy"("fantasyTeamId", "role", "status");

-- CreateIndex
CREATE INDEX "FantasyLineupVacancy_fantasyTeamId_status_idx"
ON "FantasyLineupVacancy"("fantasyTeamId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FantasyLineupConfirmation_fantasyTeamId_matchdayId_key"
ON "FantasyLineupConfirmation"("fantasyTeamId", "matchdayId");

-- CreateIndex
CREATE INDEX "FantasyLineupConfirmation_matchdayId_idx"
ON "FantasyLineupConfirmation"("matchdayId");

-- AddForeignKey
ALTER TABLE "FantasyLineupVacancy"
ADD CONSTRAINT "FantasyLineupVacancy_fantasyTeamId_fkey"
FOREIGN KEY ("fantasyTeamId") REFERENCES "FantasyTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FantasyLineupConfirmation"
ADD CONSTRAINT "FantasyLineupConfirmation_fantasyTeamId_fkey"
FOREIGN KEY ("fantasyTeamId") REFERENCES "FantasyTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FantasyLineupConfirmation"
ADD CONSTRAINT "FantasyLineupConfirmation_matchdayId_fkey"
FOREIGN KEY ("matchdayId") REFERENCES "FantasyMatchday"("id") ON DELETE CASCADE ON UPDATE CASCADE;
